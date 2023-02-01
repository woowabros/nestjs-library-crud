import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import request from 'supertest';

import { DynamicCrudModule } from '../dynamic-crud.module';

describe('Response Option - none', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                DynamicCrudModule({
                    readOne: { response: 'none' },
                    create: { response: 'none' },
                    update: { response: 'none' },
                    delete: { response: 'none' },
                    upsert: { response: 'none' },
                    recover: { response: 'none' },
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should be returned id as response result', async () => {
        const { body: createdResponseBody } = await request(app.getHttpServer())
            .post('/base')
            .send({ name: 'created' })
            .expect(HttpStatus.CREATED);
        expect(createdResponseBody).toEqual({});

        const { body: upsertResponseBody } = await request(app.getHttpServer())
            .put('/base/2')
            .send({ name: 'upsert' })
            .expect(HttpStatus.OK);
        expect(upsertResponseBody).toEqual({});

        await new Promise((res) => setTimeout(res, 1000));
        const { body: updatedResponseBody } = await request(app.getHttpServer())
            .patch('/base/1')
            .send({ name: 'updated' })
            .expect(HttpStatus.OK);
        expect(updatedResponseBody).toEqual({});

        const { body: deletedResponse } = await request(app.getHttpServer()).delete('/base/1').expect(HttpStatus.OK);
        expect(deletedResponse).toEqual({});

        const { body: recoveredResponse } = await request(app.getHttpServer()).post('/base/1/recover').expect(HttpStatus.CREATED);
        expect(recoveredResponse).toEqual({});
    });
});
