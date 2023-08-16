import { AbstractPaginationRequest } from './abstract.pagination';
import { PaginationResponse } from '../interface';

describe('AbstractPaginationRequest', () => {
    class PaginationRequest extends AbstractPaginationRequest {
        nextTotal(_dataLength?: number | undefined): number {
            throw new Error('Method not implemented.');
        }
        metadata<T>(_take: number, _dataLength: number, _total: number, _nextCursor: string): PaginationResponse<T>['metadata'] {
            throw new Error('Method not implemented.');
        }
    }
    it('should do nothing when where is undefined', () => {
        const paginationRequest = new PaginationRequest();
        paginationRequest.setWhere(undefined);
        expect(paginationRequest.where).toBeUndefined();

        paginationRequest.setWhere('where');
        expect(paginationRequest.where).toEqual('where');

        paginationRequest.setWhere(undefined);
        expect(paginationRequest.where).toEqual('where');
    });

    it('should do nothing when query is invalid', () => {
        const paginationRequest = new PaginationRequest();
        paginationRequest.setQuery('invalid');
        expect(paginationRequest.isNext).toBeFalsy();
    });
});
