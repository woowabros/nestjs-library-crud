import { Expose, Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString, Max } from 'class-validator';

import { PaginationRequestAbstract, PaginationType } from '../interface';

export class PaginationOffsetDto implements PaginationRequestAbstract {
    type: PaginationType.OFFSET = PaginationType.OFFSET;

    @Expose({ name: 'limit' })
    @IsPositive()
    @Type(() => Number)
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
