import { BaseEntity, Entity } from 'typeorm';

import { CrudRouteFactory } from './crud.route.factory';
import { PaginationType } from './interface';

describe('CrudRouteFactory', () => {
    @Entity('TestEntity')
    class TestEntity extends BaseEntity {}

    it('should check tableName in TypeORM', () => {
        expect(() => new CrudRouteFactory({ prototype: {} }, { entity: {} as typeof BaseEntity })).toThrow(Error);
    });

    it('should be checked paginationType', () => {
        expect(
            () =>
                new CrudRouteFactory(
                    { prototype: {} },
                    {
                        entity: TestEntity,
                        routes: { readMany: { paginationType: 'wrong' as unknown as PaginationType } },
                    },
                ),
        ).toThrow(TypeError);
    });
});
