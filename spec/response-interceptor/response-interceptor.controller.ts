import { Controller } from '@nestjs/common';

import { ResponseCustomInterceptor } from './response-custom.interceptor';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            interceptors: [ResponseCustomInterceptor],
        },
        readMany: {
            interceptors: [ResponseCustomInterceptor],
        },
        create: {
            interceptors: [ResponseCustomInterceptor],
        },
        delete: {
            interceptors: [ResponseCustomInterceptor],
        },
        recover: {
            interceptors: [ResponseCustomInterceptor],
        },
        update: {
            interceptors: [ResponseCustomInterceptor],
        },
        upsert: {
            interceptors: [ResponseCustomInterceptor],
        },
    },
})
@Controller('base')
export class BaseController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
