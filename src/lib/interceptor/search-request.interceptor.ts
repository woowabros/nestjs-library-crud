import { mixin, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import _ from 'lodash';
import { LessThan, MoreThan, And } from 'typeorm';

import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS, CUSTOM_REQUEST_OPTIONS } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { CreateParamsDto } from '../dto/params.dto';
import { RequestSearchDto } from '../dto/request-search.dto';
import { GROUP, Method, PaginationType, Sort } from '../interface';
import { operatorBetween, operatorIn, operatorNull, operatorList } from '../interface/query-operation.interface';
import { PaginationHelper, TypeOrmQueryBuilderHelper } from '../provider';
import { CrudReadManyRequest } from '../request';

import type { CustomSearchRequestOptions } from './custom-request.interceptor';
import type { CrudOptions, EntityType, FactoryOption } from '../interface';
import type { OperatorUnion } from '../interface/query-operation.interface';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { FindOptionsWhere, FindOperator } from 'typeorm';

const method = Method.SEARCH;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function SearchRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinSearchRequestInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const searchOptions = crudOptions.routes?.[method] ?? {};
            const customSearchRequestOptions: CustomSearchRequestOptions = req[CUSTOM_REQUEST_OPTIONS];
            const paginationType = (searchOptions.paginationType ?? CRUD_POLICY[method].default.paginationType) as PaginationType;
            const pagination = PaginationHelper.getPaginationRequest(paginationType, req.body);
            const isNextPage = PaginationHelper.isNextPage(pagination);

            if (Object.keys(req.params ?? {}).length > 0 && !isNextPage) {
                const paramsCondition = Object.entries(req.params).reduce(
                    (queryFilter, [key, operand]) => ({ ...queryFilter, [key]: { operator: '=', operand } }),
                    {},
                );
                if (req.body?.where && Array.isArray(req.body.where)) {
                    for (const queryFilter of req.body.where) {
                        _.merge(queryFilter, paramsCondition);
                    }
                } else {
                    req.body ??= {};
                    req.body.where = [paramsCondition];
                }
            }

            const requestSearchDto = await (async () => {
                if (isNextPage) {
                    const isQueryValid = pagination.setQuery(pagination.query);
                    if (isQueryValid) {
                        return PaginationHelper.deserialize<RequestSearchDto<EntityType>>(pagination.where);
                    }
                }
                const searchBody = await this.validateBody(req.body ?? {});
                pagination.setWhere(
                    PaginationHelper.serialize(
                        (_.omit(searchBody, ['limit', 'offset']) ?? {}) as FindOptionsWhere<typeof crudOptions.entity>,
                    ),
                );
                return searchBody;
            })();

            pagination.query =
                pagination.query ??
                PaginationHelper.serialize((requestSearchDto.where ?? {}) as FindOptionsWhere<typeof crudOptions.entity>);
            const where:
                | Array<FindOptionsWhere<typeof crudOptions.entity>>
                | (FindOptionsWhere<typeof crudOptions.entity> & Partial<typeof crudOptions.entity>) =
                Array.isArray(requestSearchDto.where) && requestSearchDto.where.length > 0
                    ? requestSearchDto.where.map((queryFilter, index) =>
                          TypeOrmQueryBuilderHelper.queryFilterToFindOptionsWhere(queryFilter, index),
                      )
                    : [];

            const paginationKeys = searchOptions.paginationKeys ?? factoryOption.primaryKeys.map(({ name }) => name);
            const numberOfTake =
                (pagination.type === 'cursor' ? requestSearchDto.take : pagination.limit) ??
                searchOptions.numberOfTake ??
                CRUD_POLICY[method].default.numberOfTake;
            const order =
                requestSearchDto.order ?? paginationKeys.reduce((acc, key) => ({ ...acc, [key]: CRUD_POLICY[method].default.sort }), {});

            const withDeleted =
                requestSearchDto.withDeleted ?? crudOptions.routes?.[method]?.softDelete ?? CRUD_POLICY[method].default.softDeleted;

            const crudReadManyRequest: CrudReadManyRequest<typeof crudOptions.entity> = new CrudReadManyRequest<typeof crudOptions.entity>()
                .setPaginationKeys(paginationKeys)
                .setPagination(pagination)
                .setSelectColumn(requestSearchDto.select)
                .setExcludeColumn(searchOptions.exclude)
                .setWhere(where)
                .setTake(numberOfTake)
                .setOrder(order)
                .setWithDeleted(withDeleted)
                .setRelations(this.getRelations(customSearchRequestOptions))
                .setDeserialize(this.deserialize)
                .generate();

            this.crudLogger.logRequest(req, crudReadManyRequest.toString());
            req[CRUD_ROUTE_ARGS] = crudReadManyRequest;

            return next.handle();
        }

        async validateBody(body: unknown): Promise<RequestSearchDto<typeof crudOptions.entity>> {
            const isObject = body !== null && typeof body === 'object' && !Array.isArray(body);
            if (!isObject) {
                throw new UnprocessableEntityException('body should be object');
            }

            const requestSearchDto = plainToInstance(RequestSearchDto<typeof crudOptions.entity>, body);
            const searchOptions = crudOptions.routes?.[method] ?? {};

            if ('select' in requestSearchDto) {
                this.validateSelect(requestSearchDto.select);
            }

            if ('where' in requestSearchDto) {
                await this.validateQueryFilterList(requestSearchDto.where);
            }

            if ('order' in requestSearchDto) {
                this.validateOrder(requestSearchDto.order);
            }

            if ('withDeleted' in requestSearchDto) {
                this.validateWithDeleted(requestSearchDto.withDeleted);
            }

            if ('take' in requestSearchDto) {
                this.validateTake(requestSearchDto.take, searchOptions.limitOfTake);
            }

            return requestSearchDto;
        }

        validateSelect(select: RequestSearchDto<typeof crudOptions.entity>['select']): void {
            if (!Array.isArray(select)) {
                throw new UnprocessableEntityException('select must be array type');
            }
            const differenceKeys = _.difference(select, factoryOption.columns?.map((column) => column.name) ?? []);
            if (differenceKeys.length > 0) {
                throw new UnprocessableEntityException(`select key ${differenceKeys.toLocaleString()} is not included in entity fields`);
            }
        }

        async validateQueryFilterList(value: unknown): Promise<void> {
            if (!Array.isArray(value)) {
                throw new UnprocessableEntityException('where must be array type');
            }
            for (const queryFilter of value) {
                const query: Record<string, unknown> = {};
                if (typeof queryFilter !== 'object' || queryFilter == null) {
                    throw new UnprocessableEntityException('items of where must be object type');
                }
                for (const [key, operation] of Object.entries(queryFilter)) {
                    if (!factoryOption.columns?.some((column) => column.name === key)) {
                        throw new UnprocessableEntityException(`where key ${key} is not included in entity's fields`);
                    }
                    if (typeof operation !== 'object' || operation == null) {
                        throw new UnprocessableEntityException(`where.${key} is not object type`);
                    }
                    if (!('operator' in operation)) {
                        throw new UnprocessableEntityException(`where.${key} not have operator`);
                    }

                    if ('not' in operation && typeof operation.not !== 'boolean') {
                        throw new UnprocessableEntityException(`where.${key} has 'not' value of non-boolean type`);
                    }
                    switch (operation.operator) {
                        case operatorBetween:
                            if (
                                !(
                                    'operand' in operation &&
                                    Array.isArray(operation.operand) &&
                                    operation.operand.length === 2 &&
                                    operation.operand.every(
                                        (operand) => operand != null && typeof operand === typeof (operation.operand as unknown[])[0],
                                    )
                                )
                            ) {
                                throw new UnprocessableEntityException(
                                    `operand for ${operatorBetween} should be array of identical type 2 values, but where.${key} not satisfy it`,
                                );
                            }
                            query[key] = operation.operand[0];
                            break;
                        case operatorIn:
                            if (
                                !(
                                    'operand' in operation &&
                                    Array.isArray(operation.operand) &&
                                    operation.operand.length > 0 &&
                                    operation.operand.every((operand) => typeof operand === typeof (operation.operand as unknown[])[0])
                                )
                            ) {
                                throw new UnprocessableEntityException(
                                    `operand for ${operatorIn} should be array consisting of same type items, but where.${key} not satisfy it`,
                                );
                            }
                            query[key] = operation.operand[0];
                            break;
                        case operatorNull:
                            if ('operand' in operation) {
                                throw new UnprocessableEntityException(
                                    `operand for ${operatorNull} should not be defined, but where.${key} not satisfy it`,
                                );
                            }
                            break;
                        default:
                            if (!('operand' in operation && operatorList.includes(operation.operator as OperatorUnion))) {
                                throw new UnprocessableEntityException(`operator ${operation.operator} for where.${key} is not supported`);
                            }
                            query[key] = operation.operand;
                    }
                }

                const transformed = plainToInstance(
                    CreateParamsDto(crudOptions.entity, Object.keys(query) as unknown as Array<keyof EntityType>),
                    query,
                );
                const errorList = await validate(transformed, {
                    groups: [GROUP.SEARCH],
                    whitelist: true,
                    forbidNonWhitelisted: true,
                    stopAtFirstError: true,
                    forbidUnknownValues: false,
                });

                if (errorList.length > 0) {
                    this.crudLogger.log(errorList, 'ValidationError');
                    throw new UnprocessableEntityException(errorList);
                }
            }
        }

        validateOrder(order: RequestSearchDto<typeof crudOptions.entity>['order']): void {
            if (typeof order !== 'object' || order === null || Array.isArray(order)) {
                throw new UnprocessableEntityException('order must be object type');
            }

            const sortOptions = Object.values(Sort);
            for (const [key, sort] of Object.entries(order)) {
                if (!factoryOption.columns?.some((column) => column.name === key)) {
                    throw new UnprocessableEntityException(`order key ${key} is not included in entity's fields`);
                }
                if (!sortOptions.includes(sort as Sort)) {
                    throw new UnprocessableEntityException(`order type ${sort} is not supported`);
                }
            }
        }

        validateWithDeleted(withDeleted: RequestSearchDto<typeof crudOptions.entity>['withDeleted']): void {
            if (typeof withDeleted !== 'boolean') {
                throw new UnprocessableEntityException('withDeleted must be boolean type');
            }
        }

        validateTake(take: RequestSearchDto<typeof crudOptions.entity>['take'], limitOfTake: number | undefined): number | undefined {
            const takeNumber = Number(take);
            if (take == null || Array.isArray(take) || !Number.isInteger(takeNumber) || takeNumber < 1) {
                throw new UnprocessableEntityException('take must be positive number');
            }
            if (limitOfTake !== undefined && takeNumber > limitOfTake) {
                throw new UnprocessableEntityException(`take must be less than ${limitOfTake}`);
            }
            return takeNumber;
        }

        getRelations(customSearchRequestOptions: CustomSearchRequestOptions): string[] {
            if (Array.isArray(customSearchRequestOptions?.relations)) {
                return customSearchRequestOptions.relations;
            }
            const routeOptions = crudOptions.routes?.[method];
            if (!routeOptions) {
                return factoryOption.relations;
            }
            if (routeOptions.relations === false) {
                return [];
            }
            if (Array.isArray(routeOptions.relations)) {
                return routeOptions.relations;
            }
            return factoryOption.relations;
        }

        deserialize<T>({ pagination, findOptions }: CrudReadManyRequest<T>): Array<FindOptionsWhere<T>> {
            const where = findOptions.where as Array<FindOptionsWhere<EntityType>>;
            if (pagination.type === PaginationType.OFFSET) {
                return where;
            }
            const lastObject: Record<string, unknown> = PaginationHelper.deserialize(pagination.nextCursor);

            const operator = (key: keyof T) =>
                (findOptions.order?.[key] ?? CRUD_POLICY[method].default.sort) === Sort.DESC ? LessThan : MoreThan;

            const cursorCondition: Record<string, FindOperator<T>> = Object.entries(lastObject).reduce(
                (queryFilter, [key, operand]) => ({
                    ...queryFilter,
                    [key]: operator(key as keyof T)(operand),
                }),
                {},
            );

            const mergedKeySet: Set<string> = new Set();
            for (const queryFilter of where) {
                for (const [key, operation] of Object.entries(cursorCondition)) {
                    mergedKeySet.add(key);
                    _.merge(
                        queryFilter,
                        key in queryFilter
                            ? { [key]: And(operation, (queryFilter as Record<string, FindOperator<T>>)[key]) }
                            : { [key]: operation },
                    );
                }
            }
            for (const [key, operation] of Object.entries(cursorCondition)) {
                if (mergedKeySet.has(key)) {
                    continue;
                }
                where.push({ [key]: operation });
            }

            return where;
        }
    }

    return mixin(MixinSearchRequestInterceptor);
}
