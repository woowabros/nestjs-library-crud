import { Expose } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';

import { PaginationType } from '../interface';

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

    setWhere(where: string | undefined) {
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

    setQuery(query: string): void {
        try {
            const paginationType: PaginationQuery = JSON.parse(Buffer.from(query, encoding).toString());
            this._where = paginationType.where;
            this._total = paginationType.total;
            this._nextCursor = paginationType.nextCursor;

            this._isNext = true;
        } catch {
            //
        }
    }

    protected get total() {
        return this._total;
    }

    get where() {
        return this._where;
    }

    get isNext() {
        return this._isNext && this.total != null;
    }

    get nextCursor() {
        return this._nextCursor;
    }

    abstract nextTotal(dataLength?: number): number;
}
