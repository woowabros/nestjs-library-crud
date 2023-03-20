import { CallHandler, ExecutionContext, mixin, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';

import { CustomDeleteRequestOptions } from './custom-request.interceptor';
import { RequestAbstractInterceptor } from '../abstract';
import { Constants } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { CrudDeleteOneRequest, CrudOptions, Method, FactoryOption } from '../interface';

const method = Method.DELETE;
export function DeleteRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const deleteOptions = crudOptions.routes?.[method] ?? {};
            const customDeleteRequestOptions: CustomDeleteRequestOptions = req[Constants.CUSTOM_REQUEST_OPTIONS];

            const softDeleted = _.isBoolean(customDeleteRequestOptions?.softDeleted)
                ? customDeleteRequestOptions.softDeleted
                : deleteOptions.softDelete ?? (CRUD_POLICY[method].default?.softDeleted as boolean);

            const params = await this.checkParams(crudOptions.entity, req.params, factoryOption.columns);
            const crudDeleteOneRequest: CrudDeleteOneRequest<typeof crudOptions.entity> = {
                params,
                softDeleted,
                author: this.getAuthor(req, crudOptions, method),
            };

            this.crudLogger.interceptor(req, crudDeleteOneRequest);
            req[Constants.CRUD_ROUTE_ARGS] = crudDeleteOneRequest;

            return next.handle();
        }
    }

    return mixin(MixinInterceptor);
}
