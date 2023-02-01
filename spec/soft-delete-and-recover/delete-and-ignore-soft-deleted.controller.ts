import { Controller } from '@nestjs/common';

import { Crud } from '../../src/lib/crud.decorator';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            softDelete: false,
        },
        readMany: {
            softDelete: false,
        },
        delete: {
            softDelete: false,
        },
    },
})
@Controller('delete-and-ignore-soft-deleted')
export class DeleteAndIgnoreSoftDeletedController {
    constructor(public readonly crudService: BaseService) {}
}
