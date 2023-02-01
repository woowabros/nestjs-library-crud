import { PaginationHelper } from './pagination.helper';

describe('Pagination Helper', () => {
    it('should serialize entity', () => {
        expect(PaginationHelper.serialize({ id: 1, name: 'test' })).toEqual(expect.any(String));
    });

    it('should deserialize cursor', () => {
        const cursor = PaginationHelper.serialize({ id: 1 });
        expect(PaginationHelper.deserialize(cursor)).toEqual({ id: 1 });
    });

    it('should return empty object when cursor is malformed', () => {
        const cursor = 'malformed';
        expect(PaginationHelper.deserialize(cursor)).toEqual({});
    });
});
