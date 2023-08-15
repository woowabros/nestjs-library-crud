import { PaginationAbstractResponse } from '../abstract';
import { PaginationCursorDto } from '../dto/pagination-cursor.dto';
import { PaginationOffsetDto } from '../dto/pagination-offset.dto';

export enum PaginationType {
    OFFSET = 'offset',
    CURSOR = 'cursor',
}

export const PAGINATION_SWAGGER_QUERY: Record<PaginationType, Array<{ name: string; type: string }>> = {
    [PaginationType.OFFSET]: [
        { name: 'limit', type: 'integer' },
        { name: 'offset', type: 'integer' },
        { name: 'nextCursor', type: 'string' },
    ],
    [PaginationType.CURSOR]: [{ name: 'nextCursor', type: 'string' }],
};

export interface CursorPaginationResponse<T> extends PaginationAbstractResponse<T> {
    metadata: {
        limit: number;
        total: number;
        nextCursor: string;
    };
}

export interface OffsetPaginationResponse<T> extends PaginationAbstractResponse<T> {
    metadata: {
        /**
         * Current page number
         */
        page: number;
        /**
         * Total page count
         */
        pages: number;
        /**
         * Total data count
         */
        total: number;
        /**
         * Maximum number of data on a page
         */
        offset: number;
        /**
         * cursor token for next page
         */
        nextCursor: string;
    };
}

export type PaginationRequest = PaginationCursorDto | PaginationOffsetDto;

export type PaginationResponse<T> = CursorPaginationResponse<T> | OffsetPaginationResponse<T>;
