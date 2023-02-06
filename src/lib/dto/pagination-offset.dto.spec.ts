import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { PaginationOffsetDto } from './pagination-offset.dto';

describe('PaginationOffsetDto', () => {
    it('should be optional all values', () => {
        expect(validateSync(plainToClass(PaginationOffsetDto, {}))).toEqual([]);

        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: 100 }))).toEqual([]);
        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: 100, offset: 20 }))).toEqual([]);
        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: 100, offset: 20, query: 'queryToken' }))).toEqual([]);
    });

    it('should be positive number', () => {
        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: 10 }))).toEqual([]);
        expect(validateSync(plainToClass(PaginationOffsetDto, { offset: 10 }))).toEqual([]);
        expect(validateSync(plainToClass(PaginationOffsetDto, { query: 10 }))).toEqual([
            {
                children: [],
                constraints: { isString: 'query must be a string' },
                property: 'query',
                target: { query: 10, type: 'offset' },
                value: 10,
            },
        ]);
    });

    it('should be character type', () => {
        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: 'a' }))).toEqual([
            {
                target: { limit: Number.NaN, type: 'offset' },
                value: Number.NaN,
                property: 'limit',
                children: [],
                constraints: {
                    isPositive: 'limit must be a positive number',
                    max: 'limit must not be greater than 100',
                },
            },
        ]);
        expect(validateSync(plainToClass(PaginationOffsetDto, { offset: 'b' }))).toEqual([
            {
                target: { offset: Number.NaN, type: 'offset' },
                value: Number.NaN,
                property: 'offset',
                children: [],
                constraints: { isPositive: 'offset must be a positive number' },
            },
        ]);
        expect(validateSync(plainToClass(PaginationOffsetDto, { query: 'c' }))).toEqual([]);
    });

    it('should be limited', () => {
        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: 100 }))).toEqual([]);

        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: 101 }))).toEqual([
            {
                target: { limit: 101, type: 'offset' },
                value: 101,
                property: 'limit',
                children: [],
                constraints: { max: 'limit must not be greater than 100' },
            },
        ]);
        expect(validateSync(plainToClass(PaginationOffsetDto, { limit: -1 }))).toEqual([
            {
                target: { limit: -1, type: 'offset' },
                value: -1,
                property: 'limit',
                children: [],
                constraints: { isPositive: 'limit must be a positive number' },
            },
        ]);
    });

    it('should be allowed zero', () => {
        const validate = (obj: unknown) => {
            const paginationOffsetDto = plainToClass(PaginationOffsetDto, obj);
            const error = validateSync(paginationOffsetDto);
            if (error.length > 0) {
                throw error;
            }
            return paginationOffsetDto;
        };
        expect(validate({ limit: 1 })).toEqual({ limit: 1, type: 'offset' });
        expect(validate({ limit: 0 })).toEqual({ limit: 0, type: 'offset' });
        expect(validate({ limit: -1 })).toEqual({ limit: 0, type: 'offset' });
        expect(validate({})).toEqual({ type: 'offset' });
    });
});
