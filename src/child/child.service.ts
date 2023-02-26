import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { Child } from './entities/child.entity';
import { uniqBy } from 'lodash';

@Injectable()
export class ChildService {
  constructor(
    @InjectModel('Child') private ChildModel: Model<Child>,
    private userService: UserService
    ) { }

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
      const allChildren = await this.ChildModel.find({}).populate('alerts chores').exec();
      if (!allChildren) throw new Error("no records found")
        return allChildren;
      } catch(err) {
        throw err;
      }  
  }

  async findOne(id: string) {
    try {
      const thisChild = await this.ChildModel.findOne({_id: id}).populate('chores alerts').exec();
      if (!thisChild) throw new Error("no record found")
        return thisChild;
      } catch(err) {
        throw err;
      }  
  }

  async update(id: string, updateChildDto: UpdateChildDto) {
    return await this.ChildModel.findOneAndUpdate({ _id: id }, updateChildDto, { returnDocument: 'after', populate: 'chores alerts'})
  }

  async markChoreAsDone(childId: string, chore: string) {
    const completedChore = {
      _id: chore,
      dateCompleted: new Date()
    }
    const outDatedChild = await this.ChildModel.findOne({_id: childId});
    const updatedCompletedChoresList = [...outDatedChild.completedChores, completedChore];
    return await this.ChildModel.findOneAndUpdate({ _id: childId }, {completedChores: updatedCompletedChoresList}, { returnDocument: 'after', populate: 'chores alerts'})
  }
  
  async markChoreAsNotDone(childId: string, chore: string) {
    const outDatedChild = await this.ChildModel.findOne({_id: childId});
    const updatedCompletedChoresList = outDatedChild.completedChores.filter(c => c._id.toString() !== chore);
    return await this.ChildModel.findOneAndUpdate({ _id: childId }, {completedChores: updatedCompletedChoresList}, { returnDocument: 'after', populate: 'chores alerts'})
  }
  

  async addAlertToParentUser(parentId: string, alertId: string) {
    function dedupeIDs(objectIDs) {
      const ids = {}
      objectIDs.forEach(_id => (ids[_id.toString()] = _id))
      return Object.values(ids)
    }

    const parent = await this.userService.findOne(parentId);
    const updatedParentAlerts = [...parent.alerts, alertId];
    await this.userService.update(parentId, {alerts: dedupeIDs(updatedParentAlerts) as any})
    return dedupeIDs(updatedParentAlerts);
  }

  async remove(id: string) {
    return await this.ChildModel.findOneAndDelete({ _id: id })
  }
}
