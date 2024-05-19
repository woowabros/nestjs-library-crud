import _ from 'lodash';
import { FindManyOptions, FindOptionsOrder, FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { CRUD_POLICY } from '../crud.policy';
import { Method, PaginationRequest, PaginationResponse, PaginationType, Sort } from '../interface';
import { PaginationHelper } from '../provider';

type Where<T> = FindOptionsWhere<T> | Array<FindOptionsWhere<T>>;
export class CrudReadManyRequest<T> {
    private _paginationKeys: string[] = [];
    private _findOptions: FindManyOptions<T> & {
        where: Where<T>;
        take: number;
        order: FindOptionsOrder<T>;
    } = {
        where: {},
        take: CRUD_POLICY[Method.READ_MANY].default.numberOfTake,
        order: {},
    };
    private _sort: Sort;
    private _pagination: PaginationRequest;
    private _deserialize: (crudReadManyRequest: CrudReadManyRequest<T>) => Where<T>;
    private _selectColumnSet: Set<string | number> = new Set();
    private _excludeColumnSet: Set<string> = new Set();

    get paginationKeys() {
        return this._paginationKeys;
    }

    get findOptions() {
        return this._findOptions;
    }

    get pagination() {
        return this._pagination;
    }

    get sort() {
        return this._sort;
    }

    excludedColumns(columns: string[]): this {
        this._findOptions.select = columns.filter((column) => {
            if (this._excludeColumnSet.has(column)) {
                return false;
            }
            if (this._selectColumnSet.size === 0) {
                return true;
            }
            return this._selectColumnSet.has(column);
        }) as unknown as FindOptionsSelect<T>;
        return this;
    }

    setPagination(pagination: PaginationRequest): this {
        this._pagination = pagination;
        return this;
    }

    setPaginationKeys(paginationKeys: string[]): this {
        this._paginationKeys = paginationKeys;
        return this;
    }

    setWithDeleted(withDeleted: boolean): this {
        this._findOptions.withDeleted = withDeleted;
        return this;
    }

    setSelectColumn(columns: Array<string | number> | undefined): this {
        if (!columns || columns.length === 0) {
            return this;
        }
        for (const column of columns) {
            this._selectColumnSet.add(column);
        }
        return this;
    }

    setExcludeColumn(columns: string[] | undefined): this {
        if (!columns || columns.length === 0) {
            return this;
        }
        for (const column of columns) {
            this._excludeColumnSet.add(column);
        }
        return this;
    }

    setWhere(where: (FindOptionsWhere<T> & Partial<T>) | Array<FindOptionsWhere<T>>): this {
        this._findOptions.where = where;
        return this;
    }

    setTake(take: number): this {
        this._findOptions.take = take;
        return this;
    }

    setSort(sort: Sort): this {
        this._sort = sort;
        this._findOptions.order = this._paginationKeys.reduce((order, paginationKey) => ({ ...order, [paginationKey]: sort }), {});
        return this;
    }

    setOrder(order: FindOptionsOrder<T>, sort: Sort): this {
        this._sort = sort;
        this._findOptions.order = order;
        return this;
    }

    setRelations(relations: string[] | undefined): this {
        this._findOptions.relations = relations;
        return this;
    }

    setDeserialize(deserialize: (crudReadManyRequest: CrudReadManyRequest<T>) => FindOptionsWhere<T> | Array<FindOptionsWhere<T>>): this {
        this._deserialize = deserialize;
        return this;
    }

    generate(): this {
        if (this.pagination.type === PaginationType.OFFSET) {
            if (this.pagination.limit != null) {
                this._findOptions.take = this.pagination.limit;
            }
            if (Number.isFinite(this.pagination.offset)) {
                this._findOptions.where = this._deserialize(this);
                this._findOptions.skip = this.pagination.offset;
            }
        }

        if (this.pagination.type === PaginationType.CURSOR && this.pagination.nextCursor) {
            this._findOptions.where = this._deserialize(this);
        }

        return this;
    }

    toString(): string {
        return JSON.stringify(_.omit(this, ['_deserialize']));
    }

    toResponse(data: T[], total: number): PaginationResponse<T> {
        const take = this.findOptions.take;
        const dataLength = data.length;
        const orderKeys = Object.keys(this._findOptions.order);
        const nextCursor = PaginationHelper.serialize(_.pick(data.at(-1), orderKeys) as FindOptionsWhere<T>);

        if (this.pagination.type === PaginationType.OFFSET) {
            return {
                data,
                metadata: this.pagination.metadata(take, dataLength, total, nextCursor),
            };
        }
        return {
            data,
            metadata: this.pagination.metadata(take, dataLength, total, nextCursor),
        };
    }
}
