import { CallHandler, ExecutionContext, mixin, NestInterceptor, Type, UnprocessableEntityException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { DeepPartial } from 'typeorm';

import { RequestAbstractInterceptor } from '../abstract';
import { CRUD_ROUTE_ARGS } from '../constants';
import { CrudOptions, FactoryOption, CrudCreateRequest, GROUP, Method, EntityType } from '../interface';

interface NestedBaseEntityArray extends Array<NestedBaseEntityArray | DeepPartial<EntityType>> {}
type BaseEntityOrArray = DeepPartial<EntityType> | NestedBaseEntityArray;

const method = Method.CREATE;
export function CreateRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption): Type<NestInterceptor> {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req = context.switchToHttp().getRequest<Request>();
            const createOptions = crudOptions.routes?.[method] ?? {};

            if (req.params) {
                Object.assign(req.body, req.params);
            }
            const body = await this.validateBody(req.body);

            const crudCreateRequest: CrudCreateRequest<typeof crudOptions.entity> = {
                body,
                author: this.getAuthor(req, crudOptions, method),
                exclude: new Set(createOptions.exclude ?? []),
                saveOptions: {
                    listeners: createOptions.listeners,
                },
            };

            this.crudLogger.logRequest(req, crudCreateRequest);
            (req as Record<string, any>)[CRUD_ROUTE_ARGS] = crudCreateRequest;
            return next.handle();
        }

        async validateBody(body: unknown): Promise<BaseEntityOrArray> {
            if (Array.isArray(body)) {
                return Promise.all(body.map((b) => this.validateBody(b)));
            }
            const transformed = plainToInstance(crudOptions.entity as ClassConstructor<EntityType>, body, { groups: [GROUP.CREATE] });
            const errorList = await validate(transformed, { groups: [GROUP.CREATE], whitelist: true, forbidNonWhitelisted: true });
            if (errorList.length > 0) {
                this.crudLogger.log(errorList, 'ValidationError');
                throw new UnprocessableEntityException(errorList);
            }
            return transformed;
        }
    }

    return mixin(MixinInterceptor);
}
