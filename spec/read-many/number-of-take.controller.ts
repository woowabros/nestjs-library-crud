import { Controller } from '@nestjs/common';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: { readMany: { numberOfTake: 10 } },
})
@Controller('take')
export class NumberOfTakeController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
