import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { ChildService } from 'src/child/child.service';
import { CreateChoreDto } from './dto/create-chore.dto';
import { UpdateChoreDto } from './dto/update-chore.dto';
import { Chore } from './entities/chore.entity';
import * as _ from 'lodash'
import { UpdateChoreWithAssignees } from './chore.controller';

@Injectable()
export class ChoreService {
  @Inject(UserService)
  private readonly userService: UserService;
  @Inject(ChildService)
  private readonly childService: ChildService;
  
  constructor(
    @InjectModel('Chore') private ChoreModel: Model<Chore>
    ) {}

  async create(createChoreDto: CreateChoreDto, requestor: string) {
    try {
      createChoreDto.createdBy = requestor as unknown as User;
      const newChore = await this.ChoreModel.create(createChoreDto);
      const savedChore = await newChore.save();
      return savedChore;
    } catch (err) {
      throw err;
    }
  }

  async findAll() {
    try {
      const allChores = await this.ChoreModel.find({}).exec();
      if (!allChores) throw new Error("no records found")
        return allChores;
      } catch(err) {
        throw err;
      }  
  }

  async findAllByUser(userId: string) {
    try {
      const theseChores = await this.ChoreModel.find({ createdBy: userId as any }).exec();
      if (!theseChores?.length) throw new Error("no chores found")
      const user = await this.userService.findOne(userId);
      const userChildren = user?.children;
      const newArray = [];
      const choresCopy = theseChores.forEach(c => {
        let shallowCopy = { ...(c as any).toObject() };
        shallowCopy['assignees'] = [];
        userChildren?.forEach(uc => {
          uc.chores.forEach(ucc => {
            if (ucc['_id'].toString() === c['id'].toString()) {
              shallowCopy['assignees'].push(uc['_id'].toString()); 
            }
          })
        })
        newArray.push(shallowCopy);
      });
      return newArray;
      } catch(err) {
        throw err;
      }  
  }

  async findOne(id: string) {
    try {
      const thisChore = await this.ChoreModel.findOne({_id: id}).exec();
      if (!thisChore) throw new Error("no record found")
        return thisChore;
      } catch(err) {
        throw err;
      }  
  }

 async update(id: string, updateChoreDto: UpdateChoreWithAssignees) {
  const { chore, originalAssignees } = updateChoreDto;
  const assigneesToDeleteChoreFrom = _.difference(originalAssignees, chore.assignees);
  const assigneesToWhomToAddChore = _.difference(chore.assignees, originalAssignees);

  await Promise.all([
    ...assigneesToDeleteChoreFrom.map((childId) =>
      this.childService.update(childId, { $pull: { chores: id } } as any),
    ),
    ...assigneesToWhomToAddChore.map((childId) =>
      this.childService.update(childId, { $addToSet: { chores: id } } as any),
    ),
  ]);

  const { assignees, ...choreFields } = chore;
  return await this.ChoreModel.findOneAndUpdate(
    { _id: id },
    choreFields,
    { returnDocument: 'after' },
  );
}

  async remove(id: string) {
    return await this.ChoreModel.findOneAndDelete({ _id: id })

  }
}
