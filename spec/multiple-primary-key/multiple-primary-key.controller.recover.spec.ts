import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyModule } from './multiple-primary-key.module';
import { MultiplePrimaryKeyService } from './multiple-primary-key.service';

describe('MultiplePrimaryKey - Recover', () => {
    let app: INestApplication;
    let service: MultiplePrimaryKeyService;
    let entities: MultiplePrimaryKeyEntity[];

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

        service = moduleFixture.get<MultiplePrimaryKeyService>(MultiplePrimaryKeyService);
        entities = await Promise.all(
            ['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))),
        );

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('RECOVER', () => {
        it('should be provided /:uuid1/:uuid2/recover', async () => {
            const routerPathList = app.getHttpServer()._events.request._router.stack.reduce((list: Record<string, string[]>, r) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            }, {});
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/:uuid1/:uuid2/recover']));
        });

        it('recover the entity after delete', async () => {
            const { uuid1, uuid2 } = entities[0];
            await request(app.getHttpServer()).get(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.OK);

            // Delete
            await request(app.getHttpServer()).delete(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.OK);

            // getOne -> NotFOUND
            await request(app.getHttpServer()).get(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.NOT_FOUND);

            // getMany -> id가 없다.
            const { body } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
            expect(body.data.some((entity: MultiplePrimaryKeyEntity) => entity.uuid1 === uuid1 && entity.uuid2 === uuid2)).toBeFalsy();

            // Recover
            await request(app.getHttpServer()).post(`/base/${uuid1}/${uuid2}/recover`).expect(HttpStatus.CREATED);

            // GetOne -> OK
            await request(app.getHttpServer()).get(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.OK);
        });
    });
});
