import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { DynamicCrudModule } from '../dynamic-crud.module';
import { TestHelper } from '../test.helper';

describe('Response Option - id', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                DynamicCrudModule({
                    readOne: { response: 'id' },
                    create: { response: 'id' },
                    update: { response: 'id' },
                    delete: { response: 'id' },
                    upsert: { response: 'id' },
                    recover: { response: 'id' },
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

    it('should be returned id as response result', async () => {
        const { body: createdResponseBody } = await request(app.getHttpServer())
            .post('/base')
            .send({ name: 'created' })
            .expect(HttpStatus.CREATED);
        expect(createdResponseBody).toEqual({ id: 1 });

        const { body: upsertResponseBody } = await request(app.getHttpServer())
            .put(`/base/${+createdResponseBody.id + 1}`)
            .send({ name: 'upsert' })
            .expect(HttpStatus.OK);
        expect(upsertResponseBody).toEqual({ id: 2 });

        await new Promise((res) => setTimeout(res, 1000));
        const { body: updatedResponseBody } = await request(app.getHttpServer())
            .patch(`/base/${createdResponseBody.id}`)
            .send({ name: 'updated' })
            .expect(HttpStatus.OK);
        expect(updatedResponseBody).toEqual({ id: 1 });

        const { body: deletedResponse } = await request(app.getHttpServer())
            .delete(`/base/${createdResponseBody.id}`)
            .expect(HttpStatus.OK);
        expect(deletedResponse).toEqual({ id: 1 });

        const { body: recoveredResponse } = await request(app.getHttpServer())
            .post(`/base/${createdResponseBody.id}/recover`)
            .expect(HttpStatus.CREATED);
        expect(recoveredResponse).toEqual({ id: 1 });
    });
});
