import { Test, TestingModule } from '@nestjs/testing';
import { DiaryAnalysisService } from './diary_analysis.service';

describe('DiaryAnalysisService', () => {
  let service: DiaryAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiaryAnalysisService],
    }).compile();

    service = module.get<DiaryAnalysisService>(DiaryAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
