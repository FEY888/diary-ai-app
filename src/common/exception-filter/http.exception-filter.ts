import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import {Request, Response} from "express";
import { QueryFailedError } from "typeorm";


const PG_UNIQUE_VIOLATION = '23505';

interface ErrorBody {
    statusCode: number;
    error: string;
    message: string | string[];

 }

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const body = this.toErrorBody(exception);

        if(body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.originalUrl} ${body.statusCode}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        response.status(body.statusCode).json({
            ...body,
            path: request.originalUrl,
            timestamp: new Date().toISOString(),
        });
    }


    private toErrorBody(exception: unknown): ErrorBody {
        if(exception instanceof HttpException) {
            const statusCode = exception.getStatus();
            const res = exception.getResponse();

            // throw new HttpException()문자열 같은 경우
            if(typeof res === 'string') {
                return {statusCode, error: exception.name, message:res};
            }

            // throw new BadRequestException이나 ValidationPipe 같이 객체 경우
            const {message, error} = res as {
                message?: string | string[];
                error?: string;
            };
            return {
                statusCode,
                error: error ?? exception.name,
                message: message ?? exception.message,
            };
        }

        //DB UNIQUE 제약 즉 중복 값 에러 경우 409 
        if(exception instanceof QueryFailedError && (exception.driverError as {code?: string})?.code === PG_UNIQUE_VIOLATION) {
            return {
                statusCode: HttpStatus.CONFLICT,
                error: 'Conflict',
                message: '이미 존재하는 데이터입니다.',
            };
        }
        
        // 그 외 에러들 (내부 정보 노출 위험이 존재하므로 문구만 보냄)
        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: '서버 내부 오류가 발생했습니다.',
        };


    }
}

