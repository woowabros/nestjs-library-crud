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
import type { CallHandler, ExecutionContext, NestInterceptor, Type } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { FindOptionsOrder, FindOptionsWhere, FindOperator } from 'typeorm';

const method = Method.SEARCH;
export function SearchRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption): Type<NestInterceptor> {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const searchOptions = crudOptions.routes?.[method] ?? {};
            const customSearchRequestOptions: CustomSearchRequestOptions = req[CUSTOM_REQUEST_OPTIONS];

            if (req.params && req.body?.where && Array.isArray(req.body.where)) {
                const paramsCondition = Object.entries(req.params).reduce(
                    (queryFilter, [key, operand]) => ({ ...queryFilter, [key]: { operator: '=', operand } }),
                    {},
                );
                for (const queryFilter of req.body.where) {
                    _.merge(queryFilter, paramsCondition);
                }
            }
            const paginationType = (searchOptions.paginationType ?? CRUD_POLICY[method].default.paginationType) as PaginationType;
            const pagination = PaginationHelper.getPaginationRequest(paginationType, req.body);
            const isNextPage = PaginationHelper.isNextPage(pagination);

            const requestSearchDto = await (async () => {
                if (isNextPage) {
                    pagination.setQuery(pagination.query ?? btoa('{}'));
                    return PaginationHelper.deserialize<RequestSearchDto<EntityType>>(pagination.where);
                }
                const searchBody = await this.validateBody(req.body);
                pagination.setWhere(PaginationHelper.serialize((searchBody ?? {}) as FindOptionsWhere<typeof crudOptions.entity>));
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
            requestSearchDto.order ??= paginationKeys.reduce((acc, key) => ({ ...acc, [key]: CRUD_POLICY[method].default.sort }), {});

            const crudReadManyRequest: CrudReadManyRequest<typeof crudOptions.entity> = new CrudReadManyRequest<typeof crudOptions.entity>()
                .setPaginationKeys(paginationKeys)
                .setPagination(pagination)
                .setSelectColumn(requestSearchDto.select)
                .setExcludeColumn(searchOptions.exclude)
                .setWhere(where)
                .setTake(requestSearchDto.take ?? CRUD_POLICY[method].default.numberOfTake)
                .setOrder(requestSearchDto.order as FindOptionsOrder<typeof crudOptions.entity>, CRUD_POLICY[method].default.sort)
                .setWithDeleted(
                    requestSearchDto.withDeleted ?? crudOptions.routes?.[method]?.softDelete ?? CRUD_POLICY[method].default.softDeleted,
                )
                .setRelations(this.getRelations(customSearchRequestOptions))
                .setDeserialize(this.deserialize)
                .generate();

            this.crudLogger.logRequest(req, crudReadManyRequest.toString());
            req[CRUD_ROUTE_ARGS] = crudReadManyRequest;

            return next.handle();
        }

        async validateBody(body: unknown): Promise<RequestSearchDto<typeof crudOptions.entity>> {
            const isObject = body !== null && typeof body === 'object';
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
            } else {
                requestSearchDto.withDeleted = searchOptions.softDelete ?? CRUD_POLICY[method].default.softDeleted;
            }

            if ('take' in requestSearchDto) {
                this.validateTake(requestSearchDto.take, searchOptions.limitOfTake);
            }

            requestSearchDto.take =
                'take' in requestSearchDto
                    ? this.validateTake(requestSearchDto.take, searchOptions.limitOfTake)
                    : searchOptions.numberOfTake ?? CRUD_POLICY[method].default.numberOfTake;

            return requestSearchDto;
        }

        validateSelect(select: RequestSearchDto<typeof crudOptions.entity>['select']): void {
            if (!Array.isArray(select)) {
                throw new UnprocessableEntityException('select must be array type');
            }
            const differenceKeys = _.difference(select, factoryOption.columns?.map((column) => column.name) ?? []);
            if (differenceKeys.length > 0) {
                throw new UnprocessableEntityException(`${differenceKeys.toLocaleString()} is unknown`);
            }
        }

        async validateQueryFilterList(value: unknown): Promise<void> {
            if (!Array.isArray(value)) {
                throw new UnprocessableEntityException('incorrect query format');
            }
            for (const queryFilter of value) {
                const query: Record<string, unknown> = {};
                if (typeof queryFilter !== 'object' || queryFilter == null) {
                    throw new UnprocessableEntityException('incorrect queryFilter format');
                }
                for (const [key, operation] of Object.entries(queryFilter)) {
                    if (typeof operation !== 'object' || operation == null || !('operator' in operation)) {
                        throw new UnprocessableEntityException('operator is required');
                    }
                    if (!factoryOption.columns?.some((column) => column.name === key)) {
                        throw new UnprocessableEntityException(`${key} is unknown key`);
                    }

                    if ('not' in operation && typeof operation.not !== 'boolean') {
                        throw new UnprocessableEntityException('Type `not` should be Boolean type');
                    }
                    switch (operation.operator) {
                        case operatorBetween:
                            if (
                                !(
                                    'operand' in operation &&
                                    Array.isArray(operation.operand) &&
                                    operation.operand.length === 2 &&
                                    typeof operation.operand[0] === typeof operation.operand[1]
                                )
                            ) {
                                throw new UnprocessableEntityException(`${operation.operator} allows only array length of 2`);
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
                                    `${operation.operator} allows only array contains item in identical type`,
                                );
                            }
                            query[key] = operation.operand[0];
                            break;
                        case operatorNull:
                            if ('operand' in operation) {
                                throw new UnprocessableEntityException();
                            }
                            break;
                        default:
                            if (!('operand' in operation && operatorList.includes(operation.operator as OperatorUnion))) {
                                throw new UnprocessableEntityException(`${operation.operator} is not support operation type`);
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
            if (typeof order !== 'object') {
                throw new UnprocessableEntityException('order must be object type');
            }

            const sortOptions = Object.values(Sort);
            for (const [key, sort] of Object.entries(order)) {
                if (!factoryOption.columns?.some((column) => column.name === key)) {
                    throw new UnprocessableEntityException(`${key} is unknown key`);
                }
                if (!sortOptions.includes(sort as Sort)) {
                    throw new UnprocessableEntityException(`${sort} is unknown Order Type`);
                }
            }
        }

        validateWithDeleted(withDeleted: RequestSearchDto<typeof crudOptions.entity>['withDeleted']): void {
            if (typeof withDeleted !== 'boolean') {
                throw new UnprocessableEntityException('withDeleted must be boolean type');
            }
        }

        validateTake(take: RequestSearchDto<typeof crudOptions.entity>['take'], limitOfTake: number | undefined): number | undefined {
            if (take == null) {
                throw new UnprocessableEntityException('take must be positive number type');
            }
            const takeNumber = Number(take);
            if (!Number.isInteger(takeNumber) || takeNumber < 1) {
                throw new UnprocessableEntityException('take must be positive number type');
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
            if (crudOptions.routes?.[method]?.relations === false) {
                return [];
            }
            if (crudOptions.routes?.[method] && Array.isArray(crudOptions.routes[method].relations)) {
                return crudOptions.routes[method].relations;
            }
            return factoryOption.relations;
        }

        deserialize<T>({ pagination, findOptions, sort }: CrudReadManyRequest<T>): Array<FindOptionsWhere<T>> {
            const where = findOptions.where as Array<FindOptionsWhere<EntityType>>;
            if (pagination.type === PaginationType.OFFSET) {
                return where;
            }
            const lastObject: Record<string, unknown> = PaginationHelper.deserialize(pagination.nextCursor);

            const operator = (key: keyof T) => ((findOptions.order?.[key] ?? sort) === Sort.DESC ? LessThan : MoreThan);

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

    return mixin(MixinInterceptor);
}
