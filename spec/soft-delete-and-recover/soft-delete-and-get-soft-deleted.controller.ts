import { Controller } from '@nestjs/common';

import { Crud } from '../../src/lib/crud.decorator';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            softDelete: true,
        },
        readMany: {
            softDelete: true,
        },
        delete: {
            softDelete: true,
        },
    },
})
@Controller('soft-delete-and-get-soft-deleted')
export class SoftDeleteAndGetSoftDeletedController {
    constructor(public readonly crudService: BaseService) {}
}
