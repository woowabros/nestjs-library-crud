import { Controller } from '@nestjs/common';

import { InheritanceEntityA } from './inheritance-a-entity';
import { InheritanceServiceA } from './inheritance-a.service';
import { Crud, CrudController } from '../../../src';

@Crud({
    entity: InheritanceEntityA,
})
@Controller('base')
export class InheritanceControllerA implements CrudController<InheritanceEntityA> {
    constructor(public readonly crudService: InheritanceServiceA) {}
}
