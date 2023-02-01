import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';

describe('CustomEntity - Delete', () => {
    let app: INestApplication;
    let service: CustomEntityService;
    let entities: CustomEntity[];

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                CustomEntityModule,
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [CustomEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<CustomEntityService>(CustomEntityService);
        entities = await Promise.all(
            ['name1', 'name2'].map((name: string) => service.getRepository.save(service.getRepository.create({ name }))),
        );

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('RECOVER', () => {
        it('should be provided /:uuid/recover', async () => {
            const routerPathList = app.getHttpServer()._events.request._router.stack.reduce((list: Record<string, string[]>, r) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            }, {});
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/:uuid/recover']));
        });

        it('recover the entity after delete', async () => {
            const uuid = entities[0].uuid;
            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);

            // Delete
            await request(app.getHttpServer()).delete(`/base/${uuid}`).expect(HttpStatus.OK);

            // getOne -> NotFOUND
            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.NOT_FOUND);

            // getMany -> id가 없다.
            const { body } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
            expect(body.data.some((entity) => entity.uuid === uuid)).toBeFalsy();

            // Recover
            await request(app.getHttpServer()).post(`/base/${uuid}/recover`).expect(HttpStatus.CREATED);

            // GetOne -> OK
            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);
        });
    });
});
