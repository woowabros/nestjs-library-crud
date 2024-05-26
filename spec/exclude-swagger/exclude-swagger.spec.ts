/* eslint-disable @typescript-eslint/naming-convention */
import { INestApplication } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { DenormalizedDoc } from '@nestjs/swagger/dist/interfaces/denormalized-doc.interface';
import { Test, TestingModule } from '@nestjs/testing';

import { ExcludeSwaggerController } from './exclude-swagger.controller';
import { ExcludeSwaggerModule } from './exclude-swagger.module';
import { BaseEntity } from '../base/base.entity';
import { TestHelper } from '../test.helper';

describe('exclude swagger by route', () => {
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
                        schema: { $ref: '#/components/schemas/ReadOneBaseResponseDto' },
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
                        schema: { $ref: '#/components/schemas/CustomResponseDto' },
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
                            $ref: '#/components/schemas/CreateBaseBodyDto',
                            anyOf: [
                                {
                                    $ref: '#/components/schemas/CreateBaseBodyDto',
                                },
                                {
                                    items: {
                                        $ref: '#/components/schemas/CreateBaseBodyDto',
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
