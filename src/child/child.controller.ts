import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UpdateChoreDto } from 'src/chore/dto/update-chore.dto';
import { ChildService } from './child.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Controller('child')
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post()
  create(@Body() createChildDto: CreateChildDto) {
    return this.childService.create(createChildDto);
  }

  @Get()
  findAll() {
    return this.childService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.childService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChildDto: UpdateChildDto) {
    return this.childService.update(id, updateChildDto);
  }

  @Patch(':childId/mark-chore-done')
  markChoreAsDone(@Param('childId') childId: string, @Body() body: {choreId: string}) {
    return this.childService.markChoreAsDone(childId, body.choreId)
  }

  @Patch(':childId/cancel-chore-done')
  markChoreAsNotDone(@Param('childId') childId: string, @Body() body: {choreId: string}) {
    console.log(childId, "<<>>",  body)
    return this.childService.markChoreAsNotDone(childId, body.choreId)
  }

  @Patch(':parentId/add-alert-to-parent/:alertId')
  addAlertToParentUser(@Param('parentId') parentId: string, @Param('alertId') alertId: string) {
    return this.childService.addAlertToParentUser(parentId, alertId)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.childService.remove(id);
  }
}
