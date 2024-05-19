import { UnprocessableEntityException } from '@nestjs/common';
import { BaseEntity, Entity } from 'typeorm';

import { CrudRouteFactory } from './crud.route.factory';
import { PaginationType } from './interface';

describe('CrudRouteFactory', () => {
    @Entity('test')
    class TestEntity extends BaseEntity {}

    it('should check tableName in TypeORM', () => {
        expect(() => new CrudRouteFactory({ prototype: {} }, { entity: {} as typeof BaseEntity })).toThrow(Error);
    });

    it('should be checked paginationType of readMany route', () => {
        expect(() =>
            new CrudRouteFactory(
                { prototype: {} },
                {
                    entity: TestEntity,
                    routes: { readMany: { paginationType: 'wrong' as unknown as PaginationType } },
                },
            ).init(),
        ).toThrow(TypeError);
    });

    it('should be checked paginationType of search route', () => {
        expect(() =>
            new CrudRouteFactory(
                { prototype: {} },
                {
                    entity: TestEntity,
                    routes: { search: { paginationType: 'wrong' as unknown as PaginationType } },
                },
            ).init(),
        ).toThrow(TypeError);
    });

    it('should be checked paginationKeys included in entity columns', () => {
        expect(() =>
            new CrudRouteFactory(
                { prototype: {} },
                {
                    entity: TestEntity,
                    routes: { search: { paginationKeys: ['wrong'] } },
                },
            ).init(),
        ).toThrow(UnprocessableEntityException);

        expect(() =>
            new CrudRouteFactory(
                { prototype: {} },
                {
                    entity: TestEntity,
                    routes: { readMany: { paginationKeys: ['wrong'] } },
                },
            ).init(),
        ).toThrow(UnprocessableEntityException);
    });
});
