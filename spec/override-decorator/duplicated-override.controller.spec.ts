import { CrudAbstractEntity } from '../crud.abstract.entity';

describe('DuplicatedOverrideController', () => {
    it('should be use one decorator per method', () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/naming-convention
            const { DuplicatedOverrideController } = require('./duplicated-override.controller');
            new DuplicatedOverrideController({} as CrudAbstractEntity);
            throw new Error('fail');
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            if (error instanceof Error) {
                expect(error.message).toBe('duplicated READ_ONE method on overrideReadOne2');
            }
        }
    });
});
