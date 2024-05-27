import type { CrudAbstractEntity } from '../crud.abstract.entity';

describe('ReservedNameController', () => {
    it('should be do not use reserved name on controller', () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/naming-convention
            const { ReservedNameController } = require('./reserved-name.controller');
            new ReservedNameController({} as CrudAbstractEntity);
            throw new Error('fail');
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            if (error instanceof Error) {
                expect(error.message).toBe('reservedReadOne is a reserved word. cannot use');
            }
        }
    });
});
