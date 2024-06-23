/* eslint-disable @typescript-eslint/naming-convention */
import { UnprocessableEntityException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'typeorm';

import { SearchRequestInterceptor } from './search-request.interceptor';
import { Sort } from '../interface';
import { CrudLogger } from '../provider/crud-logger';

describe('SearchRequestInterceptor', () => {
    class TestEntity extends BaseEntity {
        @IsString({ groups: ['search'] })
        @IsOptional({ groups: ['search'] })
        col1: string;

        @IsNumber({}, { groups: ['search'] })
        @IsNotEmpty({ groups: ['search'] })
        col2: number;

        @IsNumber({}, { groups: ['search'] })
        @IsOptional({ groups: ['search'] })
        col3: number;

        @Type(() => Date)
        @IsDate({ groups: ['search'] })
        @IsOptional({ groups: ['search'] })
        col4: Date;
    }

    let interceptor: InstanceType<ReturnType<typeof SearchRequestInterceptor>>;
    beforeAll(() => {
        const Interceptor = SearchRequestInterceptor(
            {
                entity: TestEntity,
                routes: {
                    search: {
                        limitOfTake: 100_000,
                    },
                },
            },
            {
                columns: [
                    { name: 'col1', type: 'string', isPrimary: false },
                    { name: 'col2', type: 'number', isPrimary: false },
                    { name: 'col3', type: 'number', isPrimary: false },
                    { name: 'col4', type: 'datetime', isPrimary: false },
                ],
                relations: [],
                logger: new CrudLogger(),
                primaryKeys: [],
            },
        );
        interceptor = new Interceptor();
    });

    describe('body', () => {
        describe('should throw when body is not an object', () => {
            test.each([null, undefined, 'string', []])('body(%p)', async (body) => {
                await expect(interceptor.validateBody(body)).rejects.toThrow(new UnprocessableEntityException('body should be object'));
            });
        });
    });

    describe('body.select', () => {
        it('return search request dto when input is valid', async () => {
            expect(await interceptor.validateBody({ select: ['col1', 'col2'] })).toEqual({
                select: ['col1', 'col2'],
                withDeleted: false,
            });
        });

        describe('throw when body.select is not array type', () => {
            test.each([undefined, null, 'col1', {}])('select(%p)', async (select) => {
                await expect(interceptor.validateBody({ select })).rejects.toThrow(
                    new UnprocessableEntityException('select must be array type'),
                );
            });
        });

        it('throw when select key is not included in entity fields', async () => {
            await expect(interceptor.validateBody({ select: ['col0'] })).rejects.toThrow(
                new UnprocessableEntityException('select key col0 is not included in entity fields'),
            );
        });
    });

    describe('body.where', () => {
        describe('return search request dto when input is valid', () => {
            describe('BETWEEN', () => {
                it('number type', async () => {
                    expect(
                        await interceptor.validateBody({
                            where: [{ col3: { operator: 'BETWEEN', operand: [0, 5] } }],
                        }),
                    ).toEqual({
                        where: [{ col3: { operator: 'BETWEEN', operand: [0, 5] } }],
                        withDeleted: false,
                    });
                });

                it('date type', async () => {
                    expect(
                        await interceptor.validateBody({
                            where: [{ col4: { operator: 'BETWEEN', operand: ['2000-01-01', '2000-02-01'] } }],
                        }),
                    ).toEqual({
                        where: [{ col4: { operator: 'BETWEEN', operand: ['2000-01-01', '2000-02-01'] } }],
                        withDeleted: false,
                    });
                });
            });
            it('IN', async () => {
                expect(
                    await interceptor.validateBody({
                        where: [{ col3: { operator: 'IN', operand: [0, 1, 2] } }],
                    }),
                ).toEqual({
                    where: [{ col3: { operator: 'IN', operand: [0, 1, 2] } }],
                    withDeleted: false,
                });
            });

            it('NULL', async () => {
                expect(await interceptor.validateBody({ where: [{ col3: { operator: 'NULL' } }] })).toEqual({
                    where: [{ col3: { operator: 'NULL' } }],
                    withDeleted: false,
                });
            });

            it('Union Operators("=", "!=", ">", ">=", "<", "<=", "LIKE", "ILIKE")', async () => {
                expect(
                    await interceptor.validateBody({
                        where: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                    }),
                ).toEqual({
                    where: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                    withDeleted: false,
                });
            });

            it('not option', async () => {
                expect(
                    await interceptor.validateBody({
                        where: [{ col2: { operator: '=', operand: 7, not: false }, col3: { operator: '>', operand: 3, not: true } }],
                    }),
                ).toEqual({
                    where: [{ col2: { not: false, operand: 7, operator: '=' }, col3: { not: true, operand: 3, operator: '>' } }],
                    withDeleted: false,
                });
            });
        });

        describe('throw when body.where is not array type', () => {
            test.each([{}, null, 'unknown'])('body.where(%p)', async (where) => {
                await expect(interceptor.validateBody({ where })).rejects.toThrow(
                    new UnprocessableEntityException('where must be array type'),
                );
            });
        });

        describe('throw when item of body.where is not object', () => {
            test.each([null, undefined, 'unknown'])('body.where([%p])', async (filter) => {
                await expect(interceptor.validateBody({ where: [filter] })).rejects.toThrow(
                    new UnprocessableEntityException('items of where must be object type'),
                );
            });
        });

        it('throw when body.where filter key is not included in entity fields', async () => {
            await expect(
                interceptor.validateBody({
                    where: [{ unknown: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                }),
            ).rejects.toThrow(new UnprocessableEntityException("where key unknown is not included in entity's fields"));
        });

        it('throw when body.where filter value is not object type', async () => {
            await expect(
                interceptor.validateBody({
                    where: [{ col1: 1 }],
                }),
            ).rejects.toThrow(new UnprocessableEntityException('where.col1 is not object type'));
        });

        it('throw when body.where filter not define operator', async () => {
            await expect(
                interceptor.validateBody({
                    where: [{ col1: { operand: 1 } }],
                }),
            ).rejects.toThrow(new UnprocessableEntityException('where.col1 not have operator'));
        });

        describe('throw when not option is non-boolean type', () => {
            test.each([1, 'true'])('not(%p)', async (not) => {
                await expect(
                    interceptor.validateBody({
                        where: [{ col2: { operator: '=', operand: 7, not }, col3: { operator: '>', operand: 3 } }],
                    }),
                ).rejects.toThrow(new UnprocessableEntityException("where.col2 has 'not' value of non-boolean type"));
            });
        });

        describe('throw when operand for BETWEEN is not array of identical type 2 values', () => {
            test.each([undefined, 0, [1, 2, 3], [1, '2']])('operand(%p)', async (operand) => {
                await expect(interceptor.validateBody({ where: [{ col3: { operator: 'BETWEEN', operand } }] })).rejects.toThrow(
                    new UnprocessableEntityException(
                        'operand for BETWEEN should be array of identical type 2 values, but where.col3 not satisfy it',
                    ),
                );
            });
        });

        describe('throw when operand for IN is not array consisting of same type items', () => {
            test.each([undefined, 0, [], [0, '1', 2], [0, 1, null]])('operand(%p)', async (operand) => {
                await expect(interceptor.validateBody({ where: [{ col3: { operator: 'IN', operand } }] })).rejects.toThrow(
                    new UnprocessableEntityException(
                        'operand for IN should be array consisting of same type items, but where.col3 not satisfy it',
                    ),
                );
            });
        });

        describe('throw when operand for NULL is defined', () => {
            test.each([null, 0, '123'])('operand(%p)', async (operand) => {
                await expect(interceptor.validateBody({ where: [{ col3: { operator: 'NULL', operand } }] })).rejects.toThrow(
                    new UnprocessableEntityException('operand for NULL should not be defined, but where.col3 not satisfy it'),
                );
            });
        });

        it('throw when not supported operator is given', async () => {
            await expect(
                interceptor.validateBody({
                    where: [{ col3: { operator: 'NOT IN', operand: [0, 1, 2] } }],
                }),
            ).rejects.toThrow(new UnprocessableEntityException('operator NOT IN for where.col3 is not supported'));
        });

        describe('throw when operand type not equal entity field type', () => {
            test.each([
                ['col1', 'BETWEEN', [1, 2]],
                ['col1', '>', 123],
                ['col2', 'IN', ['1']],
            ])('key(%s), operator(%s), operand(%p)', async (key, operator, operand) => {
                await expect(interceptor.validateBody({ where: [{ [key]: { operator, operand } }] })).rejects.toThrow(
                    UnprocessableEntityException,
                );
            });
        });
    });

    describe('body.order', () => {
        it('return search request dto when input is valid', async () => {
            expect(await interceptor.validateBody({ order: { col2: Sort.ASC, col3: Sort.DESC } })).toEqual({
                order: { col2: Sort.ASC, col3: Sort.DESC },
                withDeleted: false,
            });
        });

        describe('throw when body.order is not object type', () => {
            test.each([undefined, null, 'unknown', []])('order(%p)', async (order) => {
                await expect(interceptor.validateBody({ order })).rejects.toThrow(
                    new UnprocessableEntityException('order must be object type'),
                );
            });
        });

        it('throw when order key is not included in entity fields', async () => {
            await expect(interceptor.validateBody({ order: { col0: Sort.ASC } })).rejects.toThrow(
                new UnprocessableEntityException("order key col0 is not included in entity's fields"),
            );
        });

        it('throw when not supported sort type is given', async () => {
            await expect(interceptor.validateBody({ order: { col1: 'unknown' } })).rejects.toThrow(
                new UnprocessableEntityException('order type unknown is not supported'),
            );
        });
    });

    describe('body.withDeleted', () => {
        describe('return search request dto when input is valid', () => {
            test.each([true, false])('withDeleted(%p)', async (withDeleted) => {
                expect(await interceptor.validateBody({ withDeleted })).toEqual({ withDeleted });
            });
        });

        describe('throw when withDeleted is not boolean type', () => {
            test.each([undefined, null, 'true', 0])('withDeleted(%p)', async (withDeleted) => {
                await expect(interceptor.validateBody({ withDeleted })).rejects.toThrow(
                    new UnprocessableEntityException('withDeleted must be boolean type'),
                );
            });
        });
    });

    describe('body.take', () => {
        describe('return search request dto when input is valid', () => {
            test.each([1, 20, 100_000])('take(%p)', async (take) => {
                expect(await interceptor.validateBody({ take })).toEqual({ take, withDeleted: false });
            });
        });

        describe('throw when take is not positive number', () => {
            test.each([null, [], 'unknown', -10, 0])('take(%p)', async (take) => {
                await expect(interceptor.validateBody({ take })).rejects.toThrow(
                    new UnprocessableEntityException('take must be positive number'),
                );
            });
        });

        it('throw when take exceeds limit of take', async () => {
            await expect(interceptor.validateBody({ take: 100_001 })).rejects.toThrow(
                new UnprocessableEntityException('take must be less than 100000'),
            );
        });
    });

    describe('getRelations', () => {
        describe('return relations in custom options when it is array type', () => {
            let interceptor: InstanceType<ReturnType<typeof SearchRequestInterceptor>>;
            beforeAll(() => {
                const Interceptor = SearchRequestInterceptor(
                    { entity: {} as typeof BaseEntity, routes: { search: { relations: ['route'] } } },
                    { relations: ['factory'], logger: new CrudLogger(), primaryKeys: [] },
                );
                interceptor = new Interceptor();
            });

            it('customOptions.relations(["table"])', () => {
                expect(interceptor.getRelations({ relations: ['custom'] })).toEqual(['custom']);
            });

            test.each([undefined, null, 'custom', {}])('customOptions.relations(%p)', (relations) => {
                expect(interceptor.getRelations({ relations: relations as string[] })).not.toEqual(relations);
            });
        });

        describe('return relations in factory options when relations in search route option is not defined', () => {
            it('route option is not defined', () => {
                const Interceptor = SearchRequestInterceptor(
                    { entity: {} as typeof BaseEntity },
                    { relations: ['factory'], logger: new CrudLogger(), primaryKeys: [] },
                );
                const interceptor = new Interceptor();

                expect(interceptor.getRelations({})).toEqual(['factory']);
            });

            it('search route option is not defined', () => {
                const Interceptor = SearchRequestInterceptor(
                    { entity: {} as typeof BaseEntity, routes: {} },
                    { relations: ['factory'], logger: new CrudLogger(), primaryKeys: [] },
                );
                const interceptor = new Interceptor();

                expect(interceptor.getRelations({})).toEqual(['factory']);
            });

            it('relations is not defined in search route option', () => {
                const Interceptor = SearchRequestInterceptor(
                    { entity: {} as typeof BaseEntity, routes: { search: {} } },
                    { relations: ['factory'], logger: new CrudLogger(), primaryKeys: [] },
                );
                const interceptor = new Interceptor();

                expect(interceptor.getRelations({})).toEqual(['factory']);
            });
        });

        it('return empty array when relations in search route is false', () => {
            const Interceptor = SearchRequestInterceptor(
                { entity: {} as typeof BaseEntity, routes: { search: { relations: false } } },
                { relations: ['factory'], logger: new CrudLogger(), primaryKeys: [] },
            );
            const interceptor = new Interceptor();

            expect(interceptor.getRelations({})).toEqual([]);
        });

        describe('return relations in search route option when it is array type', () => {
            it('routes.search.relations(["route"])', () => {
                const Interceptor = SearchRequestInterceptor(
                    { entity: {} as typeof BaseEntity, routes: { search: { relations: ['route'] } } },
                    { relations: ['factory'], logger: new CrudLogger(), primaryKeys: [] },
                );
                const interceptor = new Interceptor();

                expect(interceptor.getRelations({})).toEqual(['route']);
            });

            test.each([undefined, null, 'route', {}])('routes.search.relations(%p)', (routeRelations) => {
                const Interceptor = SearchRequestInterceptor(
                    { entity: {} as typeof BaseEntity, routes: { search: { relations: routeRelations as string[] } } },
                    { relations: ['factory'], logger: new CrudLogger(), primaryKeys: [] },
                );
                interceptor = new Interceptor();

                expect(interceptor.getRelations({})).not.toEqual(routeRelations);
            });
        });
    });
});
