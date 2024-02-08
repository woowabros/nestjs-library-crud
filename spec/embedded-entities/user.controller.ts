import { Controller } from '@nestjs/common';

import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';

@Crud({
    entity: UserEntity,
})
@Controller('user')
export class UserController implements CrudController<UserEntity> {
    constructor(public readonly crudService: UserService) {}
}
