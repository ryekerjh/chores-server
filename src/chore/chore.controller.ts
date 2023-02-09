import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChoreService } from './chore.service';
import { CreateChoreDto } from './dto/create-chore.dto';
import { UpdateChoreDto } from './dto/update-chore.dto';

@Controller('chore')
export class ChoreController {
  constructor(private readonly choreService: ChoreService) {}

  @Post()
  create(@Body() createChoreDto: CreateChoreDto) {
    return this.choreService.create(createChoreDto);
  }

  @Get()
  findAll() {
    return this.choreService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.choreService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChoreDto: UpdateChoreDto) {
    return this.choreService.update(id, updateChoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.choreService.remove(id);
  }
}
