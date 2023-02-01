/* eslint-disable max-classes-per-file */
import { Controller, forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudController, CrudOptions, PaginationType } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

export function PaginationModule(crudOptions?: Record<PaginationType, CrudOptions['routes']>) {
    function offsetController() {
        @Crud({ entity: BaseEntity, routes: crudOptions?.[PaginationType.OFFSET] })
        @Controller(`${PaginationType.OFFSET}`)
        class OffsetController implements CrudController<BaseEntity> {
            constructor(public readonly crudService: BaseService) {}
        }
        return OffsetController;
    }

    function cursorController() {
        @Crud({ entity: BaseEntity, routes: crudOptions?.[PaginationType.CURSOR] })
        @Controller(`${PaginationType.CURSOR}`)
        class CursorController implements CrudController<BaseEntity> {
            constructor(public readonly crudService: BaseService) {}
        }
        return CursorController;
    }

    function getModule() {
        @Module({
            imports: [
                forwardRef(() =>
                    TypeOrmModule.forRoot({
                        type: 'sqlite',
                        database: ':memory:',
                        entities: [BaseEntity],
                        synchronize: true,
                        logging: true,
                        logger: 'file',
                    }),
                ),
                TypeOrmModule.forFeature([BaseEntity]),
            ],
            controllers: [cursorController(), offsetController()],
            providers: [BaseService],
        })
        class BaseModule {}
        return BaseModule;
    }

    return getModule();
}
