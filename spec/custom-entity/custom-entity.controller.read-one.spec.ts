import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';

describe('CustomEntity - ReadOne', () => {
    let app: INestApplication;
    let service: CustomEntityService;

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
        await Promise.all(['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))));

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('READ_ONE', () => {
        let id: string;
        beforeEach(async () => {
            id = (await service.getAll())?.[0]?.uuid;
        });

        it('should be provided /:uuid', async () => {
            const routerPathList = app.getHttpServer()._events.request._router.stack.reduce((list: Record<string, string[]>, r) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            }, {});
            expect(routerPathList.get).toEqual(expect.arrayContaining(['/base/:uuid']));
        });

        it('should be returned only one entity', async () => {
            const response = await request(app.getHttpServer())
                .get(`/base/${id}`)
                .query({ fields: ['uuid', 'name'] });

            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.uuid).toEqual(id);
            expect(response.body.name).toEqual(expect.any(String));
            expect(response.body.lastModifiedAt).toBeUndefined();
        });

        it('should be use only column names in field options', async () => {
            await request(app.getHttpServer())
                .get(`/base/${id}`)
                .query({ fields: ['uuid', 'name'] })
                .expect(HttpStatus.OK);

            await request(app.getHttpServer())
                .get(`/base/${id}`)
                .query({ fields: ['id', 'name', 'createdAt', true] })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);

            await request(app.getHttpServer())
                .get(`/base/${id}`)
                .query({ fields: ['uuid', 'name', 'test'] })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });
    });
});
