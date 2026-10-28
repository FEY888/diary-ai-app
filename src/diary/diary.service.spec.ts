import { describe, beforeEach, jest, it, expect } from '@jest/globals';
import { DiaryService } from './diary.service';
import { Diary } from './entities/diary.entity';
import { DiaryAnalysis } from '../diary_analysis/entities/diary_analysis.entity';

describe('DiaryService', () => {
    let service : DiaryService;

    const diaryRepositoryMock = {
        findOne: jest.fn<() => Promise<any>>(),
        merge: jest.fn(),
    };

    const usersServiceMock = {};

    const transactionDiaryRepositoryMock = {
        save: jest.fn(),
    };

    const transactionAnalysisRepositoryMock = {
        delete: jest.fn(),
    };

    const managerMock = {
        getRepository: jest.fn(),
    };

    const dataSourceMock = {
        transaction: jest.fn(),
    };

    beforeEach(() => {
        jest.resetAllMocks();

        managerMock.getRepository.mockImplementation((entity) => {
            if(entity === Diary) {
                return transactionDiaryRepositoryMock;
            }
            if(entity === DiaryAnalysis) {
                return transactionAnalysisRepositoryMock;
            }
        });

        dataSourceMock.transaction.mockImplementation(async (callback: any) => {
                return callback(managerMock);
        });

        service = new DiaryService(
            diaryRepositoryMock as any,
            usersServiceMock as any,
            dataSourceMock as any
        );
    });
    
    it('title만 수정하면 기존 AI분석을 삭제하지 않음.', async () => {
        diaryRepositoryMock.findOne.mockResolvedValue({
            id:4,
            title:'기존 제목',
            content: '기존 본문',
            user: {
                id: 'user-a'
            },
        });

        diaryRepositoryMock.merge.mockImplementation((diary: any, dto: any) => {
            Object.assign(diary, dto);
            return diary;
        });

        transactionDiaryRepositoryMock.save.mockImplementation(async(diary: any) => diary);

        await service.updateDiary('user-a', 4, {
            title: '수정된 제목',
        }); 

        expect(transactionAnalysisRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it('content를 수정하면 기존 content의 AI분석 결과를 삭제한다.', async() => {
        diaryRepositoryMock.findOne.mockResolvedValue({
            id:4,
            title: '기존 제목',
            content: '기존 본문',
            user: {
                id: 'user-a',
            },
        });

        diaryRepositoryMock.merge.mockImplementation((diary: any, dto: any) => {
            Object.assign(diary, dto);
            return diary;
        });

        transactionDiaryRepositoryMock.save.mockImplementation(async(diary:any) => diary);

        await service.updateDiary('user-a', 4, {
            content: '수정된 본문',
        });

        expect(transactionAnalysisRepositoryMock.delete).toHaveBeenCalledTimes(1);
    });
});