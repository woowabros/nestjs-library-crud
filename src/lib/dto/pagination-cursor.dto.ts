import { AbstractPaginationRequest } from '../abstract';
import { CursorPaginationResponse, PaginationType } from '../interface';

export class PaginationCursorDto extends AbstractPaginationRequest {
    type: PaginationType.CURSOR = PaginationType.CURSOR;

    nextTotal(dataLength: number): number {
        return this.total - dataLength;
    }

    metadata<T>(take: number, _dataLength: number, total: number, nextCursor: string): CursorPaginationResponse<T>['metadata'] {
        return {
            limit: take,
            total,
            nextCursor: this.makeQuery(total, nextCursor),
        };
    }
}
