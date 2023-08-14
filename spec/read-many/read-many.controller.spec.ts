import { ConsoleLogger, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { ReadManyModule } from './read-many.module';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

describe('ReadMany - Options', () => {
    let app: INestApplication;
    let service: BaseService;
    const defaultLimit = 20;

    beforeAll(async () => {
        const logger = new ConsoleLogger();
        logger.setLogLevels(['error']);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ReadManyModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        })
            .setLogger(logger)
            .compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<BaseService>(BaseService);
        await Promise.all(
            Array.from({ length: 100 }, (_, index) => index).map((number) =>
                service.repository.save(service.repository.create({ name: `name-${number}` })),
            ),
        );

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('Sort ASC', () => {
        it('should sort entities in ascending order by pagination key', async () => {
            const response = await request(app.getHttpServer()).get('/sort-asc');
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(defaultLimit);

            (response.body.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeGreaterThan(pre.id);
                return value;
            });
        });

        it('should return next 20 entities after cursor in ascending order', async () => {
            const firstResponse = await request(app.getHttpServer()).get('/sort-asc').expect(HttpStatus.OK);
            const nextResponse = await request(app.getHttpServer()).get('/sort-asc').query({
                query: firstResponse.body.metadata.query,
            });

            expect(nextResponse.statusCode).toEqual(HttpStatus.OK);
            expect(nextResponse.body.data).toHaveLength(defaultLimit);
            expect(nextResponse.body.metadata.nextCursor).toBeDefined();
            expect(nextResponse.body.metadata.limit).toEqual(defaultLimit);

            expect(firstResponse.body.metadata.nextCursor).not.toEqual(nextResponse.body.metadata.nextCursor);

            const lastOneOfFirstResponse = firstResponse.body.data.pop();
            const firstOneOfNextResponse = nextResponse.body.data.shift();
            expect(lastOneOfFirstResponse.id + 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);

            (nextResponse.body.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeGreaterThan(pre.id);
                return value;
            });
        });
    });

    describe('Sort DESC', () => {
        it('should sort entities in descending order by pagination key', async () => {
            const response = await request(app.getHttpServer()).get('/sort-desc');
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(defaultLimit);

            (response.body.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeLessThan(pre.id);
                return value;
            });
        });

        it('should return next 20 entities after cursor in descending order', async () => {
            const { body: firstResponse } = await request(app.getHttpServer()).get('/sort-desc').expect(HttpStatus.OK);
            const { body: nextResponse } = await request(app.getHttpServer())
                .get('/sort-desc')
                .query({
                    query: firstResponse.metadata.query,
                })
                .expect(HttpStatus.OK);
            const { body: secondNextResponse } = await request(app.getHttpServer())
                .get('/sort-desc')
                .query({
                    query: nextResponse.metadata.query,
                })
                .expect(HttpStatus.OK);

            expect(nextResponse.metadata.query).toEqual(expect.any(String));
            expect(nextResponse.metadata.query).not.toEqual(firstResponse.metadata.query);
            expect(secondNextResponse.metadata.query).toEqual(expect.any(String));
            expect(secondNextResponse.metadata.query).not.toEqual(firstResponse.metadata.query);

            expect(nextResponse.metadata.nextCursor).not.toEqual(firstResponse.metadata.nextCursor);
            expect(secondNextResponse.metadata.nextCursor).not.toEqual(nextResponse.metadata.nextCursor);

            expect(nextResponse.metadata.total).toEqual(firstResponse.metadata.total - nextResponse.metadata.limit);
            expect(secondNextResponse.metadata.total).toEqual(nextResponse.metadata.total - secondNextResponse.metadata.limit);

            expect(nextResponse.data).toHaveLength(defaultLimit);
            expect(nextResponse.metadata.nextCursor).toBeDefined();
            expect(nextResponse.metadata.limit).toEqual(defaultLimit);

            expect(firstResponse.metadata.nextCursor).not.toEqual(nextResponse.metadata.nextCursor);

            const lastOneOfFirstResponse = firstResponse.data.pop();
            const firstOneOfNextResponse = nextResponse.data.shift();
            expect(lastOneOfFirstResponse.id - 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);

            (nextResponse.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeLessThan(pre.id);
                return value;
            });
        });
    });

    describe('numberOfTake', () => {
        const expectedNumberOfTake = 10;
        it(`should return ${expectedNumberOfTake} entities`, async () => {
            const response = await request(app.getHttpServer()).get('/take');
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(expectedNumberOfTake);
        });
    });
});
