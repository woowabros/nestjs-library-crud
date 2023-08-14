import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';
import { TestHelper } from '../test.helper';

describe('CustomEntity - ReadMany', () => {
    let app: INestApplication;
    let service: CustomEntityService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [CustomEntityModule, TestHelper.getTypeOrmMysqlModule([CustomEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<CustomEntityService>(CustomEntityService);
        await Promise.all(
            Array.from({ length: 100 }, (_, index) => index).map((number) =>
                service.repository.save(service.repository.create({ uuid: `${number}`, name: `name-${number}` })),
            ),
        );

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be provided /', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
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
