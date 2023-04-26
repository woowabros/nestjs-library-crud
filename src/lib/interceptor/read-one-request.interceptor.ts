import { CallHandler, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import QueryString from 'qs';
import { Observable } from 'rxjs';

import { CustomReadOneRequestOptions } from './custom-request.interceptor';
import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS, CUSTOM_REQUEST_OPTIONS } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { RequestFieldsDto } from '../dto/request-fields.dto';
import { CrudOptions, Method, FactoryOption, CrudReadOneRequest } from '../interface';

const method = Method.READ_ONE;
export function ReadOneRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();

            const customReadOneRequestOptions: CustomReadOneRequestOptions = req[CUSTOM_REQUEST_OPTIONS];

            const fieldsByRequest = this.checkFields(req.query?.fields);

            const softDeleted = _.isBoolean(customReadOneRequestOptions?.softDeleted)
                ? customReadOneRequestOptions.softDeleted
                : crudOptions.routes?.[method]?.softDelete ?? (CRUD_POLICY[method].default?.softDelete as boolean);

            const params = await this.checkParams(crudOptions.entity, req.params, factoryOption.columns);

            const crudReadOneRequest: CrudReadOneRequest<typeof crudOptions.entity> = {
                params,
                fields: this.getFields(customReadOneRequestOptions?.fields, fieldsByRequest),
                softDeleted,
                relations: this.getRelations(customReadOneRequestOptions),
            };

            this.crudLogger.logRequest(req, crudReadOneRequest);
            req[CRUD_ROUTE_ARGS] = crudReadOneRequest;

            return next.handle();
        }

        getFields(interceptorFields?: string[], requestFields?: string[]): string[] {
            if (!interceptorFields) {
                return requestFields ?? [];
            }
            if (!requestFields) {
                return interceptorFields ?? [];
            }
            return _.intersection(interceptorFields, requestFields) ?? [];
        }

        checkFields(fields?: string | QueryString.ParsedQs | string[] | QueryString.ParsedQs[]): string[] | undefined {
            if (!fields || (Array.isArray(fields) && fields.length === 0)) {
                return;
            }
            const requestFields = plainToInstance(RequestFieldsDto, { fields });
            const errorList = validateSync(requestFields);
            if (errorList.length > 0) {
                this.crudLogger.log(errorList, 'ValidationError');
                throw new UnprocessableEntityException(errorList);
            }
            const columns = (factoryOption.columns ?? []).map(({ name }) => name);
            const invalidColumns = _.difference(requestFields.fields, columns);
            if (invalidColumns.length > 0) {
                throw new UnprocessableEntityException(`used Invalid name ${invalidColumns.toLocaleString()}`);
            }

            return requestFields.fields;
        }

        getRelations(customReadOneRequestOptions: CustomReadOneRequestOptions): string[] | undefined {
            if (Array.isArray(customReadOneRequestOptions?.relations)) {
                return customReadOneRequestOptions.relations;
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
