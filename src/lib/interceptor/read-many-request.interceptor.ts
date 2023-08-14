import { CallHandler, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { FindOptionsWhere, LessThan, MoreThan } from 'typeorm';

import { CustomReadManyRequestOptions } from './custom-request.interceptor';
import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS, CUSTOM_REQUEST_OPTIONS } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { CrudOptions, FactoryOption, Method, Sort, GROUP, PaginationType } from '../interface';
import { PaginationHelper } from '../provider';
import { CrudReadManyRequest } from '../request';

const method = Method.READ_MANY;
export function ReadManyRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
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
                    pagination.setQuery(pagination.query ?? btoa('{}'));
                    return {};
                }
                const query = await this.validateQuery(req.query);
                pagination.setWhere(PaginationHelper.serialize(query));
                return query;
            })();

            const crudReadManyRequest: CrudReadManyRequest<typeof crudOptions.entity> = new CrudReadManyRequest<typeof crudOptions.entity>()
                .setPrimaryKey(factoryOption.primaryKeys ?? [])
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

            const transformed = plainToInstance(crudOptions.entity, query, { groups: [GROUP.READ_MANY] });
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
