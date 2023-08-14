import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive, IsString, Max } from 'class-validator';

import { AbstractPaginationRequest } from '../abstract';
import { PaginationType } from '../interface';

export class PaginationOffsetDto extends AbstractPaginationRequest {
    type: PaginationType.OFFSET = PaginationType.OFFSET;

    @Expose({ name: 'limit' })
    @Type(() => Number)
    @Transform(({ value }) => (value && value < 0 ? 0 : value))
    @IsNumber()
    @Max(100)
    @IsOptional()
    limit?: number;

    @Expose({ name: 'offset' })
    @IsPositive()
    @Type(() => Number)
    @IsOptional()
    offset?: number;

    @Expose({ name: 'query' })
    @IsString()
    @IsOptional()
    query?: string;

    nextTotal(): number {
        return this.total;
    }
}
