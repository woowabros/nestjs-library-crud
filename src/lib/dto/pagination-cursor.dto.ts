import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { PaginationRequestAbstract, PaginationType } from '../interface';

export class PaginationCursorDto implements PaginationRequestAbstract {
    type: PaginationType.CURSOR = PaginationType.CURSOR;

    @Expose({ name: 'nextCursor' })
    @IsString()
    @IsOptional()
    token?: string;

    @Expose({ name: 'query' })
    @IsString()
    @IsOptional()
    query?: string;
}
