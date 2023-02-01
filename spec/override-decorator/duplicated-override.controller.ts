import { Controller } from '@nestjs/common';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { Override } from '../../src/lib/override.decorator';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
})
@Controller('test')
export class DuplicatedOverrideController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}

    @Override('READ_ONE')
    overrideReadOne1() {
        return 'readOne1';
    }

    @Override('READ_ONE')
    overrideReadOne2() {
        return 'readOne2';
    }
}
