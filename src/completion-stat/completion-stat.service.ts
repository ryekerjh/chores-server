import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CompletionStat,
  CompletionStatDocument,
} from './entities/completion-stat.entity';

export interface UpsertCompletionStatInput {
  childId: string;
  parentId: string;
  date: string;
  dayPart: 'am' | 'pm' | string;
  completed: number;
  total: number;
}

@Injectable()
export class CompletionStatService {
  private readonly logger = new Logger(CompletionStatService.name);

  constructor(
    @InjectModel('CompletionStat')
    private CompletionStatModel: Model<CompletionStatDocument>,
  ) {}

  async upsertDailyStat(input: UpsertCompletionStatInput) {
    const dayPart = input.dayPart?.toLowerCase();
    if (dayPart !== 'am' && dayPart !== 'pm') {
      this.logger.warn(`Skipping completion stat upsert for invalid dayPart: ${input.dayPart}`);
      return null;
    }

    if (!input.total || input.total <= 0) {
      return null;
    }

    const completed = Math.max(0, Math.min(input.completed, input.total));
    const rate = Number((completed / input.total).toFixed(4));

    try {
      return await this.CompletionStatModel.findOneAndUpdate(
        {
          childId: new Types.ObjectId(input.childId),
          date: input.date,
          dayPart,
        },
        {
          $set: {
            parentId: new Types.ObjectId(input.parentId),
            completed,
            total: input.total,
            rate,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      );
    } catch (err) {
      this.logger.error('Failed to upsert completion stat', err as Error);
      throw err;
    }
  }

  async findByParent(parentId: string, limit = 90) {
    const stats = await this.CompletionStatModel.find({
      parentId: new Types.ObjectId(parentId),
    })
      .sort({ date: -1, childId: 1, dayPart: 1 })
      .limit(Math.min(Math.max(limit, 1), 365) * 4)
      .lean()
      .exec();

    return this.withRunningAverages(stats);
  }

  async findByChild(childId: string, limit = 60) {
    const stats = await this.CompletionStatModel.find({
      childId: new Types.ObjectId(childId),
    })
      .sort({ date: -1, dayPart: 1 })
      .limit(Math.min(Math.max(limit, 1), 365) * 2)
      .lean()
      .exec();

    return this.withRunningAverages(stats);
  }

  private withRunningAverages(stats: CompletionStat[]) {
    const byChild: Record<
      string,
      { completedSum: number; totalSum: number; count: number }
    > = {};

    // Process oldest → newest so running average reflects history through each day
    const chronological = [...stats].reverse();
    const enrichedChronological = chronological.map((stat) => {
      const childKey = stat.childId.toString();
      if (!byChild[childKey]) {
        byChild[childKey] = { completedSum: 0, totalSum: 0, count: 0 };
      }
      byChild[childKey].completedSum += stat.completed;
      byChild[childKey].totalSum += stat.total;
      byChild[childKey].count += 1;

      const runningAverageRate =
        byChild[childKey].totalSum > 0
          ? Number(
              (byChild[childKey].completedSum / byChild[childKey].totalSum).toFixed(4),
            )
          : 0;

      return {
        ...stat,
        childId: childKey,
        parentId: stat.parentId.toString(),
        runningAverageRate,
        runningAveragePercent: Number((runningAverageRate * 100).toFixed(1)),
        ratePercent: Number((stat.rate * 100).toFixed(1)),
      };
    });

    return enrichedChronological.reverse();
  }
}
