import { CallHandler, ExecutionContext, mixin, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { BaseEntity } from 'typeorm';

import { RequestAbstractInterceptor } from '../abstract';
import { Constants } from '../constants';
import { CrudOptions, FactoryOption, CrudCreateRequest, GROUP, Method } from '../interface';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface NestedBaseEntityArray extends Array<NestedBaseEntityArray | BaseEntity> {}
type BaseEntityOrArray = BaseEntity | NestedBaseEntityArray;

export function CreateRequestInterceptor(crudOptions: CrudOptions, factoryOption: FactoryOption) {
    class MixinInterceptor extends RequestAbstractInterceptor implements NestInterceptor {
        constructor() {
            super(factoryOption.logger);
        }

        async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
            const req = context.switchToHttp().getRequest<Request>();

            if (req.params) {
                Object.assign(req.body, req.params);
            }
            const body = await this.validateBody(req.body);

            const crudCreateRequest: CrudCreateRequest<typeof crudOptions.entity> = {
                body,
                author: this.getAuthor(req, crudOptions, Method.CREATE),
            };

            this.crudLogger.logRequest(req, crudCreateRequest);
            (req as Record<string, any>)[Constants.CRUD_ROUTE_ARGS] = crudCreateRequest;
            return next.handle();
        }

        async validateBody(body: unknown): Promise<BaseEntityOrArray> {
            if (Array.isArray(body)) {
                return Promise.all(body.map((b) => this.validateBody(b)));
            }
            const transformed = plainToClass(crudOptions.entity, body, { groups: [GROUP.CREATE] });
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
