import { Controller, UseGuards } from '@nestjs/common';

import { AuthGuard } from './auth.guard';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            decorators: [UseGuards(AuthGuard)],
        },
        readMany: {
            decorators: [UseGuards(AuthGuard)],
        },
        create: {
            decorators: [UseGuards(AuthGuard)],
        },
        update: {
            decorators: [UseGuards(AuthGuard)],
        },
        delete: {
            decorators: [UseGuards(AuthGuard)],
        },
        upsert: {
            decorators: [UseGuards(AuthGuard)],
        },
        recover: {
            decorators: [UseGuards(AuthGuard)],
        },
        search: {
            decorators: [UseGuards(AuthGuard)],
        },
    },
})
@Controller('auth-guard')
export class AuthGuardController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}
