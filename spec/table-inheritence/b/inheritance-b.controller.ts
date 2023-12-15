import { Controller } from '@nestjs/common';

import { InheritanceEntityB } from './inheritance-b-entity';
import { InheritanceServiceB } from './inheritance-b.service';
import { Crud, CrudController } from '../../../src';

@Crud({
    entity: InheritanceEntityB,
})
@Controller('base')
export class InheritanceControllerB implements CrudController<InheritanceEntityB> {
    constructor(public readonly crudService: InheritanceServiceB) {}
}
