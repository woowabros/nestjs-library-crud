import { CallHandler, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate, validateSync } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';

import { CustomReadManyRequestOptions } from './custom-request.interceptor';
import { RequestAbstractInterceptor } from '../abstract';
import { Constants } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { PaginationCursorDto } from '../dto/pagination-cursor.dto';
import { PaginationOffsetDto } from '../dto/pagination-offset.dto';
import { CrudOptions, CrudReadManyRequest, FactoryOption, Method, Sort, GROUP, PaginationType, PaginationRequest } from '../interface';

const method = Method.READ_MANY;
export function ReadManyRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const readManyOptions = crudOptions.routes?.[method] ?? {};

            const customReadManyRequestOptions: CustomReadManyRequestOptions = req[Constants.CUSTOM_REQUEST_OPTIONS];
            const paginationType = (readManyOptions.paginationType ?? CRUD_POLICY[method].default?.paginationType) as PaginationType;

            if (req.params) {
                Object.assign(req.query, req.params);
            }

            const pagination = this.getPaginationRequest(paginationType, req.query);

            const query = await (async () => {
                if (
                    (pagination.type === PaginationType.CURSOR && !_.isNil(pagination['token'])) ||
                    (pagination.type === PaginationType.OFFSET && (!_.isNil(pagination['offset']) || !_.isNil(pagination['limit'])))
                ) {
                    return;
                }
                return this.validateQuery(req.query);
            })();

            const softDeleted = _.isBoolean(customReadManyRequestOptions?.softDeleted)
                ? customReadManyRequestOptions.softDeleted
                : crudOptions.routes?.[method]?.softDelete ?? (CRUD_POLICY[method].default?.softDelete as boolean);

            const crudReadManyRequest: CrudReadManyRequest<typeof crudOptions.entity> = {
                sort: readManyOptions.sort ? Sort[readManyOptions.sort] : (CRUD_POLICY[method].default?.sort as Sort),
                pagination,
                numberOfTake: readManyOptions.numberOfTake ?? (CRUD_POLICY[method].default?.numberOfTake as number),
                query,
                primaryKeys: factoryOption.primaryKeys ?? [],
                relations: this.getRelations(customReadManyRequestOptions),
                softDeleted,
            };

            this.crudLogger.logRequest(req, crudReadManyRequest);
            req[Constants.CRUD_ROUTE_ARGS] = crudReadManyRequest;

            return next.handle();
        }

        getPaginationRequest(paginationType: PaginationType, query: Record<string, unknown>): PaginationRequest {
            const plain = query ?? {};
            const transformed =
                paginationType === PaginationType.OFFSET
                    ? plainToClass(PaginationOffsetDto, plain, { excludeExtraneousValues: true })
                    : plainToClass(PaginationCursorDto, plain, { excludeExtraneousValues: true });
            const [error] = validateSync(transformed, { stopAtFirstError: true });

            if (error) {
                throw new UnprocessableEntityException(error);
            }
            return transformed;
        }

        async validateQuery(query: Record<string, unknown>) {
            if (_.isNil(query)) {
                return;
            }
            const transformed = plainToClass(crudOptions.entity, query, { groups: [GROUP.READ_MANY] });
            const errorList = await validate(transformed, {
                groups: [GROUP.READ_MANY],
                whitelist: true,
                forbidNonWhitelisted: true,
                stopAtFirstError: true,
            });

            if (errorList.length > 0) {
                this.crudLogger.log(errorList, 'ValidationError');
                throw new UnprocessableEntityException(errorList);
            }
            return transformed;
        }

        getRelations(customReadManyRequestOptions: CustomReadManyRequestOptions): string[] | undefined {
            if (Array.isArray(customReadManyRequestOptions?.relations)) {
                return customReadManyRequestOptions.relations;
            }
            if (crudOptions.routes?.[method]?.relations === false) {
                return [];
            }
            if (crudOptions.routes?.[method] && Array.isArray(crudOptions.routes?.[method]?.relations)) {
                return crudOptions.routes[method].relations;
            }
        }
    }

    return mixin(MixinInterceptor);
}
