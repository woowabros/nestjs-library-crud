import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { TestEntity, TestModule, TestService } from './module';
import { TestHelper } from '../test.helper';

import type { RequestSearchDto } from '../../src/lib/dto/request-search.dto';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Search Query Operator', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmMysqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        const service: TestService = moduleFixture.get<TestService>(TestService);

        /**
         * 10 entities are created for the test.
         *
         * col1
         * - An even number starts with col0.
         * - Odd numbers start with col1
         *
         * col2
         * - Same as the index number [0-9]
         * - main information for testing.
         *
         * col3
         * - when index is [0-4], it has [10-6]
         * - when index is [5-9], is has null
         *
         * col4
         * - when index is [0-9], it has [2000-01-01 ~ 2000-10-01]
         */
        await service.repository.save(
            Array.from({ length: 5 }, (_, index) => index).map((no: number) =>
                service.repository.create({
                    col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`,
                    col2: no,
                    col3: 10 - no,
                    col4: new Date(2000, no, 1),
                }),
            ),
        );
        await service.repository.save(
            Array.from({ length: 5 }, (_, index) => index + 5).map((no: number) =>
                service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no, col4: new Date(2000, no, 1) }),
            ),
        );

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should build `select` clause with RequestSearchDto when `select` is provided', async () => {
        const requestSearchDtoList: Array<RequestSearchDto<TestEntity>> = [
            { select: ['col1'], withDeleted: false, take: 5 },
            { select: ['col1', 'col2'], withDeleted: false, take: 5 },
            { select: ['col1', 'col2', 'col3'], withDeleted: false, take: 5 },
        ];

        for (const requestSearchDto of requestSearchDtoList) {
            const {
                body: { data, metadata },
            } = await request(app.getHttpServer()).post('/base/search').send(requestSearchDto).expect(HttpStatus.OK);
            expect(data).toHaveLength(5);
            expect(Object.keys(data[0])).toEqual(expect.arrayContaining(requestSearchDto.select as unknown[]));

            expect(metadata.nextCursor).toBeDefined();
            expect(metadata.total).toEqual(10);
        }
    });

    it('should query condition with RequestSearchDto when `where` is provided', async () => {
        const take = 100;
        const fixtures: Array<[RequestSearchDto<TestEntity>, number[]]> = [
            [{ where: [{ col2: { operator: '=', operand: 5 } }] }, [5]],
            [{ where: [{ col2: { operator: '=', operand: 5, not: true } }] }, [0, 1, 2, 3, 4, 6, 7, 8, 9]],
            [{ where: [{ col4: { operator: '=', operand: '2000-06-01' } }] }, [5]],

            [{ where: [{ col2: { operator: '!=', operand: 5 } }] }, [1, 2, 3, 4, 0, 6, 7, 8, 9]],
            [{ where: [{ col2: { operator: '!=', operand: 5, not: true } }] }, [5]],
            [{ where: [{ col4: { operator: '!=', operand: '2000-06-01' } }] }, [1, 2, 3, 4, 0, 6, 7, 8, 9]],

            [{ where: [{ col2: { operator: '>', operand: 5 } }] }, [6, 7, 8, 9]],
            [{ where: [{ col2: { operator: '>', operand: 5, not: true } }] }, [0, 1, 2, 3, 4, 5]],
            [{ where: [{ col4: { operator: '>', operand: '2000-06-01' } }] }, [6, 7, 8, 9]],

            [{ where: [{ col2: { operator: '>=', operand: 5 } }] }, [5, 6, 7, 8, 9]],
            [{ where: [{ col2: { operator: '>=', operand: 5, not: true } }] }, [0, 1, 2, 3, 4]],
            [{ where: [{ col4: { operator: '>=', operand: '2000-06-01' } }] }, [5, 6, 7, 8, 9]],

            [{ where: [{ col2: { operator: '<', operand: 5 } }] }, [0, 1, 2, 3, 4]],
            [{ where: [{ col2: { operator: '<', operand: 5, not: true } }] }, [5, 6, 7, 8, 9]],
            [{ where: [{ col4: { operator: '<', operand: '2000-06-01' } }] }, [0, 1, 2, 3, 4]],

            [{ where: [{ col2: { operator: '<=', operand: 5 } }] }, [0, 1, 2, 3, 4, 5]],
            [{ where: [{ col2: { operator: '<=', operand: 5, not: true } }] }, [6, 7, 8, 9]],
            [{ where: [{ col4: { operator: '<=', operand: '2000-06-01' } }] }, [0, 1, 2, 3, 4, 5]],

            [{ where: [{ col1: { operator: 'LIKE', operand: 'col0_%' } }] }, [0, 2, 4, 6, 8]],
            [{ where: [{ col1: { operator: 'LIKE', operand: 'col0_%', not: true } }] }, [1, 3, 5, 7, 9]],

            [{ where: [{ col1: { operator: 'ILIKE', operand: 'COL1_%' } }] }, [1, 3, 5, 7, 9]],
            [{ where: [{ col1: { operator: 'ILIKE', operand: 'COL1_%', not: true } }] }, [0, 2, 4, 6, 8]],

            [{ where: [{ col2: { operator: 'BETWEEN', operand: [5, 7] } }] }, [5, 6, 7]],
            [{ where: [{ col2: { operator: 'BETWEEN', operand: [5, 7], not: true } }] }, [0, 1, 2, 3, 4, 8, 9]],
            [{ where: [{ col4: { operator: 'BETWEEN', operand: ['2000-03-01', '2000-05-02'] } }] }, [2, 3, 4]],

            [{ where: [{ col2: { operator: 'IN', operand: [5, 7, 9] } }] }, [5, 7, 9]],
            [{ where: [{ col2: { operator: 'IN', operand: [5, 7, 9], not: true } }] }, [0, 1, 2, 3, 4, 6, 8]],

            [{ where: [{ col3: { operator: 'NULL' } }] }, [5, 6, 7, 8, 9]],
            [{ where: [{ col3: { operator: 'NULL', not: true } }] }, [0, 1, 2, 3, 4]],
        ];
        for (const [requestSearchDto, expected] of fixtures) {
            const {
                body: { data, metadata },
            } = await request(app.getHttpServer())
                .post('/base/search')
                .send({ ...requestSearchDto, take })
                .expect(HttpStatus.OK);
            const col2Values = (data as TestEntity[]).map((d) => d.col2);
            expect(col2Values).toHaveLength(expected.length);
            expect(col2Values).toEqual(expect.arrayContaining(expected));

            expect(metadata.nextCursor).toBeDefined();
        }
    });

    it('nested complex where condition test', async () => {
        const take = 100;
        const fixtures: Array<[RequestSearchDto<TestEntity>, number[]]> = [
            [{ where: [{ col2: { operator: 'BETWEEN', operand: [3, 5] } }], order: { col1: 'ASC' } }, [3, 4, 5]],
            [
                {
                    where: [
                        { col1: { operator: '=', operand: 'col1_1' }, col2: { operator: '<', operand: 5 } },
                        { col1: { operator: '=', operand: 'col1_2' }, col2: { operator: '>', operand: 10 } },
                    ],
                },
                [1],
            ],
            [
                {
                    where: [
                        { col1: { operator: '!=', operand: 'test' }, col2: { operator: '>=', operand: 3 } },
                        { col1: { operator: 'ILIKE', operand: 'col1_2' }, col2: { operator: '<=', operand: 11 } },
                    ],
                },
                [3, 4, 5, 6, 7, 8, 9],
            ],
            [
                {
                    where: [
                        { col3: { operator: 'NULL' }, col2: { operator: 'BETWEEN', operand: [4, 6] } },
                        { col1: { operator: 'LIKE', operand: 'col1_%' }, col2: { operator: 'IN', operand: [2, 3, 10, 15, 20] } },
                    ],
                },
                [3, 5, 6],
            ],
            [{ where: [{ col3: { operator: 'NULL' }, col2: { operator: 'IN', operand: [1, 3, 5] } }] }, [5]],
            [
                {
                    where: [{ col3: { operator: 'NULL', not: true }, col2: { operator: 'IN', operand: [1, 3, 5] } }],
                },
                [1, 3],
            ],
            [
                {
                    where: [{ col2: { operator: 'BETWEEN', operand: [4, 6], not: true }, col3: { operator: 'BETWEEN', operand: [3, 9] } }],
                },
                [1, 2, 3],
            ],
        ];
        for (const [requestSearchDto, expected] of fixtures) {
            const {
                body: { data, metadata },
            } = await request(app.getHttpServer())
                .post('/base/search')
                .send({ ...requestSearchDto, take })
                .expect(HttpStatus.OK);
            const col2Values = (data as TestEntity[]).map((d) => d.col2);
            expect(col2Values).toHaveLength(expected.length);
            expect(col2Values).toEqual(expect.arrayContaining(expected));

            expect(metadata.nextCursor).toBeDefined();
        }
    });

    it('should be able to return error when operand is invalid for operator BETWEEN', async () => {
        const requestSearchDto: RequestSearchDto<TestEntity> = { where: [{ col2: { operator: 'BETWEEN', operand: [5, undefined] } }] };
        await request(app.getHttpServer()).post('/base/search').send(requestSearchDto).expect(HttpStatus.UNPROCESSABLE_ENTITY);
    });
});
