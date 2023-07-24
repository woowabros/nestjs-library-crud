import { CrudReadManyRequest } from '.';

describe('CrudReadManyRequest', () => {
    it('should be defined', () => {
        const crudReadManyRequest = new CrudReadManyRequest();
        expect(crudReadManyRequest).toBeDefined();
    });
});
