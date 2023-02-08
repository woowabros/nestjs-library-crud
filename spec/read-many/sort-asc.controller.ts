import { Controller } from '@nestjs/common';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudController, Sort } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: { readMany: { sort: Sort.ASC } },
})
@Controller('sort-asc')
export class SortAscController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
