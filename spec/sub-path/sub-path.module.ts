/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable max-classes-per-file */
import { Controller, forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DepthOneEntity } from './depth-one.entity';
import { DepthOneService } from './depth-one.service';
import { DepthTwoEntity } from './depth-two.entity';
import { DepthTwoService } from './depth-two.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';

export function SubPathModule() {
    function depthOneController() {
        @Crud({ entity: DepthOneEntity })
        @Controller(':parentId/child')
        class DepthOneController implements CrudController<DepthOneEntity> {
            constructor(public readonly crudService: DepthOneService) {}
        }
        return DepthOneController;
    }

    function depthTwoController() {
        @Crud({ entity: DepthTwoEntity })
        @Controller(':parentId/sub/:subId/child')
        class DepthOneController implements CrudController<DepthTwoEntity> {
            constructor(public readonly crudService: DepthTwoService) {}
        }
        return DepthOneController;
    }

    function getModule() {
        @Module({
            imports: [
                forwardRef(() =>
                    TypeOrmModule.forRoot({
                        type: 'sqlite',
                        database: ':memory:',
                        entities: [DepthOneEntity, DepthTwoEntity],
                        synchronize: true,
                        logging: true,
                        logger: 'file',
                    }),
                ),
                TypeOrmModule.forFeature([DepthOneEntity, DepthTwoEntity]),
            ],
            controllers: [depthOneController(), depthTwoController()],
            providers: [DepthOneService, DepthTwoService],
        })
        class SubPathModule {}
        return SubPathModule;
    }
    return getModule();
}
