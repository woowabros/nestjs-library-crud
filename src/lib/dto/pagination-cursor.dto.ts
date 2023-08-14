import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { AbstractPaginationRequest } from '../abstract';
import { PaginationType } from '../interface';

export class PaginationCursorDto extends AbstractPaginationRequest {
    type: PaginationType.CURSOR = PaginationType.CURSOR;

    @Expose({ name: 'query' })
    @IsString()
    @IsOptional()
    query: string;

    nextTotal(dataLength: number): number {
        return this.total - dataLength;
    }
}
