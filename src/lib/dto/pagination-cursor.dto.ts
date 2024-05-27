import { AbstractPaginationRequest } from '../abstract';
import { PaginationType } from '../interface';

import type { CursorPaginationResponse } from '../interface';

export class PaginationCursorDto extends AbstractPaginationRequest {
    type: PaginationType.CURSOR = PaginationType.CURSOR;

    nextTotal(): number {
        return this.total;
    }

    metadata<T>(take: number, _dataLength: number, total: number, nextCursor: string): CursorPaginationResponse<T>['metadata'] {
        return {
            limit: take,
            total,
            nextCursor: this.makeQuery(total, nextCursor),
        };
    }
}
