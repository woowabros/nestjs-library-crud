import _ from 'lodash';
import { FindManyOptions, FindOptionsOrder, FindOptionsSelect, FindOptionsSelectByString, FindOptionsWhere } from 'typeorm';

import { CRUD_POLICY } from '../crud.policy';
import { Method, PaginationRequest, PaginationResponse, PaginationType, PrimaryKey, Sort } from '../interface';
import { PaginationHelper } from '../provider';

type Where<T> = FindOptionsWhere<T> | Array<FindOptionsWhere<T>>;
export class CrudReadManyRequest<T> {
    private _primaryKeys: PrimaryKey[] = [];
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

    get primaryKeys() {
        return this._primaryKeys;
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

    setPagination(pagination: PaginationRequest): this {
        this._pagination = pagination;
        return this;
    }

    setPrimaryKey(primaryKeys: PrimaryKey[]): this {
        this._primaryKeys = primaryKeys;
        return this;
    }

    setWithDeleted(withDeleted: boolean): this {
        this._findOptions.withDeleted = withDeleted;
        return this;
    }

    // TODO: FindOptionsSelectByString is deprecated.
    setSelect(select: FindOptionsSelect<T> | FindOptionsSelectByString<T> | undefined): this {
        this._findOptions.select = select;
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
        this._findOptions.order = this._primaryKeys.reduce((order, primaryKey) => ({ ...order, [primaryKey.name]: sort }), {});
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
        const nextCursor = PaginationHelper.serialize(
            _.pick(
                data.at(-1),
                this.primaryKeys.map(({ name }) => name),
            ) as FindOptionsWhere<T>,
        );
        if (this.pagination.type === PaginationType.OFFSET) {
            return {
                data,
                metadata: {
                    page: this.pagination.offset ? Math.floor(this.pagination.offset / this.findOptions.take) + 1 : 1,
                    pages: total ? Math.ceil(total / this.findOptions.take) : 1,
                    total,
                    offset: (this.pagination.offset ?? 0) + data.length,
                    query: this.pagination.makeQuery(total, nextCursor),
                },
            };
        }

        return {
            data,
            metadata: {
                nextCursor,
                limit: this.findOptions.take,
                total,
                query: this.pagination.makeQuery(total, nextCursor),
            },
        };
    }
}
