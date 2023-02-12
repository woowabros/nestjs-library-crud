import { Controller } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { ParamsRequestInterceptor } from './params.request.interceptor';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            interceptors: [ParamsRequestInterceptor],
            decorators: [ApiParam({ name: 'key', required: true })],
        },
        readMany: {
            interceptors: [ParamsRequestInterceptor],
            decorators: [ApiParam({ name: 'key', required: true })],
        },
        create: {
            interceptors: [ParamsRequestInterceptor],
            decorators: [ApiParam({ name: 'key', required: true })],
        },
    },
})
@Controller('swagger-decorator/:key')
export class SwaggerDecoratorController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
