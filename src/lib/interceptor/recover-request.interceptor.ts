import { CallHandler, ExecutionContext, mixin, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

import { RequestAbstractInterceptor } from '../abstract';
import { Constants } from '../constants';
import { CrudOptions, CrudRecoverRequest, FactoryOption } from '../interface';

export function RecoverRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();

            const customRequestOption = req[Constants.CUSTOM_REQUEST_OPTIONS];
            const params = await this.checkParams(crudOptions.entity, customRequestOption?.params ?? req.params, factoryOption.columns);
            const crudRecoverRequest: CrudRecoverRequest<typeof crudOptions.entity> = {
                params,
            };

            req[Constants.CRUD_ROUTE_ARGS] = crudRecoverRequest;
            return next.handle();
        }
    }

    return mixin(MixinInterceptor);
}
