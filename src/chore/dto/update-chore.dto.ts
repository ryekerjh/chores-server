import { PartialType } from '@nestjs/mapped-types';
import { CreateChoreDto } from './create-chore.dto';

export class UpdateChoreDto extends PartialType(CreateChoreDto) {
    originalAssignees?: string[];
}
