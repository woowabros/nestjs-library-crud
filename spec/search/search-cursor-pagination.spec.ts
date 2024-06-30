import { HttpStatus, ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { TestEntity, TestModule, TestService } from './module';
import { PaginationHelper } from '../../src/lib/provider';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Search Cursor Pagination', () => {
    let app: INestApplication;
    let service: TestService;

    beforeAll(async () => {
        const logger = new ConsoleLogger();
        logger.setLogLevels(['error']);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmMysqlModule([TestEntity])],
        })
            .setLogger(logger)
            .compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<TestService>(TestService);

        /**
         * 50 entities are created for the test.
         *
         * col1
         * - An even number starts with col0.
         * - Odd numbers start with col1
         *
         * col2
         * - Same as the index number [0-49]
         * - main information for testing.
         *
         * col3
         * - when index is [0-24], it has [50-26]
         * - when index is [25-49], is has null
         */
        await service.repository.save(
            Array.from({ length: 25 }, (_, index) => index).map((no: number) =>
                service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no, col3: 50 - no }),
            ),
        );
        await service.repository.save(
            Array.from({ length: 25 }, (_, index) => index + 25).map((no: number) =>
                service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no }),
            ),
        );
        expect(await TestEntity.count()).toEqual(50);

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should fetch with nextCursor', async () => {
        const searchRequestBody = { where: [{ col2: { operator: '<', operand: 40 } }], order: { col1: 'DESC' }, take: 10 };

        const { body: firstResponse } = await request(app.getHttpServer())
            .post('/base/search')
            .send(searchRequestBody)
            .expect(HttpStatus.OK);
        expect(firstResponse.data).toHaveLength(10);

        const preCondition: Record<string, unknown> = PaginationHelper.deserialize(firstResponse.metadata.nextCursor);
        expect(preCondition).toEqual({
            where: expect.any(String),
            nextCursor: expect.any(String),
            total: expect.any(Number),
        });
        const lastEntity = PaginationHelper.deserialize<TestEntity>(preCondition.nextCursor as string);
        expect(lastEntity).toEqual({ col1: 'col1_29' });
        expect(PaginationHelper.deserialize(preCondition.where as string)).toEqual({
            where: [
                {
                    col2: { operator: '<', operand: 40 },
                },
            ],
            order: { col1: 'DESC' },
            take: 10,
        });

        const { body: secondResponse } = await request(app.getHttpServer())
            .post('/base/search')
            .send({ nextCursor: firstResponse.metadata.nextCursor })
            .expect(HttpStatus.OK);

        expect(secondResponse.data).toHaveLength(10);
        const firstDataCol1: Set<string> = new Set(firstResponse.data.map((d: { col1: string }) => d.col1));

        for (const nextData of secondResponse.data) {
            expect(firstDataCol1.has(nextData.col1)).not.toBeTruthy();
        }

        const nextPreCondition: Record<string, unknown> = PaginationHelper.deserialize(secondResponse.metadata.nextCursor);
        expect(nextPreCondition).toEqual({
            where: expect.any(String),
            nextCursor: expect.any(String),
            total: expect.any(Number),
        });
        const nextLastEntity = PaginationHelper.deserialize(nextPreCondition.nextCursor as string);
        expect(nextLastEntity).toEqual({ col1: 'col1_1' });
        expect(PaginationHelper.deserialize(nextPreCondition.where as string)).toEqual({
            ...searchRequestBody,
        });
    });

    it('should be less than limitOfTake', async () => {
        const { body } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                take: 200,
            })
            .expect(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(body.message).toEqual('take must be less than 100');
    });

    it('should be fetch the entities count set in numberOfTake', async () => {
        const {
            body: { data: defaultData },
        } = await request(app.getHttpServer()).post('/base/search').send({}).expect(HttpStatus.OK);
        expect(defaultData).toHaveLength(5);

        const {
            body: { data: customData },
        } = await request(app.getHttpServer()).post('/base/search').send({ take: 13 }).expect(HttpStatus.OK);
        expect(customData).toHaveLength(13);
    });

    it('should fetch with nextCursor', async () => {
        const searchRequestBody = { where: [{ col2: { operator: '<', operand: 40 } }], order: { col1: 'DESC' }, take: 10 };

        const { body: firstResponse } = await request(app.getHttpServer())
            .post('/base/search')
            .send(searchRequestBody)
            .expect(HttpStatus.OK);
        expect(firstResponse.data).toHaveLength(10);

        const preCondition: Record<string, unknown> = PaginationHelper.deserialize(firstResponse.metadata.nextCursor);
        expect(preCondition).toEqual({
            where: expect.any(String),
            nextCursor: expect.any(String),
            total: expect.any(Number),
        });
        const lastEntity = PaginationHelper.deserialize<TestEntity>(preCondition.nextCursor as string);
        expect(lastEntity).toEqual({ col1: 'col1_29' });
        expect(PaginationHelper.deserialize(preCondition.where as string)).toEqual({
            where: [
                {
                    col2: { operator: '<', operand: 40 },
                },
            ],
            order: { col1: 'DESC' },
            take: 10,
        });

        const { body: secondResponse } = await request(app.getHttpServer())
            .post('/base/search')
            .send({ nextCursor: firstResponse.metadata.nextCursor })
            .expect(HttpStatus.OK);

        expect(secondResponse.data).toHaveLength(10);
        const firstDataCol1: Set<string> = new Set(firstResponse.data.map((d: { col1: string }) => d.col1));

        for (const nextData of secondResponse.data) {
            expect(firstDataCol1.has(nextData.col1)).not.toBeTruthy();
        }

        const nextPreCondition: Record<string, unknown> = PaginationHelper.deserialize(secondResponse.metadata.nextCursor);
        expect(nextPreCondition).toEqual({
            where: expect.any(String),
            nextCursor: expect.any(String),
            total: expect.any(Number),
        });
        const nextLastEntity = PaginationHelper.deserialize(nextPreCondition.nextCursor as string);
        expect(nextLastEntity).toEqual({ col1: 'col1_1' });
        expect(PaginationHelper.deserialize(nextPreCondition.where as string)).toEqual({
            ...searchRequestBody,
        });
    });

    it('should be guaranteed  keySet, If the primary key is used as a conditional', async () => {
        const { body } = await request(app.getHttpServer())
            .post('/base/search')
            .send({ where: [{ col1: { operator: 'LIKE', operand: 'col1%' } }], order: { col1: 'ASC' } })
            .expect(HttpStatus.OK);

        expect(body).toEqual({
            data: [
                { col1: 'col1_1', col2: 1, col3: 49, col4: null },
                { col1: 'col1_11', col2: 11, col3: 39, col4: null },
                { col1: 'col1_13', col2: 13, col3: 37, col4: null },
                { col1: 'col1_15', col2: 15, col3: 35, col4: null },
                { col1: 'col1_17', col2: 17, col3: 33, col4: null },
            ],
            metadata: {
                limit: 5,
                total: 25,
                nextCursor: expect.any(String),
            },
        });

        const { body: nextBody } = await request(app.getHttpServer())
            .post('/base/search')
            .send({ nextCursor: body.metadata.nextCursor })
            .expect(HttpStatus.OK);
        expect(nextBody).toEqual({
            data: [
                { col1: 'col1_19', col2: 19, col3: 31, col4: null },
                { col1: 'col1_21', col2: 21, col3: 29, col4: null },
                { col1: 'col1_23', col2: 23, col3: 27, col4: null },
                { col1: 'col1_25', col2: 25, col3: null, col4: null },
                { col1: 'col1_27', col2: 27, col3: null, col4: null },
            ],
            metadata: {
                limit: 5,
                total: 25,
                nextCursor: expect.any(String),
            },
        });

        const { body: searchInBody } = await request(app.getHttpServer())
            .post('/base/search')
            .send({ where: [{ col1: { operator: 'IN', operand: ['col1_19', 'col1_21', 'col1_23', 'col1_25', 'col1_27'] } }], take: 2 })
            .expect(HttpStatus.OK);
        expect(searchInBody.data).toEqual([
            { col1: 'col1_27', col2: 27, col3: null, col4: null },
            { col1: 'col1_25', col2: 25, col3: null, col4: null },
        ]);
        const { body: nextInBody } = await request(app.getHttpServer())
            .post('/base/search')
            .send({ nextCursor: searchInBody.metadata.nextCursor })
            .expect(HttpStatus.OK);
        expect(nextInBody.data).toEqual([
            { col1: 'col1_23', col2: 23, col3: 27, col4: null },
            { col1: 'col1_21', col2: 21, col3: 29, col4: null },
        ]);
    });

    it('should be use empty body', async () => {
        const { body } = await request(app.getHttpServer()).post('/base/search').send({}).expect(HttpStatus.OK);
        expect(body.data).toBeDefined();
        expect(body.metadata).toBeDefined();

        const { body: emptyWhere } = await request(app.getHttpServer()).post('/base/search').send({ where: [] }).expect(HttpStatus.OK);
        expect(emptyWhere.data).toBeDefined();
        expect(emptyWhere.metadata).toBeDefined();
    });
});
