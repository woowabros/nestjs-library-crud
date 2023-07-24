/* eslint-disable max-classes-per-file */
import { Controller, forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Crud, CrudController, CrudOptions, PaginationType } from '../../src';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

export function PaginationModule(crudOptions?: Record<PaginationType, CrudOptions['routes']>) {
    function offsetController() {
        @Crud({ entity: BaseEntity, routes: crudOptions?.[PaginationType.OFFSET], logging: true })
        @Controller(`${PaginationType.OFFSET}`)
        class OffsetController implements CrudController<BaseEntity> {
            constructor(public readonly crudService: BaseService) {}
        }
        return OffsetController;
    }

    function cursorController() {
        @Crud({ entity: BaseEntity, routes: crudOptions?.[PaginationType.CURSOR], logging: true })
        @Controller(`${PaginationType.CURSOR}`)
        class CursorController implements CrudController<BaseEntity> {
            constructor(public readonly crudService: BaseService) {}
        }
        return CursorController;
    }

    function getModule() {
        @Module({
            imports: [forwardRef(() => TestHelper.getTypeOrmMysqlModule([BaseEntity])), TypeOrmModule.forFeature([BaseEntity])],
            controllers: [cursorController(), offsetController()],
            providers: [BaseService],
        })
        class BaseModule {}
        return BaseModule;
    }

    return getModule();
}
