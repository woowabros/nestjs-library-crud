import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { RequestFieldsDto } from './request-fields.dto';

describe('RequestFieldsDto', () => {
    it('should be a string', () => {
        const requestFieldsDto = plainToClass(RequestFieldsDto, {});
        const error = validateSync(requestFieldsDto);
        expect(error[0].constraints?.isString).toBeDefined();
    });

    it('should be able to use single string', () => {
        const requestFieldsDto = plainToClass(RequestFieldsDto, { fields: 'single' });
        const error = validateSync(requestFieldsDto);
        expect(error).toEqual([]);
        expect(requestFieldsDto).toEqual({ fields: ['single'] });
    });

    it('should be able to use comma string', () => {
        const requestFieldsDto = plainToClass(RequestFieldsDto, { fields: 'one,two,three' });
        const error = validateSync(requestFieldsDto);
        expect(error).toEqual([]);
        expect(requestFieldsDto).toEqual({ fields: ['one', 'two', 'three'] });
    });

    it('should be able to use array string', () => {
        const requestFieldsDto = plainToClass(RequestFieldsDto, { fields: ['1', '2', '3'] });
        const error = validateSync(requestFieldsDto);
        expect(error).toEqual([]);
        expect(requestFieldsDto).toEqual({ fields: ['1', '2', '3'] });
    });
});
