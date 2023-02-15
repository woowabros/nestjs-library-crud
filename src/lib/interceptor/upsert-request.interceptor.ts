import { CallHandler, ConflictException, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { Observable } from 'rxjs';

import { RequestAbstractInterceptor } from '../abstract';
import { Constants } from '../constants';
import { CrudOptions, CrudUpsertRequest, FactoryOption, GROUP } from '../interface';

export function UpsertRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
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
                    throw new ConflictException(`${key}'s value of body and param do not match`);
                }
                req.body[key] = value;
            }

            const body = await this.validateBody(req.body);

            const crudUpsertRequest: CrudUpsertRequest<typeof crudOptions.entity> = {
                params,
                body,
            };

            req[Constants.CRUD_ROUTE_ARGS] = crudUpsertRequest;

            return next.handle();
        }

        async validateBody(body: unknown) {
            if (_.isNil(body) || !_.isObject(body)) {
                throw new UnprocessableEntityException();
            }
            const bodyKeys = Object.keys(body);
            const bodyContainsPrimaryKey = (factoryOption.primaryKeys ?? []).some((primaryKey) => bodyKeys.includes(primaryKey.name));
            if (bodyContainsPrimaryKey) {
                throw new UnprocessableEntityException('Cannot include value of primary key');
            }

            const transformed = plainToClass(crudOptions.entity, body, { groups: [GROUP.UPSERT] });
            const errorList = await validate(transformed, { groups: [GROUP.UPSERT], whitelist: true, forbidNonWhitelisted: true });

            if (errorList.length > 0) {
                throw new UnprocessableEntityException(errorList);
            }
            return transformed;
        }
    }

    return mixin(MixinInterceptor);
}
