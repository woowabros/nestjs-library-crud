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
    ],
    [PaginationType.CURSOR]: [{ name: 'nextCursor', type: 'string' }],
};

export interface PaginationAbstractResponse<T> {
    data: T[];
}

export interface CursorPaginationResponse<T> extends PaginationAbstractResponse<T> {
    metadata: {
        query: string;
        limit: number;
        total: number;
        nextCursor: string;
    };
}

export interface OffsetPaginationResponse<T> extends PaginationAbstractResponse<T> {
    metadata: {
        /**
         * 현재 page 번호
         */
        page: number;
        /**
         * 전체 page 개수
         */
        pages: number;
        /**
         * 전체 데이터 개수
         */
        total: number;
        /**
         * 한 페이지의 데이터 최대 개수
         */
        offset: number;
        query: string;
    };
}

export type PaginationRequest = PaginationCursorDto | PaginationOffsetDto;

export type PaginationResponse<T> = CursorPaginationResponse<T> | OffsetPaginationResponse<T>;
