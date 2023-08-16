import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import _ from 'lodash';
import { BaseEntity, DeepPartial, FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';

import {
    CrudReadOneRequest,
    CrudDeleteOneRequest,
    CrudUpdateOneRequest,
    CrudUpsertRequest,
    CrudRecoverRequest,
    PaginationResponse,
    isCrudCreateManyRequest,
    CrudCreateOneRequest,
    CrudCreateManyRequest,
} from './interface';
import { CrudReadManyRequest } from './request';

export class CrudService<T extends BaseEntity> {
    private primaryKey: string[];

    constructor(public readonly repository: Repository<T>) {
        this.primaryKey = this.repository.metadata.primaryColumns?.map((columnMetadata) => columnMetadata.propertyName) ?? [];
    }

    readonly reservedReadMany = async (crudReadManyRequest: CrudReadManyRequest<T>): Promise<PaginationResponse<T>> => {
        try {
            const { entities, total } = await (async () => {
                const findEntities = this.repository.find({ ...crudReadManyRequest.findOptions });

                if (crudReadManyRequest.pagination.isNext) {
                    const entities = await findEntities;
                    return { entities, total: crudReadManyRequest.pagination.nextTotal(entities.length) };
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
        } catch (error) {
            Logger.error(JSON.stringify(crudReadManyRequest));
            Logger.error(error);
            throw error;
        }
    };

    readonly reservedReadOne = async (crudReadOneRequest: CrudReadOneRequest<T>): Promise<T> => {
        return this.repository
            .findOne({
                select: crudReadOneRequest.fields as unknown as FindOptionsSelect<T>,
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
                if ('deletedAt' in upsertEntity && upsertEntity.deletedAt != null) {
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
}
