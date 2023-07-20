import { ConflictException, NotFoundException } from '@nestjs/common';
import _ from 'lodash';
import {
    BaseEntity,
    DeepPartial,
    FindManyOptions,
    FindOptionsOrder,
    FindOptionsSelect,
    FindOptionsWhere,
    LessThan,
    MoreThan,
    Repository,
} from 'typeorm';

import { PaginationCursorDto } from './dto/pagination-cursor.dto';
import { PaginationOffsetDto } from './dto/pagination-offset.dto';
import {
    CrudReadManyRequest,
    CrudReadOneRequest,
    CrudDeleteOneRequest,
    CrudUpdateOneRequest,
    Sort,
    CrudUpsertRequest,
    CrudRecoverRequest,
    PaginationResponse,
    PaginationType,
    CrudSearchRequest,
    isCrudCreateManyRequest,
    CrudCreateOneRequest,
    CrudCreateManyRequest,
    CursorPaginationResponse,
} from './interface';
import { PaginationHelper } from './provider/pagination.helper';
import { TypeOrmQueryBuilderHelper } from './provider/typeorm-query-builder.helper';

export class CrudService<T extends BaseEntity> {
    private primaryKey: string[];
    private relations: string[];

    constructor(public readonly repository: Repository<T>) {
        this.primaryKey = this.repository.metadata.primaryColumns?.map((columnMetadata) => columnMetadata.propertyName) ?? [];
        this.relations = this.repository.metadata.relations?.map((relation) => relation.propertyName);
    }

    readonly reservedSearch = async (crudSearchRequest: CrudSearchRequest<T>): Promise<CursorPaginationResponse<T>> => {
        const { requestSearchDto, relations } = crudSearchRequest;

        const limit = requestSearchDto.take;
        const findManyOptions: FindManyOptions<T> = {
            select: requestSearchDto.select,
            where:
                Array.isArray(requestSearchDto.where) && requestSearchDto.where.length > 0
                    ? requestSearchDto.where.map((queryFilter, index) =>
                          TypeOrmQueryBuilderHelper.queryFilterToFindOptionsWhere(queryFilter, index),
                      )
                    : undefined,
            withDeleted: requestSearchDto.withDeleted,
            take: limit,
            order: requestSearchDto.order as FindOptionsOrder<T>,
            relations: this.getRelation(relations),
        };
        const [data, total] = await Promise.all([
            this.repository.find({ ...findManyOptions }),
            this.repository.count({
                select: findManyOptions.select,
                where: findManyOptions.where,
                withDeleted: findManyOptions.withDeleted,
            }),
        ]);
        const nextCursor = PaginationHelper.serialize(_.pick(data.at(-1), this.primaryKey));

        return {
            data,
            metadata: { nextCursor, limit: limit!, total, query: PaginationHelper.serialize(requestSearchDto ?? {}) },
        };
    };

    readonly reservedReadMany = async (crudReadManyRequest: CrudReadManyRequest<T>): Promise<PaginationResponse<T>> => {
        return crudReadManyRequest.pagination.type === PaginationType.OFFSET
            ? this.paginateOffset(crudReadManyRequest)
            : this.paginateCursor(crudReadManyRequest);
    };

    readonly reservedReadOne = async (crudReadOneRequest: CrudReadOneRequest<T>): Promise<T> => {
        return this.repository
            .findOne({
                select: crudReadOneRequest.fields as unknown as FindOptionsSelect<T>,
                where: crudReadOneRequest.params as FindOptionsWhere<T>,
                withDeleted: crudReadOneRequest.softDeleted,
                relations: this.getRelation(crudReadOneRequest.relations),
            })
            .then((entity) => {
                if (_.isNil(entity)) {
                    throw new NotFoundException();
                }
                return entity;
            });
    };

    readonly reservedCreate = async (crudCreateRequest: CrudCreateOneRequest<T> | CrudCreateManyRequest<T>): Promise<T | T[]> => {
        const entities = this.repository.create(
            isCrudCreateManyRequest<T>(crudCreateRequest) ? crudCreateRequest.body : [crudCreateRequest.body],
        );

        if (crudCreateRequest.author) {
            for (const entity of entities) {
                _.merge(entity, { [crudCreateRequest.author.property]: crudCreateRequest.author.value });
            }
        }

        return this.repository
            .save(entities)
            .then((result) => {
                return isCrudCreateManyRequest<T>(crudCreateRequest) ? result : result[0];
            })
            .catch((error) => {
                throw new ConflictException(error);
            });
    };

    readonly reservedUpsert = async (crudUpsertRequest: CrudUpsertRequest<T>): Promise<T> => {
        return this.repository
            .findOne({
                where: crudUpsertRequest.params as unknown as FindOptionsWhere<T>,
                withDeleted: true,
            })
            .then(async (entity: T | null) => {
                const upsertEntity = entity ?? this.repository.create(crudUpsertRequest.params as unknown as DeepPartial<T>);
                if (!_.isNil(_.get(upsertEntity, 'deletedAt'))) {
                    throw new ConflictException('it has been deleted');
                }

                if (crudUpsertRequest.author) {
                    _.merge(upsertEntity, { [crudUpsertRequest.author.property]: crudUpsertRequest.author.value });
                }

                return this.repository.save(_.assign(upsertEntity, crudUpsertRequest.body));
            });
    };

