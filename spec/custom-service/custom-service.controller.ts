import { Controller } from '@nestjs/common';

import { CustomServiceService } from './custom-service.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController, Method } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';

@Crud({
    entity: BaseEntity,
    only: [Method.CREATE, Method.UPDATE, Method.READ_ONE, Method.DELETE],
    routes: {
        create: {
            serviceMethod: 'newCreate',
        },
        readOne: {
            serviceMethod: 'wrongMethod',
        },
        delete: {
            serviceMethod: 'newDelete',
        },
    },
})
@Controller('test')
export class CustomServiceController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: CustomServiceService) {}
}
