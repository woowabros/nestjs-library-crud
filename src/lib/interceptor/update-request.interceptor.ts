import { CallHandler, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';

import { RequestAbstractInterceptor } from '../abstract';
import { Constants } from '../constants';
import { CrudOptions, CrudUpdateOneRequest, FactoryOption, GROUP } from '../interface';

export function UpdateRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const body = await this.validateBody(req.body);

            const params = await this.checkParams(crudOptions.entity, req.params, factoryOption.columns);
            const crudUpdateOneRequest: CrudUpdateOneRequest<typeof crudOptions.entity> = {
                params,
                body,
            };
            req[Constants.CRUD_ROUTE_ARGS] = crudUpdateOneRequest;

            return next.handle();
        }

        async validateBody(body: unknown) {
            if (_.isNil(body) || !_.isObject(body)) {
                throw new UnprocessableEntityException();
            }
            const bodyKeys = Object.keys(body);
            const bodyContainsPrimaryKey = (factoryOption.primaryKeys ?? []).some((primaryKey) => bodyKeys.includes(primaryKey.name));
            if (bodyContainsPrimaryKey) {
                throw new UnprocessableEntityException('Cannot changed value of primary key');
            }

            const transformed = plainToClass(crudOptions.entity, body, { groups: [GROUP.UPDATE] });
            const errorList = await validate(transformed, {
                groups: [GROUP.UPDATE],
                whitelist: true,
                forbidNonWhitelisted: true,
                stopAtFirstError: true,
            });

            if (errorList.length > 0) {
                throw new UnprocessableEntityException(errorList);
            }
            return transformed;
        }
    }
    return mixin(MixinInterceptor);
}
