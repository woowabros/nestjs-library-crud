/* eslint-disable @typescript-eslint/naming-convention */
import { Controller, Module, type INestApplication } from '@nestjs/common';
import { OmitType, PickType } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import type { DenormalizedDoc } from '@nestjs/swagger/dist/interfaces/denormalized-doc.interface';
import type { TestingModule } from '@nestjs/testing';

class OmitTypeDto extends OmitType(BaseEntity, ['description']) {}
class PickTypeDto extends PickType(BaseEntity, ['name']) {}

@Crud({
    entity: BaseEntity,
    routes: {
        recover: { swagger: { hide: true } },
        readOne: { swagger: { response: OmitTypeDto } },
        create: { swagger: { body: PickTypeDto } },
        update: { swagger: { response: OmitTypeDto } },
    },
})
@Controller('exclude-swagger')
export class ExcludeSwaggerController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [ExcludeSwaggerController],
    providers: [BaseService],
})
export class ExcludeSwaggerModule {}

describe('exclude swagger > defined name', () => {
    let app: INestApplication;
    let controller: ExcludeSwaggerController;
    let routeSet: Record<string, DenormalizedDoc>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ExcludeSwaggerModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();

        app = moduleFixture.createNestApplication();
        controller = moduleFixture.get<ExcludeSwaggerController>(ExcludeSwaggerController);

        await app.init();

        routeSet = TestHelper.getSwaggerExplorer({
            instance: controller,
            metatype: ExcludeSwaggerController,
        } as InstanceWrapper<ExcludeSwaggerController>);
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should not generate recover route in swagger', async () => {
        const recover = 'post /exclude-swagger/{id}/recover';
        expect(routeSet[recover]).toBeUndefined();
    });

    it('Should be changed swagger readOne response interface', () => {
        const readOne = 'get /exclude-swagger/{id}';
        expect(routeSet[readOne].responses).toEqual({
            '200': {
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/OmitTypeDto' },
                    },
                },
                description: 'Fetch one entity from Base table',
            },
            '400': {
                description: 'Entity that does not exist',
            },
            '422': {
                description: 'Invalid field',
            },
        });
        expect(routeSet[readOne].root?.method).toEqual('get');
        expect(routeSet[readOne].root?.summary).toEqual("Read one from 'Base' Table");
        expect(routeSet[readOne].root?.description).toEqual("Fetch one entity in 'Base' Table");
    });

    it('Should be changed swagger update response interface', () => {
        const update = 'patch /exclude-swagger/{id}';
        expect(routeSet[update].responses).toEqual({
            '200': {
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/OmitTypeDto' },
                    },
                },
                description: 'Updated ok',
            },
            '404': {
                description: 'Not found entity',
            },
            '422': {
                description: 'Invalid field',
            },
        });
        expect(routeSet[update].root?.method).toEqual('patch');
        expect(routeSet[update].root?.summary).toEqual("update one in 'Base' Table");
        expect(routeSet[update].root?.description).toEqual("Update on entity in 'Base' Table");
    });

    it('Should be changed swagger Create request body interface', () => {
        const create = 'post /exclude-swagger';
        expect(routeSet[create].root).toEqual({
            method: 'post',
            path: '/exclude-swagger',
            operationId: 'reservedCreate',
            summary: "create one to 'Base' Table",
            description: "Create an entity in 'Base' Table",
            parameters: [],
            requestBody: {
                description: 'CreateBaseDto',
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/PickTypeDto',
                            anyOf: [
                                {
                                    $ref: '#/components/schemas/PickTypeDto',
                                },
                                {
                                    items: {
                                        $ref: '#/components/schemas/PickTypeDto',
                                    },
                                    type: 'array',
                                },
                            ],
                            type: 'object',
                        },
                    },
                },
            },
        });
    });
});
