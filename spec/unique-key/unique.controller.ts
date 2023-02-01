import { Controller } from '@nestjs/common';

import { UniqueEntity } from './unique.entity';
import { UniqueService } from './unique.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';

@Crud({
    entity: UniqueEntity,
})
@Controller('unique')
export class UniqueController implements CrudController<UniqueEntity> {
    constructor(public readonly crudService: UniqueService) {}
}
