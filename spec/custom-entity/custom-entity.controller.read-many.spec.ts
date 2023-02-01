import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import _ from 'lodash';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';

describe('CustomEntity - ReadMany', () => {
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
        await Promise.all(
            _.range(100).map((number) =>
                service.getRepository.save(service.getRepository.create({ uuid: `${number}`, name: `name-${number}` })),
            ),
        );

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should be provided /', async () => {
        const routerPathList = app.getHttpServer()._events.request._router.stack.reduce((list: Record<string, string[]>, r) => {
            if (r.route?.path) {
                for (const method of Object.keys(r.route.methods)) {
                    list[method] = list[method] ?? [];
                    list[method].push(r.route.path);
                }
            }
            return list;
        }, {});
        expect(routerPathList.get).toEqual(expect.arrayContaining(['/base']));
    });

    describe('READ_MANY', () => {
        describe('Default Pagination - Cursor Pagination ', () => {
            const defaultLimit = 20;

            it('should return 20 entities as default', async () => {
                const response = await request(app.getHttpServer()).get('/base');

                expect(response.statusCode).toEqual(HttpStatus.OK);
                expect(response.body.data).toHaveLength(defaultLimit);
                expect(response.body.metadata.nextCursor).toBeDefined();
                expect(response.body.metadata.limit).toEqual(defaultLimit);

                expect(response.body.data[0].uuid).toBeDefined();
                expect(response.body.data[0].name).toBeDefined();
                expect(response.body.data[0].lastModifiedAt).toBeUndefined();
            });

            it('should return next 20 entities after cursor', async () => {
                const firstResponse = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
                const nextResponse = await request(app.getHttpServer()).get('/base').query({
                    nextCursor: firstResponse.body.metadata.nextCursor,
                });

                expect(nextResponse.statusCode).toEqual(HttpStatus.OK);
                expect(nextResponse.body.data).toHaveLength(defaultLimit);
                expect(nextResponse.body.metadata.nextCursor).toBeDefined();
                expect(nextResponse.body.metadata.limit).toEqual(defaultLimit);

                expect(firstResponse.body.metadata.nextCursor).not.toEqual(nextResponse.body.metadata.nextCursor);

                const lastOneOfFirstResponse = firstResponse.body.data.pop();
                const firstOneOfNextResponse = nextResponse.body.data.shift();
                expect(lastOneOfFirstResponse.uuid).not.toEqual(firstOneOfNextResponse.uuid);
                expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);
            });
        });
    });
});
