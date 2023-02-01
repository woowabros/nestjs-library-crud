import { Controller } from '@nestjs/common';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
})
@Controller('test')
export class ReservedNameController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}

    reservedReadOne() {
        return 'reservedMethodName';
    }
}
