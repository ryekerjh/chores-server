import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateChoreDto } from './dto/create-chore.dto';
import { UpdateChoreDto } from './dto/update-chore.dto';
import { Chore } from './entities/chore.entity';

@Injectable()
export class ChoreService {
  constructor(
    @InjectModel('Chore') private ChoreModel: Model<Chore>,
    ) {}

  async create(createChoreDto: CreateChoreDto) {
    try {
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
