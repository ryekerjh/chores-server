import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Alert } from './entities/alert.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AlertService {
  @Inject(UserService)
  private readonly userService: UserService;
  
  constructor(
    @InjectModel('Alert') private AlertModel: Model<Alert>,
    ) {}

  async create(createAlertDto: CreateAlertDto) {
   try {
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
      if (!allAlerts) throw new Error("no records found")
        return allAlerts;
      } catch(err) {
        throw err;
      }  
  }

  async findOne(id: string) {
    try {
      const thisAlert = await this.AlertModel.findOne({_id: id}).exec();
      if (!thisAlert) throw new Error("no record found")
        return thisAlert;
      } catch(err) {
        throw err;
      }  
  }

  async findAllByUser(userId: string) {
    try {
      const requestingUser = await this.userService.findOne(userId);
      const lookupPromises = requestingUser.alerts.map(async alertId => await this.AlertModel.findOne({_id: alertId}));
      const alerts = await Promise.all(lookupPromises);
      return alerts;
    } catch(err) {
      throw err;
    }
  }

  async update(id: string, updateAlertDto: UpdateAlertDto) {
    return await this.AlertModel.findOneAndUpdate({ _id: id }, updateAlertDto, { returnDocument: 'after' })
  }

  async remove(id: string) {
    return await this.AlertModel.findOneAndDelete({ _id: id })
  }
}
