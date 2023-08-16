import { AbstractPaginationRequest } from '../abstract';
import { PaginationType } from '../interface';

export class PaginationCursorDto extends AbstractPaginationRequest {
    type: PaginationType.CURSOR = PaginationType.CURSOR;

    nextTotal(dataLength: number): number {
        return this.total - dataLength;
    }
}
