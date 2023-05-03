import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity'

export class UserService {
  constructor(
    @InjectModel('User') private UserModel: Model<User>,
    ) { }
  
    async create(createUserDto: CreateUserDto) {
      try {
        createUserDto.role = 'admin';
        const newUser = await this.UserModel.create(createUserDto);
        const savedUser = await newUser.save();
        return savedUser;
      } catch (err) {
        throw err
      }
  }

  async findAll() {
    try {
    const allUsers = await this.UserModel.find({}, {role: 0}).populate({ 
      path: 'children',
      populate: {
        path: 'alerts',
        model: 'Alert'
      } 
   }).exec();
    if (!allUsers) throw new Error("no records found")
      return allUsers;
    } catch(err) {
      throw err;
    }  
  }

  async findOne(id: string) {
    try {
    const thisUser = await this.UserModel
    .findOne({_id: id})
    .populate({ 
      path: 'children',
      populate: {
        path: 'alerts',
        model: 'Alert'
      }, 
   })
   .populate('alerts')
   .exec();
    if (!thisUser) throw new Error("no record found")
      return thisUser;
    } catch(err) {
      throw err;
    }  
  }

  async findOneByEmail(email: string) {
    try {
    const thisUser = await this.UserModel.findOne({email}).select('+password').exec();
    if (!thisUser) throw new Error(`No user with the email address ${email} exists.`)
      return thisUser;
    } catch(err) {
      throw err;
    }  
  }

  async findUserTasks(id: string) {
    try {
      const user = await this.UserModel.findOne({_id: id }).populate('alerts').exec();
      return user.alerts;
    } catch (err) {
      throw err;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    delete updateUserDto.role;
    return await this.UserModel.findOneAndUpdate({ _id: id }, updateUserDto, { returnDocument: 'after', populate: { 
      path: 'children',
      populate: {
        path: 'alerts',
        model: 'Alert'
      } 
   }})
  }

  async updateUserRole(id: string, role: string) {
    try {
    await this.UserModel.findOneAndUpdate({ _id: id }, { role });
    return { message: `Successfully updated the role to ${role}`}
    } catch(err) {
      return new Error(`We could not update the role because ${err.message}.`)
    }
  }

  async remove(id: string) {
    return await this.UserModel.findOneAndDelete({ _id: id })
  }

  async getChildrenByUser(userId: string) {
    const user = await this.UserModel.findOne({ _id: userId}).populate({ 
      path: 'children',
      populate: [{
        path: 'alerts',
        model: 'Alert'
      },{
        path: 'chores',
        model: 'Chore'
      }]  
   }).exec();
    return user.children;
  }
  
  async removeAlertFromUser(id: string, alertId: string) {
    const user = await this.UserModel.findOne({ _id: id });
    user.alerts = user?.alerts?.filter(alert => alert.toString() !== alertId);
    return await this.UserModel.findOneAndUpdate({ _id: id }, user, { returnDocument: 'after', populate: { 
      path: 'children',
      populate: {
        path: 'alerts',
        model: 'Alert'
      } 
   }});
  }

  async checkPin(pin: number, userId: string) {
    try {
      const pinMatch = await this.UserModel.findOne({ _id: userId, pin});
      return !!pinMatch;
    } catch (err) {
      throw err;
    }
  }
}

