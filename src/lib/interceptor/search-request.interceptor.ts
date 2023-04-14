import { CallHandler, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { BaseEntity } from 'typeorm';

import { CustomSearchRequestOptions } from './custom-request.interceptor';
import { RequestAbstractInterceptor } from '../abstract';
import { Constants } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { CreateParamsDto } from '../dto/params.dto';
import { RequestSearchDto } from '../dto/request-search.dto';
import { CrudOptions, CrudSearchRequest, FactoryOption, GROUP, Method, Sort } from '../interface';
import { operatorBetween, operatorIn, operatorNull, operatorList, OperatorUnion } from '../interface/query-operation.interface';
import { PaginationHelper } from '../provider';

const method = Method.SEARCH;
export function SearchRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();

            const customSearchRequestOptions: CustomSearchRequestOptions = req[Constants.CUSTOM_REQUEST_OPTIONS];

            if (req.params && req.body?.where && Array.isArray(req.body.where)) {
                const paramsCondition = Object.entries(req.params).reduce(
                    (queryFilter, [key, operand]) => ({ ...queryFilter, [key]: { operator: '=', operand } }),
                    {},
                );
                for (const queryFilter of req.body.where) {
                    _.merge(queryFilter, paramsCondition);
                }
            }
            const requestSearchDto = await this.validateBody(req.body);
            const crudSearchRequest: CrudSearchRequest<typeof crudOptions.entity> = {
                requestSearchDto,
                relations: customSearchRequestOptions?.relations,
            };

            this.crudLogger.logRequest(req, crudSearchRequest);
            req[Constants.CRUD_ROUTE_ARGS] = crudSearchRequest;

            return next.handle();
        }

        async validateBody(body: unknown): Promise<RequestSearchDto<typeof crudOptions.entity>> {
            const isObject = body !== null && typeof body === 'object';
            if (!isObject) {
                throw new UnprocessableEntityException('body should be object');
            }

            const requestSearchDto = plainToInstance(RequestSearchDto<typeof crudOptions.entity>, body);
            const searchOptions = crudOptions.routes?.[method] ?? {};

            if ('nextCursor' in requestSearchDto) {
                return this.validatePagination(requestSearchDto);
            }

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
                requestSearchDto.withDeleted = searchOptions.softDelete ?? (CRUD_POLICY[method].default?.softDeleted as boolean);
            }

            requestSearchDto.take =
                'take' in requestSearchDto
                    ? this.validateTake(requestSearchDto.take, searchOptions.limitOfTake)
                    : searchOptions.numberOfTake ?? (CRUD_POLICY[method].default?.numberOfTake as number);

            return requestSearchDto;
        }

        validatePagination(requestSearchDto: RequestSearchDto<typeof BaseEntity>): RequestSearchDto<typeof crudOptions.entity> {
            if (typeof requestSearchDto.nextCursor !== 'string') {
                throw new UnprocessableEntityException('nextCursor should be String type');
            }
            if ('query' in requestSearchDto && typeof requestSearchDto.query !== 'string') {
                throw new UnprocessableEntityException('query should be String type');
            }
            const preCondition = PaginationHelper.deserialize<RequestSearchDto<typeof crudOptions.entity>>(requestSearchDto.query);
            const lastObject: Record<string, unknown> = PaginationHelper.deserialize(requestSearchDto.nextCursor);
            preCondition.where = preCondition.where ?? [{}];

            const cursorCondition = Object.entries(lastObject).reduce(
                (queryFilter, [key, operand]) => ({
                    ...queryFilter,
                    [key]: {
                        operator: _.get(preCondition.order, 'key', CRUD_POLICY[method].default?.sort) === Sort.DESC ? '<' : '>',
                        operand,
                    },
                }),
                {},
            );
            for (const queryFilter of preCondition.where) {
                _.merge(queryFilter, cursorCondition);
            }
            return preCondition;
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
            if (!Array.isArray(value) || value.length === 0) {
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
                                    operation.operand.every((operand) => typeof operand === typeof (operation.operand as any)[0])
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
                    CreateParamsDto(crudOptions.entity, Object.keys(query) as unknown as Array<keyof BaseEntity>),
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
            const takeNumber = +take;
            if (!Number.isInteger(takeNumber) || takeNumber < 1) {
                throw new UnprocessableEntityException('take must be positive number type');
            }
            if (!!limitOfTake && takeNumber > limitOfTake) {
                throw new UnprocessableEntityException(`take must be less than ${limitOfTake}`);
            }
            return takeNumber;
        }
    }

    return mixin(MixinInterceptor);
}
