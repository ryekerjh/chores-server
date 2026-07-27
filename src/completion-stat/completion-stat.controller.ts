import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { CompletionStatService } from './completion-stat.service';

@Controller('completion-stat')
export class CompletionStatController {
  constructor(private readonly completionStatService: CompletionStatService) {}

  @Get('by-parent/:parentId')
  findByParent(
    @Param('parentId') parentId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 90;
    return this.completionStatService.findByParent(
      parentId,
      Number.isFinite(parsedLimit) ? parsedLimit : 90,
    );
  }

  @Get('by-child/:childId')
  findByChild(
    @Param('childId') childId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 60;
    return this.completionStatService.findByChild(
      childId,
      Number.isFinite(parsedLimit) ? parsedLimit : 60,
    );
  }

  @Get('me')
  findMine(@Request() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 90;
    return this.completionStatService.findByParent(
      req?.user?.userId,
      Number.isFinite(parsedLimit) ? parsedLimit : 90,
    );
  }
}
