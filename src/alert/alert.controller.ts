import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { AlertService, UpdateAlertWithAssignees } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  create(@Body() createAlertDto: CreateAlertDto, @Request() req) {
    return this.alertService.create(createAlertDto, req?.user?.userId);
  }

  @Get()
  findAll() {
    return this.alertService.findAll();
  }

  @Get('alerts-for-user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.alertService.findAllByUser(userId);
  }

  @Get('tasks-by-user/:userId')
  findAllTasksByUser(@Param('userId') userId: string) {
    return this.alertService.findAllTasksByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertWithAssignees) {
    return this.alertService.update(id, updateAlertDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertService.remove(id);
  }
}
