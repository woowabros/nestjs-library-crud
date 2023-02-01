import { Controller } from '@nestjs/common';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyService } from './multiple-primary-key.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';

@Crud({
    entity: MultiplePrimaryKeyEntity,
})
@Controller('base')
export class MultiplePrimaryKeyController implements CrudController<MultiplePrimaryKeyEntity> {
    constructor(public readonly crudService: MultiplePrimaryKeyService) {}
}
