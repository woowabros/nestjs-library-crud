import { CallHandler, ExecutionContext, mixin, NestInterceptor, Type } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS, CUSTOM_REQUEST_OPTIONS } from '../constants';
import { CrudOptions, CrudRecoverRequest, FactoryOption, Method } from '../interface';

const method = Method.RECOVER;
export function RecoverRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption): Type<NestInterceptor> {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const recoverOptions = crudOptions.routes?.[method] ?? {};

            const customRequestOption = req[CUSTOM_REQUEST_OPTIONS];
            const params = await this.checkParams(crudOptions.entity, customRequestOption?.params ?? req.params, factoryOption.columns);
            const crudRecoverRequest: CrudRecoverRequest<typeof crudOptions.entity> = {
                params,
                author: this.getAuthor(req, crudOptions, method),
                exclude: new Set(recoverOptions.exclude ?? []),
                saveOptions: {
                    listeners: recoverOptions.listeners,
                },
            };

            this.crudLogger.logRequest(req, crudRecoverRequest);
            req[CRUD_ROUTE_ARGS] = crudRecoverRequest;
            return next.handle();
        }
    }

    return mixin(MixinInterceptor);
}
