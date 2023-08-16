/* eslint-disable @typescript-eslint/naming-convention */
import { INestApplication } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { DenormalizedDoc } from '@nestjs/swagger/dist/interfaces/denormalized-doc.interface';
import { Test, TestingModule } from '@nestjs/testing';

import { BaseController } from './base.controller';
import { BaseEntity } from './base.entity';
import { BaseModule } from './base.module';
import { TestHelper } from '../test.helper';

describe('BaseController Swagger Decorator', () => {
    let app: INestApplication;
    let controller: BaseController;
    let routeSet: Record<string, DenormalizedDoc>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [BaseModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        controller = moduleFixture.get<BaseController>(BaseController);
        await app.init();

        routeSet = TestHelper.getSwaggerExplorer({
            instance: controller,
            metatype: BaseController,
        } as InstanceWrapper<BaseController>);
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should generate api operation and response to ReadOne method', () => {
        const readOne = 'get /base/{id}';
        expect(routeSet[readOne].responses).toEqual({
            '200': {
                content: expect.any(Object),
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

    it('should generate api operation and response to ReadMany method', () => {
        const readMany = 'get /base';

        expect(routeSet[readMany].responses).toEqual({
            '200': {
                content: expect.any(Object),
                description: 'Fetch many entities from Base table',
            },
            '422': {
                description: 'Invalid query',
            },
        });
        expect(routeSet[readMany].root?.method).toEqual('get');
        expect(routeSet[readMany].root?.summary).toEqual("read many from 'Base' Table");
        expect(routeSet[readMany].root?.description).toEqual("Fetch multiple entities in 'Base' Table");
        expect(routeSet[readMany].root?.parameters).toHaveLength(4);
        expect(routeSet[readMany].root?.parameters).toEqual(
            expect.arrayContaining([
                {
                    name: 'nextCursor',
                    in: 'query',
                    required: false,
                    description: 'Query parameters for Cursor Pagination',
                    schema: { type: 'string' },
                },
                {
                    name: 'name',
                    in: 'query',
                    required: false,
                    description: 'Query string filter by BaseEntity.name',
                    schema: { type: 'string' },
                },
                {
                    name: 'type',
                    in: 'query',
                    required: false,
                    description: 'Query string filter by BaseEntity.type',
                    schema: { type: 'string' },
                },
                {
                    name: 'description',
                    in: 'query',
                    required: false,
                    description: 'Query string filter by BaseEntity.description',
                    schema: { type: 'string' },
                },
            ]),
        );
        expect(routeSet[readMany].root?.parameters).not.toEqual(
            expect.arrayContaining([
                {
                    name: 'query',
                    in: 'query',
                    required: false,
                    description: 'Query parameters for Cursor Pagination',
                    schema: { type: 'string' },
                },
            ]),
        );
    });

    it('should generate api operation and response to Create method', () => {
        const create = 'post /base';
        expect(routeSet[create].responses).toEqual({
            '201': {
                description: 'Created ok',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/BaseEntity' },
                    },
                },
            },
            '409': {
                description: 'Cannot create',
            },
            '422': {
                description: 'Invalid field',
            },
        });
        expect(routeSet[create].root?.method).toEqual('post');
        expect(routeSet[create].root?.summary).toEqual("create one to 'Base' Table");
        expect(routeSet[create].root?.description).toEqual("Create an entity in 'Base' Table");
    });

    it('should generate api operation and response to Delete method', () => {
        const deleteKey = 'delete /base/{id}';

        expect(routeSet[deleteKey].responses).toEqual({
            '200': {
                description: 'Deleted ok',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/BaseEntity' },
                    },
                },
            },
            '404': {
                description: 'Not found entity',
            },
            '409': {
                description: 'Cannot found primary key from entity',
            },
        });
        expect(routeSet[deleteKey].root?.method).toEqual('delete');
        expect(routeSet[deleteKey].root?.summary).toEqual("delete one from 'Base' Table");
        expect(routeSet[deleteKey].root?.description).toEqual("Delete one entity from 'Base' Table");
    });

    it('should generate api operation and response to Update method', () => {
        const updateKey = 'patch /base/{id}';
        expect(routeSet[updateKey].responses).toEqual({
            '200': {
                description: 'Updated ok',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/BaseEntity' },
                    },
                },
            },
            '404': {
                description: 'Not found entity',
            },
            '422': {
                description: 'Invalid field',
            },
        });
        expect(routeSet[updateKey].root?.method).toEqual('patch');
        expect(routeSet[updateKey].root?.summary).toEqual("update one in 'Base' Table");
        expect(routeSet[updateKey].root?.description).toEqual("Update on entity in 'Base' Table");
    });

    it('should generate api operation and response to Upsert method', () => {
        const updateKey = 'put /base/{id}';
        expect(routeSet[updateKey].responses).toEqual({
            '200': {
                description: 'Upsert ok',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/BaseEntity',
                        },
                    },
                },
            },
            '409': {
                description: 'Invalid params or if deleted',
            },
            '422': {
                description: 'Invalid field',
            },
        });
        expect(routeSet[updateKey].root?.method).toEqual('put');
        expect(routeSet[updateKey].root?.summary).toEqual("upsert one to 'Base' Table");
        expect(routeSet[updateKey].root?.description).toEqual("Create or update one entity in 'Base' Table");
    });

    it('should generate api operation and response to Recover method', () => {
        const recover = 'post /base/{id}/recover';
        expect(routeSet[recover].responses).toEqual({
            '201': {
                description: 'Recovered ok',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/BaseEntity',
                        },
                    },
                },
            },
            '404': {
                description: 'Not found entity',
            },
        });
        expect(routeSet[recover].root?.method).toEqual('post');
        expect(routeSet[recover].root?.summary).toEqual("recover one from 'Base' Table");
        expect(routeSet[recover].root?.description).toEqual("Recover one entity from 'Base' Table");
    });

    it('should generate api operation and response to Search method', () => {
        const search = 'post /base/search';
        expect(routeSet[search].responses).toEqual({
            '200': {
                content: expect.any(Object),
                description: "Fetch multiple entities from 'Base' table",
            },
            '422': {
                description: 'Invalid query',
            },
        });
        expect(routeSet[search].root?.method).toEqual('post');
        expect(routeSet[search].root?.summary).toEqual("Search from 'Base' Table");
        expect(routeSet[search].root?.description).toEqual("Fetch multiple entities in 'Base' Table via custom query in body");
        expect(routeSet[search].root?.requestBody).toEqual({
            description: 'SearchBaseDto',
            required: true,
            content: {
                'application/json': {
                    schema: {
                        $ref: '#/components/schemas/RequestSearchDto',
                    },
                },
            },
        });
    });
});
