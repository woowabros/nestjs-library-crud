import { Expose, Transform, Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString, Max } from 'class-validator';

import { PaginationRequestAbstract, PaginationType } from '../interface';

export class PaginationOffsetDto implements PaginationRequestAbstract {
    type: PaginationType.OFFSET = PaginationType.OFFSET;

    @Expose({ name: 'limit' })
    @Type(() => Number)
    @Transform(({ value }) => (value && value < 0 ? 0 : value))
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
}
