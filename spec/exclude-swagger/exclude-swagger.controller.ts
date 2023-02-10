import { Controller } from '@nestjs/common';
import { PickType } from '@nestjs/swagger';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({ entity: BaseEntity, routes: { recover: { swagger: false }, create: { body: PickType(BaseEntity, ['name']) } } })
@Controller('exclude-swagger')
export class ExcludeSwaggerController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
