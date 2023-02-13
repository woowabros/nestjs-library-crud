import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { DynamicCrudModule } from '../dynamic-crud.module';
import { TestHelper } from '../test.helper';

describe('Response Option - entity', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                DynamicCrudModule({
                    readOne: { response: 'entity' },
                    create: { response: 'entity' },
                    update: { response: 'entity' },
                    delete: { response: 'entity' },
                    upsert: { response: 'entity' },
                    recover: { response: 'entity' },
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be returned entity as response result', async () => {
        const { body: createdResponseBody } = await request(app.getHttpServer())
            .post('/base')
            .send({ name: 'created' })
            .expect(HttpStatus.CREATED);
        expect(createdResponseBody).toEqual({
            name: 'created',
            deletedAt: null,
            id: 1,
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
            type: null,
            description: null,
        });

        const { body: upsertResponseBody } = await request(app.getHttpServer())
            .put(`/base/${+createdResponseBody.id + 1}`)
            .send({ name: 'upsert' })
            .expect(HttpStatus.OK);
        expect(upsertResponseBody).toEqual({
            id: 2,
            name: 'upsert',
            deletedAt: null,
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
            type: null,
            description: null,
        });

        await new Promise((res) => setTimeout(res, 1000));
        const { body: updatedResponseBody } = await request(app.getHttpServer())
            .patch(`/base/${createdResponseBody.id}`)
            .send({ name: 'updated' })
            .expect(HttpStatus.OK);
        expect(updatedResponseBody).toEqual({
            name: 'updated',
            deletedAt: null,
            id: 1,
            createdAt: createdResponseBody.createdAt,
            lastModifiedAt: expect.any(String),
            type: null,
            description: null,
        });
        expect(updatedResponseBody.lastModifiedAt).not.toEqual(createdResponseBody.lastModifiedAt);

        const { body: deletedResponse } = await request(app.getHttpServer())
            .delete(`/base/${createdResponseBody.id}`)
            .expect(HttpStatus.OK);
        expect(deletedResponse).toEqual(updatedResponseBody);

        const { body: recoveredResponse } = await request(app.getHttpServer())
            .post(`/base/${createdResponseBody.id}/recover`)
            .expect(HttpStatus.CREATED);
        expect(recoveredResponse).toEqual({
            name: 'updated',
            deletedAt: null,
            id: 1,
            createdAt: createdResponseBody.createdAt,
            lastModifiedAt: expect.any(String),
            type: null,
            description: null,
        });
    });
});
