import { UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { FindOptionsWhere } from 'typeorm';

import { PaginationCursorDto, PaginationOffsetDto, RequestSearchDto } from '../dto';
import { PaginationRequest, PaginationType } from '../interface';

const encoding = 'base64';

export class PaginationHelper {
    static serialize<T>(entity: FindOptionsWhere<T> | Array<FindOptionsWhere<T>> | RequestSearchDto<T> | Record<string, unknown>): string {
        return Buffer.from(JSON.stringify(entity)).toString(encoding);
    }

    static deserialize<T>(nextCursor?: string): T {
        if (!nextCursor) {
            return {} as T;
        }
        try {
            return JSON.parse(Buffer.from(nextCursor, encoding).toString());
        } catch {
            return {} as T;
        }
    }

    static getPaginationRequest(paginationType: PaginationType, query: Record<string, unknown>): PaginationRequest {
        const plain = query ?? {};
        const transformed =
            paginationType === PaginationType.OFFSET
                ? plainToInstance(PaginationOffsetDto, plain, { excludeExtraneousValues: true })
                : plainToInstance(PaginationCursorDto, plain, { excludeExtraneousValues: true });
        const [error] = validateSync(transformed, { stopAtFirstError: true });

        if (error) {
            throw new UnprocessableEntityException(error);
        }

        if (transformed.type === PaginationType.CURSOR && transformed.nextCursor && !transformed.query) {
            transformed.query = btoa('{}');
        }

        return transformed;
    }

    /**
     * [EN] Check if the request is requesting the next page.
     * [KR] Request 요청이 다음 페이지를 요청하는지 확인합니다.
     * @param paginationRequest
     * @returns boolean
     */
    static isNextPage(paginationRequest: PaginationRequest): boolean {
        if (paginationRequest.type === PaginationType.CURSOR) {
            return paginationRequest.nextCursor != null;
        }
        if (paginationRequest.type === PaginationType.OFFSET) {
            return paginationRequest.offset != null || paginationRequest.limit != null || paginationRequest.query != null;
        }
        return false;
    }
}
