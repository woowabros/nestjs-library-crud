/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable no-useless-escape */
import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TestService, TestModule, TestEntity } from './module';
import { RequestSearchDto } from '../../src/lib/dto/request-search.dto';
import { Sort } from '../../src/lib/interface';

describe('buildSearchQuery', () => {
    let app: INestApplication;
    let service: TestService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TestModule,
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [TestEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<TestService>(TestService);

        await app.init();
    });

    it('should build `select` clause with RequestSearchDto when `select` is provided', () => {
        const fixtures: Array<{ dto: RequestSearchDto<TestEntity>; expected: string }> = [
            {
                dto: { select: ['col1'] },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\" FROM \"TestEntity\" \"TestEntity\"`,
            },
            {
                dto: { select: ['col1', 'col2'] },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\" FROM \"TestEntity\" \"TestEntity\"`,
            },
            {
                dto: { select: ['col1', 'col2', 'col3'] },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\"`,
            },
        ];

        for (const { dto, expected } of fixtures) {
            const query = service.getQueryBuilderFromSearchDto({ requestSearchDto: dto }).getQuery();
            expect(query).toEqual(expected);
        }
    });

    it('should build `where` clause with RequestSearchDto when `where.$and` is provided', () => {
        const fixtures: Array<{ dto: RequestSearchDto<TestEntity>; expected: string }> = [
            {
                dto: {
                    where: {
                        $and: [{ col1: { operator: '=', operand: 'hello' }, col2: { operator: '<', operand: 5 } }],
                    },
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" = :orm_param_0 AND \"TestEntity\".\"col2\" < :orm_param_1)`,
            },
            {
                dto: {
                    where: {
                        $and: [
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '<', operand: 5 } },
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '>', operand: 10 } },
                        ],
                    },
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" = :orm_param_0 AND \"TestEntity\".\"col2\" < :orm_param_1) AND (\"TestEntity\".\"col1\" = :orm_param_2 AND \"TestEntity\".\"col2\" > :orm_param_3)`,
            },
            {
                dto: {
                    where: {
                        $and: [
                            { col1: { operator: '!=', operand: 'test' }, col2: { operator: '>=', operand: 3 } },
                            { col1: { operator: 'ILIKE', operand: 'hello' }, col2: { operator: '<=', operand: 11 } },
                        ],
                    },
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" != :orm_param_0 AND \"TestEntity\".\"col2\" >= :orm_param_1) AND (UPPER(\"TestEntity\".\"col1\") LIKE UPPER(:orm_param_2) AND \"TestEntity\".\"col2\" <= :orm_param_3)`,
            },
            {
                dto: {
                    where: {
                        $and: [
                            { col1: { operator: 'NULL' }, col2: { operator: 'BETWEEN', operand: [5, 10] } },
                            { col1: { operator: 'LIKE', operand: 'hello' }, col2: { operator: 'IN', operand: [10, 15, 20] } },
                        ],
                    },
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" IS NULL AND \"TestEntity\".\"col2\" BETWEEN :orm_param_0 AND :orm_param_1) AND (\"TestEntity\".\"col1\" LIKE :orm_param_2 AND \"TestEntity\".\"col2\" IN (:orm_param_3, :orm_param_4, :orm_param_5))`,
            },
        ];

        for (const { dto, expected } of fixtures) {
            const query = service.getQueryBuilderFromSearchDto({ requestSearchDto: dto }).getQuery();
            expect(query).toEqual(expected);
        }
    });

    it('should build `where` clause with RequestSearchDto when `where.$or` is provided', () => {
        const fixtures: Array<{ dto: RequestSearchDto<TestEntity>; expected: string }> = [
            {
                dto: { where: { $or: [{ col1: { operator: '=', operand: 'hello' } }] } },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" = :orm_param_0)`,
            },
            {
                dto: { where: { $or: [{ col1: { operator: '=', operand: 'hello' }, col2: { operator: '<', operand: 5 } }] } },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" = :orm_param_0 AND \"TestEntity\".\"col2\" < :orm_param_1)`,
            },
        ];

        for (const { dto, expected } of fixtures) {
            const query = service.getQueryBuilderFromSearchDto({ requestSearchDto: dto }).getQuery();
            expect(query).toEqual(expected);
        }
    });

    it('should build `where` clause with RequestSearchDto when `where.$not` is provided', () => {
        const fixtures: Array<{ dto: RequestSearchDto<TestEntity>; expected: string }> = [
            {
                dto: { where: { $not: [{ col1: { operator: '=', operand: 'hello' } }] } },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE NOT(\"TestEntity\".\"col1\" = :orm_param_0)`,
            },
            {
                dto: { where: { $not: [{ col1: { operator: '=', operand: 'hello' }, col2: { operator: '<', operand: 5 } }] } },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE NOT((\"TestEntity\".\"col1\" = :orm_param_0 AND \"TestEntity\".\"col2\" < :orm_param_1))`,
            },
        ];

        for (const { dto, expected } of fixtures) {
            const query = service.getQueryBuilderFromSearchDto({ requestSearchDto: dto }).getQuery();
            expect(query).toEqual(expected);
        }
    });

    it('should build `where` clause with RequestSearchDto when complex `where` options is provided', () => {
        const fixtures: Array<{ dto: RequestSearchDto<TestEntity>; expected: string }> = [
            {
                dto: {
                    select: ['col1', 'col2'],
                    where: {
                        $and: [{ col2: { operator: '<', operand: 5 } }],
                        $or: [{ col1: { operator: '=', operand: 'hello' } }],
                    },
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col2\" < :orm_param_0) OR (\"TestEntity\".\"col1\" = :orm_param_1)`,
            },
            {
                dto: {
                    select: ['col1', 'col2'],
                    where: {
                        $and: [
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '<', operand: 5 } },
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '>', operand: 10 } },
                        ],
                        $or: [
                            { col1: { operator: '=', operand: 'bye' }, col2: { operator: '=', operand: 1 } },
                            { col1: { operator: '=', operand: 'bye' }, col2: { operator: '=', operand: 3 } },
                        ],
                    },
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" = :orm_param_0 AND \"TestEntity\".\"col2\" < :orm_param_1) AND (\"TestEntity\".\"col1\" = :orm_param_2 AND \"TestEntity\".\"col2\" > :orm_param_3) OR (\"TestEntity\".\"col1\" = :orm_param_4 AND \"TestEntity\".\"col2\" = :orm_param_5) OR (\"TestEntity\".\"col1\" = :orm_param_6 AND \"TestEntity\".\"col2\" = :orm_param_7)`,
            },
            {
                dto: {
                    select: ['col1', 'col2'],
                    where: {
                        $and: [
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '<', operand: 5 } },
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '>', operand: 10 } },
                        ],
                        $not: [{ col3: { operator: 'NULL' } }],
                    },
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" = :orm_param_0 AND \"TestEntity\".\"col2\" < :orm_param_1) AND (\"TestEntity\".\"col1\" = :orm_param_2 AND \"TestEntity\".\"col2\" > :orm_param_3) AND NOT(\"TestEntity\".\"col3\" IS NULL)`,
            },
            {
                dto: {
                    select: ['col1', 'col2', 'col3'],
                    where: {
                        $and: [
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '<', operand: 5 } },
                            { col1: { operator: '=', operand: 'hello' }, col2: { operator: '>', operand: 10 } },
                        ],
                        $or: [{ col1: { operator: 'LIKE', operand: 'world' } }],
                        $not: [{ col3: { operator: 'NULL' } }],
                    },
                    order: { col2: Sort.DESC },
                    take: 20,
                    withDeleted: true,
                },
                expected: `SELECT \"TestEntity\".\"col1\" AS \"TestEntity_col1\", \"TestEntity\".\"col2\" AS \"TestEntity_col2\", \"TestEntity\".\"col3\" AS \"TestEntity_col3\" FROM \"TestEntity\" \"TestEntity\" WHERE (\"TestEntity\".\"col1\" = :orm_param_0 AND \"TestEntity\".\"col2\" < :orm_param_1) AND (\"TestEntity\".\"col1\" = :orm_param_2 AND \"TestEntity\".\"col2\" > :orm_param_3) OR (\"TestEntity\".\"col1\" LIKE :orm_param_4) AND NOT(\"TestEntity\".\"col3\" IS NULL) ORDER BY col2 DESC LIMIT 20`,
            },
        ];

        for (const { dto, expected } of fixtures) {
            const query = service.getQueryBuilderFromSearchDto({ requestSearchDto: dto }).getQuery();
            expect(query).toEqual(expected);
        }
    });
});
