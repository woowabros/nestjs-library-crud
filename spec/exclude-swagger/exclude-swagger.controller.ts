import { Controller } from '@nestjs/common';
import { IntersectionType, PickType } from '@nestjs/swagger';

import { AdditionalBaseInfo } from './additional-base-info';
import { CustomResponseDto } from './custom-response.dto';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        recover: { swagger: { hide: true } },
        readOne: { swagger: { response: PickType(BaseEntity, ['name']) } },
        readMany: { swagger: { response: IntersectionType(BaseEntity, AdditionalBaseInfo) } },
        create: { swagger: { body: PickType(BaseEntity, ['name']) } },
        update: { swagger: { response: CustomResponseDto } },
    },
})
@Controller('exclude-swagger')
export class ExcludeSwaggerController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
