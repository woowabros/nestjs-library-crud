import { Controller } from '@nestjs/common';

import { BaseEntity } from './base.entity';
import { BaseService } from './base.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';

@Crud({
    entity: BaseEntity,
})
@Controller('base')
export class BaseController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
