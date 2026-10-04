import { Test, TestingModule } from '@nestjs/testing';
import { DiaryAnalysisController } from './diary_analysis.controller';
import { DiaryAnalysisService } from './diary_analysis.service';

describe('DiaryAnalysisController', () => {
  let controller: DiaryAnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiaryAnalysisController],
      providers: [DiaryAnalysisService],
    }).compile();

    controller = module.get<DiaryAnalysisController>(DiaryAnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
