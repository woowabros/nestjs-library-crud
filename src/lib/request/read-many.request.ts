import _ from 'lodash';
import { FindManyOptions, FindOptionsWhere, LessThan, MoreThan } from 'typeorm';

import { CRUD_POLICY } from '../crud.policy';
import { Method, PaginationRequest, PaginationResponse, PaginationType, PrimaryKey, Sort } from '../interface';
import { PaginationHelper } from '../provider';

export class CrudReadManyRequest<T> {
    private _primaryKeys: PrimaryKey[] = [];
    private _findOptions: FindManyOptions<T> & { where: FindOptionsWhere<T>; take: number } = {
        where: {},
        take: CRUD_POLICY[Method.READ_MANY].default.numberOfTake,
    };
    private _sort: Sort;
    private _pagination: PaginationRequest;

    get primaryKeys() {
        return this._primaryKeys;
    }
    get findOptions() {
        return this._findOptions;
    }
    get pagination() {
        return this._pagination;
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

    setWhere(where: FindOptionsWhere<T> & Partial<T>): this {
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

    setRelations(relations: string[] | undefined): this {
        this._findOptions.relations = relations;
        return this;
    }

    generate(): this {
        if (this.pagination.type === PaginationType.OFFSET) {
            if (!!this.pagination.limit) {
                this._findOptions.take = this.pagination.limit;
            }
            if (Number.isFinite(this.pagination.offset)) {
                this._findOptions.where = PaginationHelper.deserialize(this.pagination.query);
                this._findOptions.skip = this.pagination.offset;
            }
        }

        if (this.pagination.type === PaginationType.CURSOR && this.pagination.nextCursor) {
            this._findOptions.where = this.paginateCursorWhereByNextCursor();
        }

        return this;
    }

    toString(): string {
        return JSON.stringify(this);
    }

    toResponse(data: T[], total: number): PaginationResponse<T> {
        if (this.pagination.type === PaginationType.OFFSET) {
            return {
                data,
                metadata: {
                    page: this.pagination.offset ? Math.floor(this.pagination.offset / this.findOptions.take) + 1 : 1,
                    pages: total ? Math.ceil(total / this.findOptions.take) : 1,
                    total,
                    offset: (this.pagination.offset ?? 0) + data.length,
                    query: this.pagination.query ?? PaginationHelper.serialize(this.findOptions.where),
                },
            };
        }
        return {
            data,
            metadata: {
                nextCursor: PaginationHelper.serialize(
                    _.pick(
                        data.at(-1),
                        this.primaryKeys.map(({ name }) => name),
                    ) as FindOptionsWhere<T>,
                ),
                limit: this.findOptions.take,
                total,
                query: this.pagination.query ?? PaginationHelper.serialize(this.findOptions.where),
            },
        };
    }

    private paginateCursorWhereByNextCursor(): FindOptionsWhere<T> {
        if (this.pagination.type !== PaginationType.CURSOR) {
            return {};
        }
        const query: Record<string, unknown> = PaginationHelper.deserialize(this.pagination.query);
        const lastObject: Record<string, unknown> = PaginationHelper.deserialize(this.pagination.nextCursor);

        const operator = this._sort === Sort.DESC ? LessThan : MoreThan;
        for (const [key, value] of Object.entries(lastObject)) {
            query[key] = operator(value);
        }
        return query as FindOptionsWhere<T>;
    }
}
