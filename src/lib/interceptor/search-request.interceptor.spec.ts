/* eslint-disable @typescript-eslint/naming-convention */
import { UnprocessableEntityException } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'typeorm';

import { SearchRequestInterceptor } from './search-request.interceptor';
import { Sort } from '../interface';

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

    let interceptor;
    beforeEach(() => {
        const Interceptor = SearchRequestInterceptor(
            { entity: TestEntity },
            {
                columns: [
                    { name: 'col1', type: 'string', isPrimary: false },
                    { name: 'col2', type: 'number', isPrimary: false },
                    { name: 'col3', type: 'number', isPrimary: false },
                ],
            },
        );
        interceptor = new Interceptor();
    });

    describe('validateBody', () => {
        it('should should throw when body is not an object', async () => {
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
                    where: { $and: [{ unknown: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }] },
                }),
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should throw when query filter is not an array or empty', async () => {
            await expect(interceptor.validateBody({ where: { $or: [] } })).rejects.toThrow(UnprocessableEntityException);
            await expect(interceptor.validateBody({ where: { $and: null } })).rejects.toThrow(UnprocessableEntityException);
        });

        it('should throw when invalid query filter is given', async () => {
            await expect(interceptor.validateBody({ where: { $or: [null] } })).rejects.toThrow(UnprocessableEntityException);
            await expect(interceptor.validateBody({ where: { $and: ['unknown'] } })).rejects.toThrow(UnprocessableEntityException);
        });

        it('should validate Union Operators("=", "!=", ">", ">=", "<", "<=", "LIKE", "ILIKE")', async () => {
            const invalidWhereList = [
                { where: { col1: 1 } },
                { where: { $and: [{ abc: 1 }] } },
                { where: { $and: [{ col1: 1, col3: 3 }] } },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(
                await interceptor.validateBody({
                    where: { $and: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }] },
                }),
            ).toEqual({
                where: { $and: [{ col2: { operator: '=', operand: 7 }, col3: { operator: '>', operand: 3 } }] },
                take: 20,
                withDeleted: false,
            });
        });

        it('should validate BETWEEN operation', async () => {
            const invalidWhereList = [
                { where: { $or: [{ col3: { operator: 'BETWEEN' } }] } },
                { where: { $or: [{ col3: { operator: 'BETWEEN', operand: 0 } }] } },
                { where: { $or: [{ col3: { operator: 'BETWEEN', operand: [1, '2'] } }] } },
                { where: { $or: [{ col3: { operator: 'BETWEEN', operand: [1, 2, 3] } }] } },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(
                await interceptor.validateBody({
                    where: { $or: [{ col3: { operator: 'BETWEEN', operand: [0, 5] } }] },
                }),
            ).toEqual({
                where: { $or: [{ col3: { operator: 'BETWEEN', operand: [0, 5] } }] },
                take: 20,
                withDeleted: false,
            });
        });

        it('should validate IN operation', async () => {
            const invalidWhereList = [
                { where: { $or: [{ col3: { operator: 'IN' } }] } },
                { where: { $or: [{ col3: { operator: 'IN', operand: 0 } }] } },
                { where: { $or: [{ col3: { operator: 'IN', operand: [0, '1', 2] } }] } },
                { where: { $or: [{ col3: { operator: 'IN', operand: [0, 1, null] } }] } },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(
                await interceptor.validateBody({
                    where: { $or: [{ col3: { operator: 'IN', operand: [0, 1, 2] } }] },
                }),
            ).toEqual({
                where: { $or: [{ col3: { operator: 'IN', operand: [0, 1, 2] } }] },
                take: 20,
                withDeleted: false,
            });
        });

        it('should support defined type only', async () => {
            await expect(
                interceptor.validateBody({
                    where: { $or: [{ col3: { operator: 'NOT IN', operand: [0, 1, 2] } }] },
                }),
            ).rejects.toThrow(UnprocessableEntityException);
        });

        it('should validate NULL operation', async () => {
            const invalidWhereList = [
                { where: { $or: [{ col3: { operator: 'NULL', operand: 0 } }] } },
                { where: { $or: [{ col3: { operator: 'NULL', operand: null } }] } },
                { where: { $or: [{ col3: { operator: 'NULL', operand: '123' } }] } },
            ];

            for (const where of invalidWhereList) {
                await expect(interceptor.validateBody(where)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(await interceptor.validateBody({ where: { $or: [{ col3: { operator: 'NULL' } }] } })).toEqual({
                where: { $or: [{ col3: { operator: 'NULL' } }] },
                take: 20,
                withDeleted: false,
            });
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
            const invalidList = [{ take: 0 }, { take: -10 }, { take: null }];
            for (const take of invalidList) {
                await expect(interceptor.validateBody(take)).rejects.toThrow(UnprocessableEntityException);
            }

            expect(await interceptor.validateBody({ take: 20 })).toEqual({ take: 20, withDeleted: false });
            expect(await interceptor.validateBody({ take: 100_000 })).toEqual({ take: 100_000, withDeleted: false });
        });
    });
});
