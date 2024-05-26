import { BaseEntity, Entity, Repository } from 'typeorm';

import { Crud } from './crud.decorator';
import { CrudService } from './crud.service';

describe('Crud.Decorator', () => {
    @Entity('test')
    class TestEntity extends BaseEntity {}

    @Crud({
        entity: TestEntity,
    })
    class TestController {
        constructor(public readonly crudService: any) {}
    }

    describe('should check crudService is included as a member of target, and is instance of CrudService', () => {
        it('crudService(instance of CrudService) not throw error', () => {
            const mockRepository = {
                metadata: {
                    primaryColumns: [],
                    columns: [],
                },
            };
            const crudService = new CrudService(mockRepository as unknown as Repository<TestEntity>);
            expect(() => new TestController(crudService)).not.toThrow();
        });

        test.each([undefined, null, 'wrong', {}, []])('crudService(%p) throw error', (crudService: any) => {
            expect(() => new TestController(crudService)).toThrow(
                new TypeError('controller should include member crudService, which is instance of CrudService'),
            );
        });
    });
});
