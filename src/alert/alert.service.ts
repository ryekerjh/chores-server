import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as _ from 'lodash';
import { ChildService } from 'src/child/child.service';
import { UserService } from 'src/user/user.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Alert, AlertDocument } from './entities/alert.entity';

export interface UpdateAlertWithAssignees {
  alert: UpdateAlertDto & { assignees: string[] };
  originalAssignees: string[];
}

@Injectable()
export class AlertService {
  constructor(
    @InjectModel('Alert') private AlertModel: Model<AlertDocument>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => ChildService))
    private childService: ChildService,
  ) {}

  async create(createAlertDto: CreateAlertDto, requestor: string) {
    try {
      createAlertDto.createdBy = requestor as any;
      const newAlert = await this.AlertModel.create(createAlertDto);
      const savedAlert = await newAlert.save();
      return savedAlert;
    } catch (err) {
      throw err;
    }
  }

  async findAll() {
    try {
      const allAlerts = await this.AlertModel.find({}).exec();
      const allChildren = await this.childService.findAll();

      return allAlerts.map((alert) => {
        const shallowCopy = { ...(alert as any).toObject(), assignees: [] as string[] };
        allChildren?.forEach((child) => {
          child.alerts?.forEach((a) => {
            if (((a as any)._id || a).toString() === (alert as any)._id.toString()) {
              shallowCopy.assignees.push((child as any)._id.toString());
            }
          });
        });
        return shallowCopy;
      });
    } catch (err) {
      throw err;
    }
  }

  async findAllByUser(userId: string) {
    try {
      const user = await this.userService.findOne(userId);
      const alertIds = user?.alerts?.map((a) => ((a as any)._id || a).toString()) || [];
      const allAlerts = await this.AlertModel.find({
        _id: { $in: alertIds },
      } as any).exec();
      if (!allAlerts) throw new Error('no records found');
      return allAlerts;
    } catch (err) {
      throw err;
    }
  }

  async findAllTasksByUser(userId: string) {
    try {
      const user = await this.userService.findOne(userId);
      const userChildren = user?.children;

      const createdByUser = await this.AlertModel.find({ createdBy: userId }).exec();

      const alertIdsFromChildren = new Set<string>();
      userChildren?.forEach((child) => {
        child.alerts?.forEach((alert) => {
          const id = ((alert as any)._id || alert).toString();
          alertIdsFromChildren.add(id);
        });
      });

      const legacyAlerts = await this.AlertModel.find({
        _id: { $in: [...alertIdsFromChildren] },
        $or: [{ createdBy: { $exists: false } }, { createdBy: null }],
      }).exec();

      const allAlerts = [...createdByUser];
      legacyAlerts.forEach((alert) => {
        if (!allAlerts.find((a) => a._id.toString() === alert._id.toString())) {
          allAlerts.push(alert);
        }
      });

      return allAlerts.map((alert) => {
        const shallowCopy = { ...(alert as any).toObject(), assignees: [] };
        userChildren?.forEach((child) => {
          child.alerts?.forEach((a) => {
            if (((a as any)._id || a).toString() === (alert as any)._id.toString()) {
              shallowCopy.assignees.push((child as any)._id.toString());
            }
          });
        });
        return shallowCopy;
      });
    } catch (err) {
      throw err;
    }
  }

  async findOne(id: string) {
    try {
      const thisAlert = await this.AlertModel.findOne({ _id: id }).exec();
      if (!thisAlert) throw new Error('no record found');
      const allChildren = await this.childService.findAll();
      const assignees: string[] = [];
      allChildren?.forEach((child) => {
        child.alerts?.forEach((a) => {
          if (((a as any)._id || a).toString() === (thisAlert as any)._id.toString()) {
            assignees.push((child as any)._id.toString());
          }
        });
      });
      return { ...(thisAlert as any).toObject(), assignees };
    } catch (err) {
      throw err;
    }
  }

  async update(id: string, updateAlertDto: UpdateAlertWithAssignees) {
    const { alert, originalAssignees } = updateAlertDto;
    const assigneesToRemove = _.difference(originalAssignees, alert.assignees);
    const assigneesToAdd = _.difference(alert.assignees, originalAssignees);

    await Promise.all([
      ...assigneesToRemove.map((childId) =>
        this.childService.update(childId, { $pull: { alerts: id } } as any),
      ),
      ...assigneesToAdd.map((childId) =>
        this.childService.update(childId, { $addToSet: { alerts: id } } as any),
      ),
    ]);

    const { assignees, ...alertFields } = alert;
    return await this.AlertModel.findOneAndUpdate(
      { _id: id },
      alertFields,
      { returnDocument: 'after' },
    );
  }

  async remove(id: string) {
    try {
      await this.childService.pullAlertFromAllChildren(id);
      await this.userService.pullAlertFromAllUsers(id);
      return await this.AlertModel.findOneAndDelete({ _id: id });
    } catch (err) {
      throw err;
    }
  }
}