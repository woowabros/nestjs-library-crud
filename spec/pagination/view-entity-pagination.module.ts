import { Controller, forwardRef, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import { Repository, ViewColumn, ViewEntity } from 'typeorm';

import { Crud, CrudController, CrudOptions, CrudService, Method, PaginationType } from '../../src';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

@ViewEntity('base_view', {
    expression: `
        SELECT DISTINCT id, name, type % 2 as category FROM base
    `,
})
export class BaseView {
    @ViewColumn()
    @Type(() => String)
    id: string;

    @ViewColumn()
    @Type(() => String)
    name: string;

    @ViewColumn()
    @Type(() => Number)
    category: number;
}

export class BaseViewService extends CrudService<BaseView> {
    constructor(@InjectRepository(BaseView) repository: Repository<BaseView>) {
        super(repository);
    }
}

export function ViewEntityPaginationModule(crudOptions?: Record<PaginationType, CrudOptions['routes']>) {
    function cursorController() {
        @Crud({
            entity: BaseView,
            routes: crudOptions?.[PaginationType.CURSOR],
            only: [Method.READ_MANY, Method.SEARCH],
            logging: true,
        })
        @Controller(`${PaginationType.CURSOR}`)
        class CursorController implements CrudController<BaseView> {
            constructor(public readonly crudService: BaseViewService) {}
        }
        return CursorController;
    }

    function offsetController() {
        @Crud({ entity: BaseView, routes: crudOptions?.[PaginationType.OFFSET], only: [Method.READ_MANY, Method.SEARCH], logging: true })
        @Controller(`${PaginationType.OFFSET}`)
        class OffsetController implements CrudController<BaseView> {
            constructor(public readonly crudService: BaseViewService) {}
        }
        return OffsetController;
    }

    function getModule() {
        @Module({
            imports: [
                forwardRef(() => TestHelper.getTypeOrmMysqlModule([BaseEntity, BaseView])),
                TypeOrmModule.forFeature([BaseEntity, BaseView]),
            ],
            controllers: [cursorController(), offsetController()],
            providers: [BaseViewService, BaseService],
        })
        class BaseViewModule {}
        return BaseViewModule;
    }

    return getModule();
}
