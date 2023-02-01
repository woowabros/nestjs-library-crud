import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyModule } from './multiple-primary-key.module';

describe('MultiplePrimaryKey - Upsert', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                MultiplePrimaryKeyModule,
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [MultiplePrimaryKeyEntity],
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
        it('should be provided /:uuid1/:uuid2', async () => {
            const routerPathList = app.getHttpServer()._events.request._router.stack.reduce((list: Record<string, string[]>, r) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            }, {});
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
