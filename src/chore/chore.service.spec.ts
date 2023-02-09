import { Test, TestingModule } from '@nestjs/testing';
import { ChoreService } from './chore.service';

describe('ChoreService', () => {
  let service: ChoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChoreService],
    }).compile();

    service = module.get<ChoreService>(ChoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
