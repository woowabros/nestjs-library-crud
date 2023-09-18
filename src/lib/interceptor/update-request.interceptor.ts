import { CallHandler, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';

import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS } from '../constants';
import { CrudOptions, CrudUpdateOneRequest, FactoryOption, GROUP, Method } from '../interface';

export function UpdateRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();
            const body = await this.validateBody(req.body);

            const params = await this.checkParams(crudOptions.entity, req.params, factoryOption.columns);
            const crudUpdateOneRequest: CrudUpdateOneRequest<typeof crudOptions.entity> = {
                params,
                body,
                author: this.getAuthor(req, crudOptions, Method.UPDATE),
                exclude: new Set(crudOptions.routes?.[Method.UPDATE]?.exclude ?? []),
            };

            this.crudLogger.logRequest(req, crudUpdateOneRequest);
            req[CRUD_ROUTE_ARGS] = crudUpdateOneRequest;

            return next.handle();
        }

        async validateBody(body: unknown) {
            if (_.isNil(body) || !_.isObject(body)) {
                throw new UnprocessableEntityException();
            }
            const bodyKeys = Object.keys(body);
            const bodyContainsPrimaryKey = (factoryOption.primaryKeys ?? []).some((primaryKey) => bodyKeys.includes(primaryKey.name));
            if (bodyContainsPrimaryKey) {
                this.crudLogger.log(
                    `Cannot include value of primary key (primary key: ${(
                        factoryOption.primaryKeys ?? []
                    ).toLocaleString()}, body key: ${bodyKeys.toLocaleString()}`,
                );
                throw new UnprocessableEntityException('Cannot changed value of primary key');
            }

            const transformed = plainToInstance(crudOptions.entity, body, { groups: [GROUP.UPDATE] });
            const errorList = await validate(transformed, {
                groups: [GROUP.UPDATE],
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
    }
    return mixin(MixinInterceptor);
}
