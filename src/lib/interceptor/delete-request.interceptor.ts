import { mixin } from '@nestjs/common';
import _ from 'lodash';

import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS, CUSTOM_REQUEST_OPTIONS } from '../constants';
import { CRUD_POLICY } from '../crud.policy';
import { Method } from '../interface';

import type { CustomDeleteRequestOptions } from './custom-request.interceptor';
import type { CrudDeleteOneRequest, CrudOptions, FactoryOption } from '../interface';
import type { CallHandler, ExecutionContext, NestInterceptor, Type } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';

const method = Method.DELETE;
export function DeleteRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption): Type<NestInterceptor> {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const deleteOptions = crudOptions.routes?.[method] ?? {};
            const customDeleteRequestOptions: CustomDeleteRequestOptions = req[CUSTOM_REQUEST_OPTIONS];

            const softDeleted = _.isBoolean(customDeleteRequestOptions?.softDeleted)
                ? customDeleteRequestOptions.softDeleted
                : deleteOptions.softDelete ?? CRUD_POLICY[method].default.softDeleted;

            const params = await this.checkParams(crudOptions.entity, req.params, factoryOption.columns);
            const crudDeleteOneRequest: CrudDeleteOneRequest<typeof crudOptions.entity> = {
                params,
                softDeleted,
                author: this.getAuthor(req, crudOptions, method),
                exclude: new Set(deleteOptions.exclude ?? []),
                saveOptions: {
                    listeners: deleteOptions.listeners,
                },
            };

            this.crudLogger.logRequest(req, crudDeleteOneRequest);
            req[CRUD_ROUTE_ARGS] = crudDeleteOneRequest;

            return next.handle();
        }
    }

    return mixin(MixinInterceptor);
}
