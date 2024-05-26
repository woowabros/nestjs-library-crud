import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyModule } from './multiple-primary-key.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('MultiplePrimaryKey - Upsert', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MultiplePrimaryKeyModule, TestHelper.getTypeOrmMysqlModule([MultiplePrimaryKeyEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('UPSERT', () => {
        it('should be provided /:uuid1/:uuid2', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.put).toEqual(expect.arrayContaining(['/base/:uuid1/:uuid2']));
        });

        it('upsert a new entity(create) and upsert the same entity(update)', async () => {
            const name = 'name1';
            const responseUpsertCreateAction = await request(app.getHttpServer()).put('/base/uuid1/uuid2').send({ name });

            expect(responseUpsertCreateAction.statusCode).toEqual(HttpStatus.OK);
            expect(responseUpsertCreateAction.body.name).toEqual(name);

            const responseAfterCreate = await request(app.getHttpServer()).get('/base/uuid1/uuid2').expect(HttpStatus.OK);
            expect(responseAfterCreate.body.name).toEqual(name);

            const responseUpsertUpdateAction = await request(app.getHttpServer()).put('/base/uuid1/uuid2').send({ name: 'changed' });

            expect(responseUpsertUpdateAction.statusCode).toEqual(HttpStatus.OK);
            expect(responseUpsertUpdateAction.body.name).toEqual('changed');

            const responseAfterUpdate = await request(app.getHttpServer())
                .get(`/base/${responseUpsertCreateAction.body.uuid1}/${responseUpsertCreateAction.body.uuid2}`)
                .expect(HttpStatus.OK);
            expect(responseAfterUpdate.body.name).toEqual('changed');
        });
    });
});
