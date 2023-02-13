import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { RequestInterceptorModule } from './request-interceptor.module';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

describe('Request Interceptor', () => {
    let app: INestApplication;
    let service: BaseService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RequestInterceptorModule,
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
        await Promise.all(['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))));

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should be able to constrained fields', async () => {
        await request(app.getHttpServer())
            .get('/base/1')
            .then(({ statusCode, body }) => {
                expect(statusCode).toEqual(HttpStatus.OK);
                expect(body).toEqual({
                    name: expect.any(String),
                    createdAt: expect.any(String),
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
                });
            });
    });

    it('should be reflect soft-delete option', async () => {
        await request(app.getHttpServer()).post('/base').send({ name: 'added1' }).expect(HttpStatus.CREATED);
        await request(app.getHttpServer()).post('/base').send({ name: 'added2' }).expect(HttpStatus.CREATED);
        await request(app.getHttpServer()).post('/base').send({ name: 'added3' }).expect(HttpStatus.CREATED);

        const {
            body: { data: readManyResponseBodyBeforeDelete },
        } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyResponseBodyBeforeDelete).toHaveLength(5);

        await Promise.all(
            readManyResponseBodyBeforeDelete.map(({ id }) => request(app.getHttpServer()).delete(`/base/${id}`).expect(HttpStatus.OK)),
        );

        const {
            body: { data: readManyResponseBodyAfterDelete },
        } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyResponseBodyAfterDelete).toHaveLength(3);
        expect(readManyResponseBodyAfterDelete.some(({ id }) => id < 3)).not.toBeTruthy();

        for (const { id } of readManyResponseBodyAfterDelete) {
            const httpStatus = id % 2 === 0 ? HttpStatus.OK : HttpStatus.NOT_FOUND;
            await request(app.getHttpServer()).get(`/base/${id}`).expect(httpStatus);
        }
    });
});
