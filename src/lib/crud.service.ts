import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import _ from 'lodash';

import { isCrudCreateManyRequest } from './interface';

import type {
    CrudReadOneRequest,
    CrudDeleteOneRequest,
    CrudUpdateOneRequest,
    CrudUpsertRequest,
    CrudRecoverRequest,
    PaginationResponse,
    CrudCreateOneRequest,
    CrudCreateManyRequest,
    EntityType,
} from './interface';
import type { CrudReadManyRequest } from './request';
import type { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

const SUPPORTED_REPLICATION_TYPES = new Set(['mysql', 'mariadb', 'postgres', 'aurora-postgres', 'aurora-mysql']);

export class CrudService<T extends EntityType> {
    private primaryKey: string[];
    private columnNames: string[];
    private usableQueryRunner = false;

    constructor(public readonly repository: Repository<T>) {
        this.usableQueryRunner = SUPPORTED_REPLICATION_TYPES.has(this.repository.metadata.connection?.options.type);
        this.primaryKey = this.repository.metadata.primaryColumns?.map((columnMetadata) => columnMetadata.propertyName) ?? [];
        this.columnNames = this.repository.metadata.columns.map((column) => column.propertyPath);
    }

    readonly reservedReadMany = async (crudReadManyRequest: CrudReadManyRequest<T>): Promise<PaginationResponse<T>> => {
        crudReadManyRequest.excludedColumns(this.columnNames);
        const { entities, total } = await (async () => {
            const findEntities = this.repository.find({ ...crudReadManyRequest.findOptions });

            if (crudReadManyRequest.pagination.isNext) {
                const entities = await findEntities;
                return { entities, total: crudReadManyRequest.pagination.nextTotal() };
            }
            const [entities, total] = await Promise.all([
                findEntities,
                this.repository.count({
                    where: crudReadManyRequest.findOptions.where,
                    withDeleted: crudReadManyRequest.findOptions.withDeleted,
                }),
            ]);
            return { entities, total };
        })();
        return crudReadManyRequest.toResponse(entities, total);
    };

    readonly reservedReadOne = async (crudReadOneRequest: CrudReadOneRequest<T>): Promise<T> => {
        return this.repository
            .findOne({
                select: (crudReadOneRequest.selectColumns ?? this.columnNames).filter(
                    (columnName) => !crudReadOneRequest.excludedColumns?.includes(columnName),
                ),
                where: crudReadOneRequest.params as FindOptionsWhere<T>,
                withDeleted: crudReadOneRequest.softDeleted,
                relations: crudReadOneRequest.relations,
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
            .save(entities, crudCreateRequest.saveOptions)
            .then((result) => {
                return isCrudCreateManyRequest<T>(crudCreateRequest)
                    ? result.map((entity) => this.excludeEntity(entity, crudCreateRequest.exclude))
                    : this.excludeEntity(result[0], crudCreateRequest.exclude);
            })
            .catch(this.throwConflictException);
    };

    readonly reservedUpsert = async (crudUpsertRequest: CrudUpsertRequest<T>): Promise<T> => {
        return this.findOne(crudUpsertRequest.params as unknown as FindOptionsWhere<T>, true).then(async (entity: T | null) => {
            const upsertEntity = entity ?? this.repository.create(crudUpsertRequest.params as unknown as DeepPartial<T>);
            if ('deletedAt' in upsertEntity && upsertEntity.deletedAt != null) {
                throw new ConflictException('it has been deleted');
            }

            if (crudUpsertRequest.author) {
                _.merge(upsertEntity, { [crudUpsertRequest.author.property]: crudUpsertRequest.author.value });
            }

            return this.repository
                .save(_.assign(upsertEntity, crudUpsertRequest.body), crudUpsertRequest.saveOptions)
                .then((entity) => this.excludeEntity(entity, crudUpsertRequest.exclude))
                .catch(this.throwConflictException);
        });
    };

    readonly reservedUpdate = async (crudUpdateOneRequest: CrudUpdateOneRequest<T>): Promise<T> => {
        return this.findOne(crudUpdateOneRequest.params as unknown as FindOptionsWhere<T>, false).then(async (entity: T | null) => {
            if (!entity) {
                throw new NotFoundException();
            }

            if (crudUpdateOneRequest.author) {
                _.merge(entity, { [crudUpdateOneRequest.author.property]: crudUpdateOneRequest.author.value });
            }

            return this.repository
                .save(_.assign(entity, crudUpdateOneRequest.body), crudUpdateOneRequest.saveOptions)
                .then((entity) => this.excludeEntity(entity, crudUpdateOneRequest.exclude))
                .catch(this.throwConflictException);
        });
    };

    readonly reservedDelete = async (crudDeleteOneRequest: CrudDeleteOneRequest<T>): Promise<T> => {
        if (this.primaryKey.length === 0) {
            throw new ConflictException('cannot found primary key from entity');
        }
        return this.findOne(crudDeleteOneRequest.params as unknown as FindOptionsWhere<T>, false).then(async (entity: T | null) => {
            if (!entity) {
                throw new NotFoundException();
            }

            if (crudDeleteOneRequest.author) {
                _.merge(entity, { [crudDeleteOneRequest.author.property]: crudDeleteOneRequest.author.value });

                await this.repository.save(entity, crudDeleteOneRequest.saveOptions);
            }

            await (crudDeleteOneRequest.softDeleted
                ? this.repository.softRemove(entity, crudDeleteOneRequest.saveOptions)
                : this.repository.remove(entity, crudDeleteOneRequest.saveOptions));
            return this.excludeEntity(entity, crudDeleteOneRequest.exclude);
        });
    };

    readonly reservedRecover = async (crudRecoverRequest: CrudRecoverRequest<T>): Promise<T> => {
        return this.findOne(crudRecoverRequest.params as unknown as FindOptionsWhere<T>, true).then(async (entity: T | null) => {
            if (!entity) {
                throw new NotFoundException();
            }
            await this.repository.recover(entity, crudRecoverRequest.saveOptions).catch(this.throwConflictException);
            return this.excludeEntity(entity, crudRecoverRequest.exclude);
        });
    };

    private async findOne(where: FindOptionsWhere<T>, withDeleted: boolean): Promise<T | null> {
        if (!this.usableQueryRunner) {
            return this.repository.findOne({ where, withDeleted });
        }
        const queryBuilder = this.repository.createQueryBuilder().where(where);
        if (withDeleted) {
            queryBuilder.withDeleted();
        }
        const runner = queryBuilder.connection.createQueryRunner('master');
        try {
            return await queryBuilder.setQueryRunner(runner).getOne();
        } finally {
            await runner.release();
        }
    }

    private excludeEntity(entity: T, exclude: Set<string>): T {
        if (exclude.size === 0) {
            return entity;
        }
        for (const excludeKey of exclude.values()) {
            delete entity[excludeKey as unknown as keyof T];
        }
        return entity;
    }

    private throwConflictException(error: Error): never {
        Logger.error(error);
        throw new ConflictException(error);
    }
}
