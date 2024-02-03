import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

import { AbstractPaginationRequest } from '../abstract';
import { OffsetPaginationResponse, PaginationType } from '../interface';

export class PaginationOffsetDto extends AbstractPaginationRequest {
    type: PaginationType.OFFSET = PaginationType.OFFSET;

    @Expose({ name: 'limit' })
    @Type(() => Number)
    @Transform(({ value }) => (value && value < 0 ? 0 : value))
    @IsNumber()
    @IsOptional()
    limit?: number;

    @Expose({ name: 'offset' })
    @IsNumber()
    @Transform(({ value }) => (value && value < 0 ? 0 : value))
    @Type(() => Number)
    @IsOptional()
    offset?: number;

    nextTotal(): number {
        return this.total;
    }

    metadata<T>(take: number, dataLength: number, total: number, nextCursor: string): OffsetPaginationResponse<T>['metadata'] {
        return {
            page: this.offset ? Math.floor(this.offset / take) + 1 : 1,
            pages: total ? Math.ceil(total / take) : 1,
            offset: (this.offset ?? 0) + dataLength,
            total,
            nextCursor: this.makeQuery(total, nextCursor),
        };
    }
}
