import { INestApplication, HttpStatus, ConsoleLogger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { TestEntity, TestModule, TestService } from './module';
import { PaginationHelper } from '../../src/lib/provider';
import { TestHelper } from '../test.helper';

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
        await Promise.all(
            Array.from({ length: 25 }, (_, index) => index).map((no: number) =>
                service.repository.save(
                    service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no, col3: 50 - no }),
                ),
            ),
        );
        await Promise.all(
            Array.from({ length: 25 }, (_, index) => index + 25).map((no: number) =>
                service.repository.save(service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no })),
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

        const lastEntity = PaginationHelper.deserialize<TestEntity>(firstResponse.metadata.nextCursor);
        expect(lastEntity).toEqual({ col1: 'col1_29' });
        const preCondition: Record<string, unknown> = PaginationHelper.deserialize(firstResponse.metadata.query);
        expect(preCondition).toEqual({
            where: expect.any(String),
            nextCursor: expect.any(String),
            total: expect.any(Number),
        });
        expect(PaginationHelper.deserialize(preCondition.where as string)).toEqual({
            where: [
                {
                    col2: { operator: '<', operand: 40 },
                },
            ],
            order: { col1: 'DESC' },
            take: 10,
            withDeleted: false,
        });

        const { body: secondResponse } = await request(app.getHttpServer())
            .post('/base/search')
            .send({ nextCursor: firstResponse.metadata.nextCursor, query: firstResponse.metadata.query })
            .expect(HttpStatus.OK);

        expect(secondResponse.data).toHaveLength(10);
        const firstDataCol1: Set<string> = new Set(firstResponse.data.map((d: { col1: string }) => d.col1));

        for (const nextData of secondResponse.data) {
            expect(firstDataCol1.has(nextData.col1)).not.toBeTruthy();
        }

        const nextLastEntity = PaginationHelper.deserialize(secondResponse.metadata.nextCursor);
        expect(nextLastEntity).toEqual({ col1: 'col1_1' });

        const nextPreCondition: Record<string, unknown> = PaginationHelper.deserialize(secondResponse.metadata.query);
        expect(nextPreCondition).toEqual({
            where: expect.any(String),
            nextCursor: expect.any(String),
            total: expect.any(Number),
        });
        expect(PaginationHelper.deserialize(nextPreCondition.where as string)).toEqual({
            ...searchRequestBody,
            withDeleted: false,
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
});
