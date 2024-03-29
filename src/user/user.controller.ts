import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type UpdateAlertByOwner = {
  alertId: string;
}
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('check-pin')
  async checkPin(@Body() body: { pin: number}, @Request() req) {
    try {
      return await this.userService.checkPin(body.pin, req.user.userId);
    } catch(err) {
      return err;
    }
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':userId/get-children')
  async findChildrenByUser(@Param('userId') userId: string) {
    return await this.userService.getChildrenByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get(':id/get-tasks')
  async findUserTasks(@Param('id') id: string) {
    return await this.userService.findUserTasks(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/update-role')
  async updateUserRole(@Param('id') id: string, @Body() role: { role: string}) {
    return await this.userService.updateUserRole(id, role.role)
  }

  @Patch(':id/remove-task')
  removeAlertFromUser(@Param('id') id: string, @Body() alertId: UpdateAlertByOwner) {
    return this.userService.removeAlertFromUser(id, alertId.alertId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
