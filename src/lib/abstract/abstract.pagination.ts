import { Expose } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';

import { PaginationResponse, PaginationType } from '../interface';

interface PaginationQuery {
    where: string;
    nextCursor: string;
    total: number;
}
const encoding = 'base64';

export interface PaginationAbstractResponse<T> {
    data: T[];
}

export abstract class AbstractPaginationRequest {
    private _isNext: boolean = false;
    private _where: string;
    private _total: number;
    private _nextCursor: string;

    type: PaginationType;

    @Expose({ name: 'nextCursor' })
    @IsString()
    @IsOptional()
    query: string;

    setWhere(where: string | undefined): void {
        if (!where) {
            return;
        }
        this._where = where;
    }

    makeQuery(total: number, nextCursor: string): string {
        return Buffer.from(
            JSON.stringify({
                where: this._where,
                nextCursor,
                total,
            }),
        ).toString(encoding);
    }

    setQuery(query: string): boolean {
        const paginationQuery: PaginationQuery | null = (() => {
            try {
                return JSON.parse(Buffer.from(query, encoding).toString());
            } catch {
                return null;
            }
        })();
        if (paginationQuery == null) {
            return false;
        }

        this._where = paginationQuery.where;
        this._total = paginationQuery.total;
        this._nextCursor = paginationQuery.nextCursor;

        this._isNext = true;

        return true;
    }

    protected get total(): number {
        return this._total;
    }

    get where(): string {
        return this._where;
    }

    get isNext(): boolean {
        return this._isNext && this.total != null;
    }

    get nextCursor(): string {
        return this._nextCursor;
    }

    abstract nextTotal(): number;
    abstract metadata<T>(take: number, dataLength: number, total: number, nextCursor: string): PaginationResponse<T>['metadata'];
}
