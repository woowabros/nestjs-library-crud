/* eslint-disable max-classes-per-file */
import { Controller, forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BaseEntity } from './base/base.entity';
import { BaseService } from './base/base.service';
import { Crud } from '../src/lib/crud.decorator';
import { CrudController, CrudOptions } from '../src/lib/interface';

export function DynamicCrudModule(routeOption: CrudOptions['routes'], prefix = 'base', entity = BaseEntity) {
    function getController() {
        @Crud({ entity, routes: routeOption })
        @Controller(prefix)
        class BaseController implements CrudController<BaseEntity> {
            constructor(public readonly crudService: BaseService) {}
        }
        return BaseController;
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
            controllers: [getController()],
            providers: [BaseService],
        })
        class BaseModule {}
        return BaseModule;
    }

    return getModule();
}
