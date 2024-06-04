import { mixin, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import _ from 'lodash';
import { LessThan, MoreThan } from 'typeorm';

import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS, CUSTOM_REQUEST_OPTIONS } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { Method, Sort, GROUP, PaginationType } from '../interface';
import { PaginationHelper } from '../provider';
import { CrudReadManyRequest } from '../request';

import type { CustomReadManyRequestOptions } from './custom-request.interceptor';
import type { CrudOptions, FactoryOption, EntityType } from '../interface';
import type { CallHandler, ExecutionContext, NestInterceptor, Type } from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { FindOptionsWhere } from 'typeorm';

const method = Method.READ_MANY;
export function ReadManyRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption): Type<NestInterceptor> {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const readManyOptions = crudOptions.routes?.[method] ?? {};

            const customReadManyRequestOptions: CustomReadManyRequestOptions = req[CUSTOM_REQUEST_OPTIONS];
            const paginationType = (readManyOptions.paginationType ?? CRUD_POLICY[method].default.paginationType) as PaginationType;

            if (req.params) {
                Object.assign(req.query, req.params);
            }

            const pagination = PaginationHelper.getPaginationRequest(paginationType, req.query);

            const query = await (async () => {
                if (PaginationHelper.isNextPage(pagination)) {
                    const isQueryValid = pagination.setQuery(pagination.query);
                    if (isQueryValid) {
                        return {};
                    }
                }
                const query = await this.validateQuery(req.query);
                pagination.setWhere(PaginationHelper.serialize(query));
                return query;
            })();
            const paginationKeys = readManyOptions.paginationKeys ?? factoryOption.primaryKeys.map(({ name }) => name);
            const crudReadManyRequest: CrudReadManyRequest<typeof crudOptions.entity> = new CrudReadManyRequest<typeof crudOptions.entity>()
                .setPaginationKeys(paginationKeys)
                .setExcludeColumn(readManyOptions.exclude)
                .setPagination(pagination)
                .setWithDeleted(
                    _.isBoolean(customReadManyRequestOptions?.softDeleted)
                        ? customReadManyRequestOptions.softDeleted
                        : crudOptions.routes?.[method]?.softDelete ?? CRUD_POLICY[method].default.softDeleted,
                )
                .setWhere(query)
                .setTake(readManyOptions.numberOfTake ?? CRUD_POLICY[method].default.numberOfTake)
                .setSort(readManyOptions.sort ? Sort[readManyOptions.sort] : CRUD_POLICY[method].default.sort)
                .setRelations(this.getRelations(customReadManyRequestOptions))
                .setDeserialize(this.deserialize)
                .generate();

            this.crudLogger.logRequest(req, crudReadManyRequest.toString());
            req[CRUD_ROUTE_ARGS] = crudReadManyRequest;

            return next.handle();
        }

        async validateQuery(query: Record<string, unknown>) {
            if (_.isNil(query)) {
                return {};
            }

            if ('limit' in query) {
                delete query.limit;
            }
            if ('offset' in query) {
                delete query.offset;
            }
            if ('nextCursor' in query) {
                delete query.nextCursor;
            }

            const transformed = plainToInstance(crudOptions.entity as ClassConstructor<EntityType>, query, {
                groups: [GROUP.READ_MANY],
            });
            const errorList = await validate(transformed, {
                groups: [GROUP.READ_MANY],
                whitelist: true,
                forbidNonWhitelisted: true,
                stopAtFirstError: true,
                forbidUnknownValues: false,
            });

            if (errorList.length > 0) {
                this.crudLogger.log(errorList, 'ValidationError');
                throw new UnprocessableEntityException(errorList);
            }
            return transformed;
        }

        getRelations(customReadManyRequestOptions: CustomReadManyRequestOptions): string[] {
            if (Array.isArray(customReadManyRequestOptions?.relations)) {
                return customReadManyRequestOptions.relations;
            }
            if (crudOptions.routes?.[method]?.relations === false) {
                return [];
            }
            if (crudOptions.routes?.[method] && Array.isArray(crudOptions.routes?.[method]?.relations)) {
                return crudOptions.routes[method].relations;
            }
            return factoryOption.relations;
        }

        deserialize<T>({ pagination, findOptions, sort }: CrudReadManyRequest<T>): FindOptionsWhere<T> {
            if (pagination.type === PaginationType.OFFSET) {
                return PaginationHelper.deserialize(pagination.where);
            }
            const query: Record<string, unknown> = PaginationHelper.deserialize(pagination.where);
            const lastObject: Record<string, unknown> = PaginationHelper.deserialize(pagination.nextCursor);

            const operator = (key: keyof T) => ((findOptions.order?.[key] ?? sort) === Sort.DESC ? LessThan : MoreThan);

            for (const [key, value] of Object.entries(lastObject)) {
                query[key] = operator(key as keyof T)(value);
            }
            return query as FindOptionsWhere<T>;
        }
    }

    return mixin(MixinInterceptor);
}
