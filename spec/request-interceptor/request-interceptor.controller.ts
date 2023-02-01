import { Controller } from '@nestjs/common';

import { DeleteRequestInterceptor } from './delete.request.interceptor';
import { ReadManyRequestInterceptor } from './read-many.request.interceptor';
import { ReadOneRequestInterceptor } from './read-one.request.interceptor';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            interceptors: [ReadOneRequestInterceptor],
        },
        readMany: {
            interceptors: [ReadManyRequestInterceptor],
        },
        delete: {
            interceptors: [DeleteRequestInterceptor],
        },
    },
})
@Controller('base')
export class RequestInterceptorController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
