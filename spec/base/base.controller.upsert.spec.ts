import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { BaseEntity } from './base.entity';
import { BaseModule } from './base.module';

describe('BaseController', () => {
    let app: INestApplication;

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

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('UPSERT', () => {
        it('should be provided /:id', async () => {
            const routerPathList = app.getHttpServer()._events.request._router.stack.reduce((list: Record<string, string[]>, r) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            }, {});
            expect(routerPathList.put).toEqual(expect.arrayContaining(['/base/:id']));
        });

        it('should update entity if exists', async () => {
            const oldName = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name: oldName });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;

            const newName = 'name2';
            await request(app.getHttpServer()).put(`/base/${id}`).send({ name: newName }).expect(HttpStatus.OK);

            const response = await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.OK);
            expect(response.body.name).toEqual(newName);
        });

        it('should create entity if not exists', async () => {
            const name = 'name1';
            const id = 1;

            await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.NOT_FOUND);
            await request(app.getHttpServer()).put(`/base/${id}`).send({ name }).expect(HttpStatus.OK);

            const response = await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.OK);
            expect(response.body.name).toEqual(name);
        });

        it('should be able to changed updatedAt', async () => {
            const oldName = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name: oldName });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;

            await new Promise((res) => setTimeout(res, 1000));
            await request(app.getHttpServer()).put(`/base/${id}`).send({ name: 'name2' }).expect(HttpStatus.OK);

            const readOne = await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.OK);

            expect(created.body.lastModifiedAt).not.toEqual(readOne.body.lastModifiedAt);
            expect(created.body.createdAt).toEqual(readOne.body.createdAt);
        });

        it('should update value of primary key', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;

            const newId = 2;
            await request(app.getHttpServer()).put(`/base/${id}`).send({ id: newId }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });

        it('should update value of unknown key', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;
            await request(app.getHttpServer()).put(`/base/${id}`).send({ position: 3 }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });

        it('should update value of mismatch type', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;
            await request(app.getHttpServer()).put(`/base/${id}`).send({ name: true }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });

        it('should be checked params type', async () => {
            await request(app.getHttpServer())
                .put(`/base/${Number('a')}`)
                .expect(HttpStatus.CONFLICT);
        });
    });
});
