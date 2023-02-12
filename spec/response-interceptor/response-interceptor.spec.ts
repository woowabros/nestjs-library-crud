import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { BaseModule } from './response-interceptor.module';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

describe('Response Interceptor', () => {
    let app: INestApplication;
    let service: BaseService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                BaseModule,
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [BaseEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<BaseService>(BaseService);
        await Promise.all(['name1', 'name2'].map((name: string) => service.getRepository.save(service.getRepository.create({ name }))));

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should be able to modify response body', async () => {
        await request(app.getHttpServer())
            .get('/base/1')
            .then(({ statusCode, body }) => {
                expect(statusCode).toEqual(HttpStatus.OK);
                expect(body).toEqual({
                    id: 1,
                    name: expect.any(String),
                    createdAt: expect.any(Number),
                    custom: expect.any(Number),
                    type: null,
                    description: null,
                });
            });

        await request(app.getHttpServer())
            .get('/base/2')
            .then(({ statusCode, body }) => {
                expect(statusCode).toEqual(HttpStatus.OK);
                expect(body).toEqual({
                    id: expect.any(Number),
                    name: expect.any(String),
                    deletedAt: null,
                    createdAt: expect.any(String),
                    lastModifiedAt: expect.any(String),
                    type: null,
                    description: null,
                });
            });
    });

    it('should be able to use custom interceptor on all routes', async () => {
        const name = 'newName';
        const { body: readManyResponseBeforeCreate } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyResponseBeforeCreate.data).toHaveLength(2);

        const { body: createdResponse } = await request(app.getHttpServer()).post('/base').send({ name }).expect(HttpStatus.CREATED);
        expect(createdResponse).toEqual({
            id: expect.any(Number),
            name,
            createdAt: expect.any(Number),
            custom: expect.any(Number),
            description: null,
            type: null,
        });

        const { body: updatedResponse } = await request(app.getHttpServer())
            .patch(`/base/${createdResponse.id}`)
            .send({ name: 'update' })
            .expect(HttpStatus.OK);
        expect(updatedResponse.body).toBeUndefined();

        const { body: deletedResponse } = await request(app.getHttpServer()).delete(`/base/${createdResponse.id}`).expect(HttpStatus.OK);
        expect(deletedResponse.body).toBeUndefined();

        await request(app.getHttpServer()).get(`/base/${createdResponse.id}`).expect(HttpStatus.NOT_FOUND);

        const { body: upsertResponse } = await request(app.getHttpServer())
            .put(`/base/${createdResponse.id}`)
            .send({ name })
            .expect(HttpStatus.CONFLICT);
        expect(upsertResponse.message).toEqual('it has been deleted');

        await request(app.getHttpServer()).get(`/base/${createdResponse.id}`).expect(HttpStatus.NOT_FOUND);

        const { body: readManyResponseBeforeRecover } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyResponseBeforeRecover.data).toHaveLength(2);

        const { body: recoverResponse } = await request(app.getHttpServer())
            .post(`/base/${createdResponse.id}/recover`)
            .expect(HttpStatus.CREATED);
        expect(recoverResponse).toEqual({
            id: createdResponse.id,
            createdAt: createdResponse.createdAt,
            name: 'update',
            custom: expect.any(Number),
            type: null,
            description: null,
        });
        await request(app.getHttpServer()).get(`/base/${createdResponse.id}`).expect(HttpStatus.OK);

        const { body: readManyResponseAfterRecover } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyResponseAfterRecover.data).toHaveLength(3);
    });
});
