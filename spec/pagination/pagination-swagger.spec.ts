import { Controller, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Crud, CrudController } from '../../src';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import type { DenormalizedDoc } from '@nestjs/swagger/dist/interfaces/denormalized-doc.interface';
import type { TestingModule } from '@nestjs/testing';

@Crud({
    entity: BaseEntity,
    routes: {
        readMany: { paginationType: 'cursor' },
        search: { paginationType: 'cursor' },
    },
})
@Controller('cursor')
class CursorController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}

@Crud({
    entity: BaseEntity,
    routes: {
        readMany: { paginationType: 'offset' },
        search: { paginationType: 'offset' },
    },
})
@Controller('offset')
class OffsetController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}

@Module({
    imports: [TestHelper.getTypeOrmMysqlModule([BaseEntity]), TypeOrmModule.forFeature([BaseEntity])],
    controllers: [CursorController, OffsetController],
    providers: [BaseService],
})
export class PaginationSwaggerModule {}

describe('Swagger for pagination', () => {
    let moduleFixture: TestingModule;
    let app: INestApplication;

    beforeAll(async () => {
        moduleFixture = await Test.createTestingModule({
            imports: [PaginationSwaggerModule],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('Offset', () => {
        let routeSet: Record<string, DenormalizedDoc>;

        beforeAll(() => {
            const controller = moduleFixture.get<OffsetController>(OffsetController);
            routeSet = TestHelper.getSwaggerExplorer({
                instance: controller,
                metatype: OffsetController,
            } as InstanceWrapper<OffsetController>);
        });

        it('Should be generated query parameter for readMany pagination', () => {
            const readMany = 'get /offset';
            expect(routeSet[readMany].root?.parameters).toEqual(
                expect.arrayContaining([
                    {
                        description: 'Query parameters for Offset Pagination',
                        in: 'query',
                        name: 'limit',
                        required: false,
                        schema: { type: 'integer' },
                    },
                    {
                        description: 'Query parameters for Offset Pagination',
                        in: 'query',
                        name: 'offset',
                        required: false,
                        schema: { type: 'integer' },
                    },
                    {
                        description: 'Query parameters for Offset Pagination',
                        in: 'query',
                        name: 'nextCursor',
                        required: false,
                        schema: { type: 'string' },
                    },
                ]),
            );
        });

        it('Should be generated request body for search pagination', () => {
            const search = 'post /offset/search';
            expect(routeSet[search].root?.requestBody).toEqual(
                expect.objectContaining({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RequestSearchOffsetDto' } } },
                }),
            );
        });
    });

    describe('Cursor', () => {
        let routeSet: Record<string, DenormalizedDoc>;

        beforeAll(() => {
            const controller = moduleFixture.get<CursorController>(CursorController);
            routeSet = TestHelper.getSwaggerExplorer({
                instance: controller,
                metatype: CursorController,
            } as InstanceWrapper<OffsetController>);
        });

        it('Should be generated query parameter for readMany pagination', () => {
            const readMany = 'get /cursor';
            expect(routeSet[readMany].root?.parameters).toEqual(
                expect.arrayContaining([
                    {
                        description: 'Query parameters for Cursor Pagination',
                        in: 'query',
                        name: 'nextCursor',
                        required: false,
                        schema: { type: 'string' },
                    },
                ]),
            );
        });

        it('Should be generated request body for search pagination', () => {
            const search = 'post /cursor/search';
            expect(routeSet[search].root?.requestBody).toEqual(
                expect.objectContaining({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RequestSearchDto' } } },
                }),
            );
        });
    });
});
