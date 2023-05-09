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
      const theseChores = await this.ChoreModel.find({createdBy: userId}).exec();
      if (!theseChores?.length) throw new Error("no chores found")
      const user = await this.userService.findOne(userId);
      const userChildren = user?.children;
      const newArray = [];
      const choresCopy = theseChores.forEach(c => {
        let shallowCopy = {...c.toObject()};
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
  // TODO: remove chore from Child if they are not in the assignees array that gets passed in
  const { chore, originalAssignees } = updateChoreDto;
    const assigneesToDeleteChoreFrom = _.difference(originalAssignees, chore.assignees);
    const assigneesToWhomToAddChore = _.difference(chore.assignees, originalAssignees);
  // We must add this chore to all users in the chore.assignees array and remove it from any users that have it that aren't in this array
  const childRemovalUpdates = Promise.all(assigneesToDeleteChoreFrom.map(async childFromWhomToDeleteChore => {
    const childToUpdate = await this.childService.findOne(childFromWhomToDeleteChore);
    childToUpdate.chores.splice(childToUpdate.chores.findIndex(ch => ch['_id'] === id), 1);
    console.log(childToUpdate.chores, "<--- updated chores for child it was removed from", id);
    await this.childService.update(childFromWhomToDeleteChore, childToUpdate);
  }));
  const childAdditionUpdates = Promise.all(assigneesToWhomToAddChore.map(async childToWhomToAddChore => {
    const childToUpdate = await this.childService.findOne(childToWhomToAddChore);
    childToUpdate.chores.push(id as any);
    console.log(childToUpdate.chores, "<--- updated chores for child it was added to", id);
    await this.childService.update(childToWhomToAddChore, {...childToUpdate, $addToSet: {chores: id} } as any);
  }));

  await [...await childRemovalUpdates, ...await childAdditionUpdates];
  // this.childService.update()
  return await this.ChoreModel.findOneAndUpdate({ _id: id }, updateChoreDto, { returnDocument: 'after'})
}

  async remove(id: string) {
    return await this.ChoreModel.findOneAndDelete({ _id: id })

  }
}
