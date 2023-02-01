import { Controller } from '@nestjs/common';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityService } from './custom-entity.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';

@Crud({
    entity: CustomEntity,
})
@Controller('base')
export class CustomEntityController implements CrudController<CustomEntity> {
    constructor(public readonly crudService: CustomEntityService) {}
}
