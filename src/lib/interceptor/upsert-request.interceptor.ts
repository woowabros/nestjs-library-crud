import { CallHandler, ConflictException, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';

import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS } from '../constants';
import { CrudOptions, CrudUpsertRequest, FactoryOption, GROUP, Method } from '../interface';

export function UpsertRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req: Record<string, any> = context.switchToHttp().getRequest<Request>();

            const params = await this.checkParams(
                crudOptions.entity,
                req.params,
                factoryOption.columns,
                new ConflictException('Invalid params'),
            );

            const primaryKeySet = new Set((factoryOption.primaryKeys ?? []).map((primaryKey) => primaryKey.name));
            for (const [key, value] of Object.entries(req.params)) {
                if (primaryKeySet.has(key)) {
                    continue;
                }
                if (!_.isNil(req.body[key]) && `${req.body[key]}` !== `${value}`) {
                    this.crudLogger.log(`The value of ${req.body[key]} for ${key} is not ${value}`);
                    throw new ConflictException(`${key}'s value of body and param do not match`);
                }
                req.body[key] = value;
            }

            const body = await this.validateBody(req.body);

            const crudUpsertRequest: CrudUpsertRequest<typeof crudOptions.entity> = {
                params,
                body,
                author: this.getAuthor(req, crudOptions, Method.UPSERT),
                exclude: new Set(crudOptions.routes?.[Method.UPSERT]?.exclude ?? []),
            };

            this.crudLogger.logRequest(req, crudUpsertRequest);
            req[CRUD_ROUTE_ARGS] = crudUpsertRequest;

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
                throw new UnprocessableEntityException('Cannot include value of primary key');
            }

            const transformed = plainToInstance(crudOptions.entity, body, { groups: [GROUP.UPSERT] });
            const errorList = await validate(transformed, { groups: [GROUP.UPSERT], whitelist: true, forbidNonWhitelisted: true });

            if (errorList.length > 0) {
                this.crudLogger.log(errorList, 'ValidationError');
                throw new UnprocessableEntityException(errorList);
            }
            return transformed;
        }
    }

    return mixin(MixinInterceptor);
}
