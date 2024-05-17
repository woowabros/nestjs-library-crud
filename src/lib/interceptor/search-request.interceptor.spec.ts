/* eslint-disable @typescript-eslint/naming-convention */
import { NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'typeorm';

import { CustomSearchRequestOptions } from './custom-request.interceptor';
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
    }

    let interceptor: any;
    beforeAll(() => {
        const Interceptor = SearchRequestInterceptor(
            { entity: TestEntity },
            {
                columns: [
                    { name: 'col1', type: 'string', isPrimary: false },
                    { name: 'col2', type: 'number', isPrimary: false },
                    { name: 'col3', type: 'number', isPrimary: false },
                ],
                relations: [],
                logger: new CrudLogger(),
                primaryKeys: [],
            },
        );
        interceptor = new Interceptor();
    });

    describe('validateBody', () => {
        it('should throw when body is not an object', async () => {
            const invalidBodyList = [null, undefined, 'string', 0, 1, true, false];
            for (const body of invalidBodyList) {
                await expect(interceptor.validateBody(body)).rejects.toThrow(UnprocessableEntityException);
            }
        });
    });

    describe('body.select', () => {
        it('should validate select has key of entity', async () => {
            const invalidSelectList = [{ select: ['col0'] }, { select: 'col1' }];
            for (const select of invalidSelectList) {
                await expect(interceptor.validateBody(select)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(await interceptor.validateBody({ select: ['col1', 'col2'] })).toEqual({
                select: ['col1', 'col2'],
                take: 20,
                withDeleted: false,
            });
        });
    });

    describe('body.where', () => {
        it('should validate entity column name', async () => {
            await expect(
                interceptor.validateBody({
                    where: [{ unknown: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                }),
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should validate not option', async () => {
            expect(
                await interceptor.validateBody({
                    where: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                }),
            ).toEqual({
                where: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                take: 20,
                withDeleted: false,
            });

            await expect(
                interceptor.validateBody({
                    where: [{ col2: { operator: '=', operand: 7, not: 1 }, col3: { operator: '>', operand: 3 } }],
                }),
            ).rejects.toThrow(UnprocessableEntityException);

            await expect(
                interceptor.validateBody({
                    where: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3, not: 'true' } }],
                }),
            ).rejects.toThrow(UnprocessableEntityException);

            expect(
                await interceptor.validateBody({
                    where: [{ col2: { operator: '=', operand: 7, not: false }, col3: { operator: '>', operand: 3, not: true } }],
                }),
            ).toEqual({
                take: 20,
                where: [{ col2: { not: false, operand: 7, operator: '=' }, col3: { not: true, operand: 3, operator: '>' } }],
                withDeleted: false,
            });
        });

        it('should throw when query filter is not an array', async () => {
            await expect(interceptor.validateBody({ where: {} })).rejects.toThrow(UnprocessableEntityException);
            await expect(interceptor.validateBody({ where: null })).rejects.toThrow(UnprocessableEntityException);
            await expect(interceptor.validateBody({ where: 'unknown' })).rejects.toThrow(UnprocessableEntityException);
        });

        it('should throw when invalid query filter is given', async () => {
            await expect(interceptor.validateBody({ where: [null] })).rejects.toThrow(UnprocessableEntityException);
            await expect(interceptor.validateBody({ where: [undefined] })).rejects.toThrow(UnprocessableEntityException);
            await expect(interceptor.validateBody({ where: ['unknown'] })).rejects.toThrow(UnprocessableEntityException);
        });

        it('should validate Union Operators("=", "!=", ">", ">=", "<", "<=", "LIKE", "ILIKE")', async () => {
            const invalidWhereList = [{ where: [{ col1: 1 }] }, { where: [{ abc: 1 }] }, { where: [{ col1: 1, col3: 3 }] }];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(
                await interceptor.validateBody({
                    where: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                }),
            ).toEqual({
                where: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }],
                take: 20,
                withDeleted: false,
            });
        });

        it('should validate BETWEEN operation', async () => {
            const invalidWhereList = [
                { where: [{ col3: { operator: 'BETWEEN' } }] },
                { where: [{ col3: { operator: 'BETWEEN', operand: 0 } }] },
                { where: [{ col3: { operator: 'BETWEEN', operand: [1, '2'] } }] },
                { where: [{ col3: { operator: 'BETWEEN', operand: [1, 2, 3] } }] },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(
                await interceptor.validateBody({
                    where: [{ col3: { operator: 'BETWEEN', operand: [0, 5] } }],
                }),
            ).toEqual({
                where: [{ col3: { operator: 'BETWEEN', operand: [0, 5] } }],
                take: 20,
                withDeleted: false,
            });
        });

        it('should validate IN operation', async () => {
            const invalidWhereList = [
                { where: [{ col3: { operator: 'IN' } }] },
                { where: [{ col3: { operator: 'IN', operand: 0 } }] },
                { where: [{ col3: { operator: 'IN', operand: [] } }] },
                { where: [{ col3: { operator: 'IN', operand: [0, '1', 2] } }] },
                { where: [{ col3: { operator: 'IN', operand: [0, 1, null] } }] },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(
                await interceptor.validateBody({
                    where: [{ col3: { operator: 'IN', operand: [0, 1, 2] } }],
                }),
            ).toEqual({
                where: [{ col3: { operator: 'IN', operand: [0, 1, 2] } }],
                take: 20,
                withDeleted: false,
            });
        });

        it('should support defined operator only', async () => {
            await expect(
                interceptor.validateBody({
                    where: [{ col3: { operator: 'NOT IN', operand: [0, 1, 2] } }],
                }),
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should validate NULL operation', async () => {
            const invalidWhereList = [
                { where: [{ col3: { operator: 'NULL', operand: 0 } }] },
                { where: [{ col3: { operator: 'NULL', operand: null } }] },
                { where: [{ col3: { operator: 'NULL', operand: '123' } }] },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(await interceptor.validateBody({ where: [{ col3: { operator: 'NULL' } }] })).toEqual({
                where: [{ col3: { operator: 'NULL' } }],
                take: 20,
                withDeleted: false,
            });
        });

        it('should throw when operand type not equals entity field type', async () => {
            const invalidWhereList = [
                { where: [{ col1: { operator: 'BETWEEN', operand: [1, 2] } }] },
                { where: [{ col1: { operator: 'IN', operand: [1] } }] },
                { where: [{ col2: { operator: 'IN', operand: ['1'] } }] },
                { where: [{ col1: { operator: '>', operand: 123 } }] },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }
        });
    });

    describe('body.order', () => {
        it('should validate order ', async () => {
            const invalidOrderList = [{ order: { col0: Sort.ASC } }, { order: { col1: 'unknown order' } }, { order: 'unknown' }];
            for (const order of invalidOrderList) {
                await expect(interceptor.validateBody(order)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(await interceptor.validateBody({ order: { col2: Sort.ASC, col3: Sort.DESC } })).toEqual({
                order: { col2: Sort.ASC, col3: Sort.DESC },
                take: 20,
                withDeleted: false,
            });
        });
    });

    describe('body.withDeleted', () => {
        it('should validate withDeleted', async () => {
            const invalidList = [{ withDeleted: 1 }, { withDeleted: null }, { withDeleted: 'unknown' }];
            for (const withDeleted of invalidList) {
                await expect(interceptor.validateBody(withDeleted)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(await interceptor.validateBody({ withDeleted: true })).toEqual({ withDeleted: true, take: 20 });
            expect(await interceptor.validateBody({ withDeleted: false })).toEqual({ withDeleted: false, take: 20 });
        });
    });

    describe('body.take', () => {
        it('should validate take', async () => {
            const invalidList = [{ take: 0 }, { take: -10 }, { take: null }, { take: 'unknown' }];
            for (const take of invalidList) {
                await expect(interceptor.validateBody(take)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(await interceptor.validateBody({ take: 20 })).toEqual({ take: 20, withDeleted: false });
            expect(await interceptor.validateBody({ take: 100_000 })).toEqual({ take: 100_000, withDeleted: false });
        });
    });

    it('should be get relation values per each condition', () => {
        type InterceptorType = NestInterceptor<any, any> & {
            getRelations: (customSearchRequestOptions: CustomSearchRequestOptions) => string[];
        };
        const Interceptor = SearchRequestInterceptor(
            { entity: {} as typeof BaseEntity },
            { relations: [], logger: new CrudLogger(), primaryKeys: [] },
        );
        const interceptor = new Interceptor() as InterceptorType;
        expect(interceptor.getRelations({ relations: [] })).toEqual([]);
        expect(interceptor.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptor.getRelations({})).toEqual([]);

        const InterceptorWithoutSearchRoute = SearchRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { readOne: { relations: false } } },
            { relations: [], logger: new CrudLogger(), primaryKeys: [] },
        );
        const interceptorWithoutSearchRoute = new InterceptorWithoutSearchRoute() as InterceptorType;
        expect(interceptorWithoutSearchRoute.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithoutSearchRoute.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithoutSearchRoute.getRelations({})).toEqual([]);

        const InterceptorWithoutRelations = SearchRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { search: {} } },
            { relations: [], logger: new CrudLogger(), primaryKeys: [] },
        );
        const interceptorWithoutRelations = new InterceptorWithoutRelations() as InterceptorType;
        expect(interceptorWithoutRelations.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithoutRelations.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithoutRelations.getRelations({})).toEqual([]);

        const InterceptorWithOptions = SearchRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { search: { relations: ['option'] } } },
            { relations: [], logger: new CrudLogger(), primaryKeys: [] },
        );
        const interceptorWithOptions = new InterceptorWithOptions() as InterceptorType;
        expect(interceptorWithOptions.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithOptions.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithOptions.getRelations({})).toEqual(['option']);

        const InterceptorWithFalseOptions = SearchRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { search: { relations: false } } },
            { relations: [], logger: new CrudLogger(), primaryKeys: [] },
        );
        const interceptorWithFalseOptions = new InterceptorWithFalseOptions() as InterceptorType;
        expect(interceptorWithFalseOptions.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithFalseOptions.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithFalseOptions.getRelations({})).toEqual([]);
    });
});
