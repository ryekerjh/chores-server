import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import moment from 'moment';
import { UserService } from 'src/user/user.service';
import { CompletionStatService } from 'src/completion-stat/completion-stat.service';
import { NotificationService } from 'src/notification/notification.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { Child, ChildDocument } from './entities/child.entity';
import { Chore } from 'src/chore/entities/chore.entity';
import { User } from 'src/user/entities/user.entity';
import { Alert } from 'src/alert/entities/alert.entity';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

@Injectable()
export class ChildService {
  private readonly logger = new Logger(ChildService.name);

  constructor(
    @InjectModel('Child') private ChildModel: Model<ChildDocument>,
    @InjectModel('Chore') private ChoreModel: Model<Chore>,
    @InjectModel('User') private UserModel: Model<User>,
    @InjectModel('Alert') private AlertModel: Model<Alert>,
    private userService: UserService,
    private readonly completionStatService: CompletionStatService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createChildDto: CreateChildDto) {
    try {
      const newChild = await this.ChildModel.create(createChildDto);
      const savedChild = await newChild.save();
      return savedChild;
    } catch (err) {
      throw err;
    }
  }

  async findAll() {
    try {
      const allChildren = await this.ChildModel.find({})
        .populate('alerts chores')
        .exec();
      if (!allChildren) throw new Error('no records found');
      return allChildren;
    } catch (err) {
      throw err;
    }
  }

  async findOne(id: string) {
    try {
      const thisChild = await this.ChildModel.findOne({ _id: id })
        .populate('chores alerts')
        .exec();
      if (!thisChild) throw new Error('no record found');
      return thisChild;
    } catch (err) {
      throw err;
    }
  }

  async update(id: string, updateChildDto: UpdateChildDto) {
    return await this.ChildModel.findOneAndUpdate(
      { _id: id },
      updateChildDto,
      { returnDocument: 'after', populate: 'chores alerts' }
    );
  }

  async markChoreAsDone(childId: string, chore: string) {
    const completedChore = {
      _id: chore,
      dateCompleted: new Date(),
    };
    const outDatedChild = await this.ChildModel.findOne({ _id: childId });
    const updatedCompletedChoresList = [
      ...outDatedChild.completedChores,
      completedChore,
    ];
    const updatedChild = await this.ChildModel.findOneAndUpdate(
      { _id: childId },
      { completedChores: updatedCompletedChoresList },
      { returnDocument: 'after', populate: 'chores alerts' }
    );
    const syncResult = await this.syncCompletionStat(childId, chore, updatedChild);
    await this.notifyChoreProgress(updatedChild, chore, syncResult, true);
    return updatedChild;
  }

  async markChoreAsNotDone(childId: string, chore: string) {
    const outDatedChild = await this.ChildModel.findOne({ _id: childId });
    const updatedCompletedChoresList = outDatedChild.completedChores.filter(
      (c) => c._id.toString() !== chore
    );
    const updatedChild = await this.ChildModel.findOneAndUpdate(
      { _id: childId },
      { completedChores: updatedCompletedChoresList },
      { returnDocument: 'after', populate: 'chores alerts' }
    );
    await this.syncCompletionStat(childId, chore, updatedChild);
    return updatedChild;
  }

  private isCompletedToday(dateCompleted: string | Date) {
    const completedAt = new Date(dateCompleted);
    const today = new Date();
    return (
      completedAt.getDate() === today.getDate() &&
      completedAt.getMonth() === today.getMonth() &&
      completedAt.getFullYear() === today.getFullYear()
    );
  }

  private formatDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private async syncCompletionStat(
    childId: string,
    choreId: string,
    child: ChildDocument,
  ): Promise<{
    parentId?: string;
    dayPart?: string;
    completed?: number;
    total?: number;
    choreName?: string;
  } | null> {
    try {
      const chore = await this.ChoreModel.findById(choreId).lean().exec();
      if (!chore?.dayPart) return null;

      const dayPart = chore.dayPart.toLowerCase();
      const todayName = DAYS_OF_WEEK[new Date().getDay()];
      const dayPartChores = (child.chores || []).filter((c: any) => {
        const part = (c.dayPart || '').toLowerCase();
        const days = c.days || [];
        return part === dayPart && days.includes(todayName);
      });

      const total = dayPartChores.length;
      if (!total) return null;

      const completed = dayPartChores.filter((c: any) =>
        (child.completedChores || []).some(
          (cc) =>
            cc._id.toString() === c._id.toString() &&
            this.isCompletedToday(cc.dateCompleted),
        ),
      ).length;

      const parent = await this.UserModel.findOne({
        children: new Types.ObjectId(childId),
      } as any)
        .select('_id')
        .lean()
        .exec();
      if (!parent?._id) {
        this.logger.warn(`No parent found for child ${childId}; skipping completion stat`);
        return null;
      }

      await this.completionStatService.upsertDailyStat({
        childId,
        parentId: parent._id.toString(),
        date: this.formatDateKey(),
        dayPart,
        completed,
        total,
      });

      return {
        parentId: parent._id.toString(),
        dayPart,
        completed,
        total,
        choreName: chore.name,
      };
    } catch (err) {
      // Completion tracking should not block chore toggles
      this.logger.error('Failed to sync completion stat', err as Error);
      return null;
    }
  }