    readonly reservedUpdate = async (crudUpdateOneRequest: CrudUpdateOneRequest<T>): Promise<T> => {
        return this.repository
            .findOne({
                where: crudUpdateOneRequest.params as unknown as FindOptionsWhere<T>,
            })
            .then(async (entity: T | null) => {
                if (!entity) {
                    throw new NotFoundException();
                }

                if (crudUpdateOneRequest.author) {
                    _.merge(entity, { [crudUpdateOneRequest.author.property]: crudUpdateOneRequest.author.value });
                }

                return this.repository.save(_.assign(entity, crudUpdateOneRequest.body));
            });
    };

    readonly reservedDelete = async (crudDeleteOneRequest: CrudDeleteOneRequest<T>): Promise<T> => {
        if (this.primaryKey.length === 0) {
            throw new ConflictException('cannot found primary key from entity');
        }

        return this.repository
            .findOne({
                where: crudDeleteOneRequest.params as unknown as FindOptionsWhere<T>,
            })
            .then(async (entity: T | null) => {
                if (!entity) {
                    throw new NotFoundException();
                }

                if (crudDeleteOneRequest.author) {
                    _.merge(entity, { [crudDeleteOneRequest.author.property]: crudDeleteOneRequest.author.value });
                    await this.repository.save(entity);
                }

                await (crudDeleteOneRequest.softDeleted ? entity.softRemove() : entity.remove());
                return entity;
            });
    };

    readonly reservedRecover = async (crudRecoverRequest: CrudRecoverRequest<T>): Promise<T> => {
        return this.repository
            .findOne({
                where: crudRecoverRequest.params as unknown as FindOptionsWhere<T>,
                withDeleted: true,
            })
            .then(async (entity: T | null) => {
                if (!entity) {
                    throw new NotFoundException();
                }
                await this.repository.recover(entity);
                return entity;
            });
    };

    private async paginateCursor(crudReadManyRequest: CrudReadManyRequest<T>): Promise<PaginationResponse<T>> {
        if (crudReadManyRequest.pagination.type !== PaginationType.CURSOR) {
            throw new TypeError('use only cursor Pagination Type');
        }
        const pagination: PaginationCursorDto = crudReadManyRequest.pagination;
        const limit = crudReadManyRequest.numberOfTake;
        const findOptions: FindManyOptions<T> = {
            where: pagination.nextCursor
                ? this.paginateCursorWhereByNextCursor(pagination, crudReadManyRequest.sort)
                : (crudReadManyRequest.query as FindOptionsWhere<T>),
            withDeleted: crudReadManyRequest.softDeleted,
            take: limit,
            order: crudReadManyRequest.primaryKeys.reduce(
                (sort, primaryKey) => ({ ...sort, [primaryKey.name]: crudReadManyRequest.sort }),
                {},
            ),
            relations: this.getRelation(crudReadManyRequest.relations),
        };

        const [entities, total] = await Promise.all([
            this.repository.find({ ...findOptions }),
            this.repository.count({ where: findOptions.where, withDeleted: findOptions.withDeleted }),
        ]);
        const nextCursor = PaginationHelper.serialize(
            _.pick(
                entities.at(-1),
                crudReadManyRequest.primaryKeys.map(({ name }) => name),
            ),
        );

        return {
            data: entities,
            metadata: {
                nextCursor,
                limit,
                total,
                query: pagination.query ?? PaginationHelper.serialize(crudReadManyRequest.query ?? {}),
            },
        };
    }

    private paginateCursorWhereByNextCursor(pagination: PaginationCursorDto, sort: Sort): FindOptionsWhere<T> {
        const query: Record<string, unknown> = PaginationHelper.deserialize(pagination.query);
        const lastObject: Record<string, unknown> = PaginationHelper.deserialize(pagination.nextCursor);

        const operator = sort === Sort.DESC ? LessThan : MoreThan;
        for (const [key, value] of Object.entries(lastObject)) {
            query[key] = operator(value);
        }
        return query as FindOptionsWhere<T>;
    }

    private async paginateOffset(crudReadManyRequest: CrudReadManyRequest<T>): Promise<PaginationResponse<T>> {
        if (crudReadManyRequest.pagination.type !== PaginationType.OFFSET) {
            throw new TypeError('use only offset Pagination Type');
        }
        const pagination: PaginationOffsetDto = crudReadManyRequest.pagination;
        const findManyOptions = {
            where: crudReadManyRequest.query as FindOptionsWhere<T>,
            take: pagination.limit ?? crudReadManyRequest.numberOfTake,
            withDeleted: crudReadManyRequest.softDeleted,
            order: crudReadManyRequest.primaryKeys.reduce(
                (sort, primaryKey) => ({ ...sort, [primaryKey.name]: crudReadManyRequest.sort }),
                {},
            ),
            relations: this.getRelation(crudReadManyRequest.relations),
        };

        const [entities, total] = await this.repository.findAndCount(
            Number.isFinite(pagination.offset)
                ? {
                      ...findManyOptions,
                      where: PaginationHelper.deserialize(pagination.query) as FindOptionsWhere<T>,
                      skip: pagination.offset,
                  }
                : findManyOptions,
        );
        const offset = (pagination.offset ?? 0) + entities.length;

        return {
            data: entities,
            metadata: {
                page: pagination.offset ? Math.floor(pagination.offset / findManyOptions.take) + 1 : 1,
                pages: total ? Math.ceil(total / findManyOptions.take) : 1,
                total,
                offset,
                query: pagination.query ?? PaginationHelper.serialize(crudReadManyRequest.query ?? {}),
            },
        };
    }

    private getRelation(relations: undefined | string[]): string[] {
        return Array.isArray(relations) ? relations : this.relations;
    }
}
