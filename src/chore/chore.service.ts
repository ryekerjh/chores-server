import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { CreateChoreDto } from './dto/create-chore.dto';
import { UpdateChoreDto } from './dto/update-chore.dto';
import { Chore } from './entities/chore.entity';
import * as _ from 'lodash'

@Injectable()
export class ChoreService {
  @Inject(UserService)
  private readonly userService: UserService;
  
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
        userChildren.forEach(uc => {
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

 async update(id: string, updateChoreDto: UpdateChoreDto) {
  return await this.ChoreModel.findOneAndUpdate({ _id: id }, updateChoreDto, { returnDocument: 'after'})
}

  async remove(id: string) {
    return await this.ChoreModel.findOneAndDelete({ _id: id })

  }
}
