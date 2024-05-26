import { UnprocessableEntityException } from '@nestjs/common';
import { BaseEntity, Entity } from 'typeorm';

import { CrudRouteFactory } from './crud.route.factory';
import { PaginationType } from './interface';

describe('CrudRouteFactory', () => {
    @Entity('test')
    class TestEntity extends BaseEntity {}

    it('should check tableName in TypeORM', () => {
        expect(() => new CrudRouteFactory({ prototype: {} }, { entity: {} as typeof BaseEntity })).toThrow(
            new Error('Cannot find Table from TypeORM'),
        );
    });

    describe('should be checked paginationType', () => {
        test.each(['readMany', 'search'])('route(%s)', (route) => {
            expect(() =>
                new CrudRouteFactory(
                    { prototype: {} },
                    {
                        entity: TestEntity,
                        routes: { [route]: { paginationType: 'wrong' as unknown as PaginationType } },
                    },
                ).init(),
            ).toThrow(new TypeError('invalid PaginationType wrong'));
        });
    });

    describe('should be checked paginationKeys included in entity columns', () => {
        test.each(['readMany', 'search'])('route(%s)', (route) => {
            expect(() =>
                new CrudRouteFactory(
                    { prototype: {} },
                    {
                        entity: TestEntity,
                        routes: { [route]: { paginationKeys: ['wrong'] } },
                    },
                ).init(),
            ).toThrow(new UnprocessableEntityException('pagination key wrong is unknown'));
        });
    });
});