  private async notifyChoreProgress(
    child: ChildDocument,
    choreId: string,
    syncResult: {
      parentId?: string;
      dayPart?: string;
      completed?: number;
      total?: number;
      choreName?: string;
    } | null,
    isMarkDone: boolean,
  ) {
    if (!isMarkDone || !syncResult?.parentId) return;

    const childName = child.name || 'Your child';
    const choreName = syncResult.choreName || 'a chore';

    try {
      if (
        syncResult.total > 0 &&
        syncResult.completed === syncResult.total
      ) {
        await this.notificationService.sendToUser(syncResult.parentId, {
          title: `${childName} cleared ${syncResult.dayPart?.toUpperCase()} chores!`,
          body: `${childName} finished all ${syncResult.total} ${syncResult.dayPart?.toUpperCase()} chores for today.`,
          data: {
            type: 'day_part_complete',
            childId: (child as any)._id?.toString(),
            dayPart: syncResult.dayPart,
          },
        });
      } else {
        await this.notificationService.sendToUser(syncResult.parentId, {
          title: `${childName} finished a chore`,
          body: `${childName} completed “${choreName}” (${syncResult.completed}/${syncResult.total} ${syncResult.dayPart?.toUpperCase()}).`,
          data: {
            type: 'chore_done',
            childId: (child as any)._id?.toString(),
            choreId,
            dayPart: syncResult.dayPart,
          },
        });
      }
    } catch (err) {
      this.logger.error('Failed to send chore progress push', err as Error);
    }
  }

  async pullAlertFromAllChildren(alertId: string) {
    return await this.ChildModel.updateMany(
      { alerts: alertId } as any,
      { $pull: { alerts: alertId } },
    );
  }

  async addAlertToParentUser(parentId: string, alertId: string) {
    function dedupeIDs(objectIDs) {
      const ids = {};
      objectIDs.forEach((_id) => (ids[_id.toString()] = _id));
      return Object.values(ids);
    }

    const parent = await this.userService.findOne(parentId);
    const updatedParentAlerts = [...parent.alerts, alertId];
    const updatedUser = await this.userService.update(parentId, {
      alerts: dedupeIDs(updatedParentAlerts) as any,
    });

    try {
      const alert = await this.AlertModel.findById(alertId).lean().exec();
      const alertName = alert?.name || 'an update';
      await this.notificationService.sendToUser(parentId, {
        title: 'Kid alert',
        body: `Someone needs you to know: ${alertName}`,
        data: {
          type: 'alert',
          alertId,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send alert push', err as Error);
    }

    return updatedUser.alerts;
  }

  async remove(id: string) {
    return await this.ChildModel.findOneAndDelete({ _id: id });
  }

  @Cron('50 23 * * 0') // Every Sunday at 11:50 PM
  async handleCron() {
    this.logger.debug('Running cleanup job for completed chores');

    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();

    try {
      // Fetch all Child records that have completedChores older than 30 days
      const children = await this.ChildModel.find({
        'completedChores.dateCompleted': { $lt: thirtyDaysAgo },
      } as any);

      // Iterate over each child and update the completedChores array
      for (const child of children) {
        child.completedChores = child.completedChores.filter((chore) => {
          // Convert the string to a Date object
          const choreDate = new Date(chore.dateCompleted);
      
          // Compare the date
          return choreDate >= thirtyDaysAgo;
        });
      
        // Save the updated Child document
        await child.save();
      }

      this.logger.debug(`Cleanup completed for ${children.length} children.`);
    } catch (error) {
      this.logger.error('Failed to run cleanup job', error);
    }
  }
}
