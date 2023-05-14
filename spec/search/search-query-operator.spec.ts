/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable no-useless-escape */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';

import { TestEntity, TestModule, TestService } from './module';
import { RequestSearchDto } from '../../src/lib/dto/request-search.dto';
import { TestHelper } from '../test.helper';

describe('Search Query Operator', () => {
    let app: INestApplication;
    let service: TestService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmMysqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<TestService>(TestService);

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
         */
        await Promise.all(
            _.range(5).map((no: number) =>
                service.repository.save(
                    service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no, col3: 10 - no }),
                ),
            ),
        );
        await Promise.all(
            _.range(5, 10).map((no: number) =>
                service.repository.save(service.repository.create({ col1: `col${no % 2 === 0 ? '0' : '1'}_${no}`, col2: no })),
            ),
        );

        await app.init();
    });

    afterEach(async () => {
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
            const { data, metadata } = await service.reservedSearch({ requestSearchDto });
            expect(data).toHaveLength(5);
            expect(Object.keys(data[0])).toEqual(expect.arrayContaining(requestSearchDto.select as unknown[]));

            expect(metadata.nextCursor).toBeDefined();
            expect(metadata.query).toBeDefined();

            expect(await service.getTotalCountByCrudSearchRequest({ requestSearchDto })).toEqual(10);
        }
    });

    it('should query condition with RequestSearchDto when `where` is provided', async () => {
        const fixtures: Array<[RequestSearchDto<TestEntity>, number[]]> = [
            [{ where: [{ col2: { operator: '=', operand: 5 } }] }, [5]],
            [{ where: [{ col2: { operator: '=', operand: 5, not: true } }] }, [0, 1, 2, 3, 4, 6, 7, 8, 9]],

            [{ where: [{ col2: { operator: '!=', operand: 5 } }] }, [1, 2, 3, 4, 0, 6, 7, 8, 9]],
            [{ where: [{ col2: { operator: '!=', operand: 5, not: true } }] }, [5]],

            [{ where: [{ col2: { operator: '>', operand: 5 } }] }, [6, 7, 8, 9]],
            [{ where: [{ col2: { operator: '>', operand: 5, not: true } }] }, [0, 1, 2, 3, 4, 5]],

            [{ where: [{ col2: { operator: '>=', operand: 5 } }] }, [5, 6, 7, 8, 9]],
            [{ where: [{ col2: { operator: '>=', operand: 5, not: true } }] }, [0, 1, 2, 3, 4]],

            [{ where: [{ col2: { operator: '<', operand: 5 } }] }, [0, 1, 2, 3, 4]],
            [{ where: [{ col2: { operator: '<', operand: 5, not: true } }] }, [5, 6, 7, 8, 9]],

            [{ where: [{ col2: { operator: '<=', operand: 5 } }] }, [0, 1, 2, 3, 4, 5]],
            [{ where: [{ col2: { operator: '<=', operand: 5, not: true } }] }, [6, 7, 8, 9]],

            [{ where: [{ col1: { operator: 'LIKE', operand: 'col0_%' } }] }, [0, 2, 4, 6, 8]],
            [{ where: [{ col1: { operator: 'LIKE', operand: 'col0_%', not: true } }] }, [1, 3, 5, 7, 9]],

            [{ where: [{ col1: { operator: 'ILIKE', operand: 'COL1_%' } }] }, [1, 3, 5, 7, 9]],
            [{ where: [{ col1: { operator: 'ILIKE', operand: 'COL1_%', not: true } }] }, [0, 2, 4, 6, 8]],

            [{ where: [{ col2: { operator: 'BETWEEN', operand: [5, 7] } }] }, [5, 6, 7]],
            [{ where: [{ col2: { operator: 'BETWEEN', operand: [5, 7], not: true } }] }, [0, 1, 2, 3, 4, 8, 9]],

            [{ where: [{ col2: { operator: 'IN', operand: [5, 7, 9] } }] }, [5, 7, 9]],
            [{ where: [{ col2: { operator: 'IN', operand: [5, 7, 9], not: true } }] }, [0, 1, 2, 3, 4, 6, 8]],

            [{ where: [{ col3: { operator: 'NULL' } }] }, [5, 6, 7, 8, 9]],
            [{ where: [{ col3: { operator: 'NULL', not: true } }] }, [0, 1, 2, 3, 4]],
        ];
        for (const [requestSearchDto, expected] of fixtures) {
            const { data, metadata } = await service.reservedSearch({ requestSearchDto });
            const col2Values = data.map((d) => d.col2);
            expect(col2Values).toHaveLength(expected.length);
            expect(col2Values).toEqual(expect.arrayContaining(expected));

            expect(metadata.nextCursor).toBeDefined();
            expect(metadata.query).toBeDefined();
        }
    });

    it('nested complex where condition test', async () => {
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
            const { data, metadata } = await service.reservedSearch({ requestSearchDto });
            const col2Values = data.map((d) => d.col2);
            expect(col2Values).toHaveLength(expected.length);
            expect(col2Values).toEqual(expect.arrayContaining(expected));

            expect(metadata.nextCursor).toBeDefined();
            expect(metadata.query).toBeDefined();
        }
    });
});
