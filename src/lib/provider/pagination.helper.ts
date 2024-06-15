import { UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { PaginationCursorDto, PaginationOffsetDto } from '../dto';
import { PaginationType } from '../interface';

import type { RequestSearchDto } from '../dto';
import type { PaginationRequest } from '../interface';
import type { FindOptionsWhere } from 'typeorm';

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

        return transformed;
    }
}
