import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import request from 'supertest';

import { TestEntity, TestModule, TestService } from './module';
import { PaginationHelper } from '../../src/lib/provider';
import { TestHelper } from '../test.helper';

describe('Search Cursor Pagination', () => {
    let app: INestApplication;
    let service: TestService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmMysqlModule([TestEntity])],
        }).compile();
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
            _.range(25).map((no: number) =>
                service.repository.save(
                    service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no, col3: 50 - no }),
                ),
            ),
        );
        await Promise.all(
            _.range(25, 50).map((no: number) =>
                service.repository.save(service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no })),
            ),
        );

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should fetch with nextCursor', async () => {
        const searchRequestBody = { where: [{ col2: { operator: '<', operand: 40 } }], order: { col1: 'DESC' }, take: 10 };

        const firstResponse = await request(app.getHttpServer()).post('/base/search').send(searchRequestBody);
        expect(firstResponse.statusCode).toEqual(HttpStatus.OK);
        expect(firstResponse.body.data).toHaveLength(10);

        const lastEntity = PaginationHelper.deserialize<TestEntity>(firstResponse.body.metadata.nextCursor);
        expect(lastEntity).toEqual({ col1: 'col1_29' });
        const preCondition = PaginationHelper.deserialize(firstResponse.body.metadata.query);
        expect(preCondition).toEqual({ ...searchRequestBody, withDeleted: false });

        const secondResponse = await request(app.getHttpServer())
            .post('/base/search')
            .send({ nextCursor: firstResponse.body.metadata.nextCursor, query: firstResponse.body.metadata.query });

        expect(secondResponse.statusCode).toEqual(HttpStatus.OK);
        expect(secondResponse.body.data).toHaveLength(10);
        const firstDataCol1: Set<string> = new Set(firstResponse.body.data.map((d: { col1: string }) => d.col1));

        for (const nextData of secondResponse.body.data) {
            expect(firstDataCol1.has(nextData.col1)).not.toBeTruthy();
        }

        const nextLastEntity = PaginationHelper.deserialize(secondResponse.body.metadata.nextCursor);
        expect(nextLastEntity).toEqual({ col1: 'col1_1' });
        const nextPreCondition = PaginationHelper.deserialize(secondResponse.body.metadata.query);
        expect(nextPreCondition).toEqual(
            _.merge(searchRequestBody, { where: [{ col1: { operand: lastEntity.col1, operator: '<' } }] }, { withDeleted: false }),
        );
    });
});
