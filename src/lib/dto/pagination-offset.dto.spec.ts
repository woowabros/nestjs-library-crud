import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { PaginationOffsetDto } from './pagination-offset.dto';

function validateByPaginationOffsetDto(obj: unknown) {
    const paginationOffsetDto = plainToInstance(PaginationOffsetDto, obj);
    const error = validateSync(paginationOffsetDto);
    if (error.length > 0) {
        throw error;
    }
    return paginationOffsetDto;
}
describe('PaginationOffsetDto', () => {
    it('should be optional all values', () => {
        expect(validateSync(plainToInstance(PaginationOffsetDto, {}))).toEqual([]);

        expect(validateSync(plainToInstance(PaginationOffsetDto, { limit: 100 }))).toEqual([]);
        expect(validateSync(plainToInstance(PaginationOffsetDto, { limit: 100, offset: 20 }))).toEqual([]);
        expect(validateSync(plainToInstance(PaginationOffsetDto, { limit: 100, offset: 20, nextCursor: 'queryToken' }))).toEqual([]);
    });

    it('should be positive number', () => {
        expect(validateSync(plainToInstance(PaginationOffsetDto, { limit: 10 }))).toEqual([]);
        expect(validateSync(plainToInstance(PaginationOffsetDto, { offset: 10 }))).toEqual([]);
        expect(validateSync(plainToInstance(PaginationOffsetDto, { nextCursor: 10 }))).toEqual([
            {
                children: [],
                constraints: { isString: 'query must be a string' },
                property: 'query',
                target: { query: 10, type: 'offset', _isNext: false },
                value: 10,
            },
        ]);
    });

    it('should be character type', () => {
        expect(validateSync(plainToInstance(PaginationOffsetDto, { limit: 'a' }))).toEqual([
            {
                target: { limit: Number.NaN, type: 'offset', _isNext: false },
                value: Number.NaN,
                property: 'limit',
                children: [],
                constraints: {
                    isNumber: 'limit must be a number conforming to the specified constraints',
                },
            },
        ]);

        expect(validateSync(plainToInstance(PaginationOffsetDto, { offset: 'b' }))).toEqual([
            {
                target: { offset: Number.NaN, type: 'offset', _isNext: false },
                value: Number.NaN,
                property: 'offset',
                children: [],
                constraints: { isNumber: 'offset must be a number conforming to the specified constraints' },
            },
        ]);
        expect(validateSync(plainToInstance(PaginationOffsetDto, { query: 'c' }))).toEqual([]);
    });

    it('should be allowed zero', () => {
        expect(validateByPaginationOffsetDto({ limit: 1 })).toEqual({ limit: 1, type: 'offset', _isNext: false });
        expect(validateByPaginationOffsetDto({ limit: 0 })).toEqual({ limit: 0, type: 'offset', _isNext: false });
        expect(validateByPaginationOffsetDto({ limit: -1 })).toEqual({ limit: 0, type: 'offset', _isNext: false });
        expect(validateByPaginationOffsetDto({})).toEqual({ type: 'offset', _isNext: false });
    });

    it('should be allowed offset zero', () => {
        expect(validateByPaginationOffsetDto({ offset: 1 })).toEqual({ offset: 1, type: 'offset', _isNext: false });
        expect(validateByPaginationOffsetDto({ offset: 0 })).toEqual({ offset: 0, type: 'offset', _isNext: false });
        expect(validateByPaginationOffsetDto({ offset: -1 })).toEqual({ offset: 0, type: 'offset', _isNext: false });
        expect(validateByPaginationOffsetDto({})).toEqual({ type: 'offset', _isNext: false });
    });
});
