/* eslint-disable @typescript-eslint/naming-convention */
import { CallHandler, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { of } from 'rxjs';
import { BaseEntity } from 'typeorm';

import { ReadOneRequestInterceptor } from './read-one-request.interceptor';
import { CRUD_ROUTE_ARGS, CUSTOM_REQUEST_OPTIONS } from '../constants';
import { Method } from '../interface';
import { ExecutionContextHost } from '../provider';
import { CrudLogger } from '../provider/crud-logger';

describe('ReadOneRequestInterceptor', () => {
    const handler: CallHandler = {
        handle: () => of('test'),
    };

    it('should intercept and pass CrudReadOneRequest', async () => {
        const Interceptor = ReadOneRequestInterceptor(
            { entity: {} as typeof BaseEntity },
            { columns: [{ name: 'col1', type: 'string', isPrimary: false }], logger: new CrudLogger() },
        );
        const interceptor = new Interceptor();

        expect(interceptor).toBeDefined();
        expect(async () => {
            await interceptor.intercept(new ExecutionContextHost([{ [CUSTOM_REQUEST_OPTIONS]: {} }]), handler);
        }).not.toThrowError();
    });

    it('should get fields from interceptor fields and request fields', () => {
        const Interceptor = ReadOneRequestInterceptor({ entity: {} as typeof BaseEntity }, { logger: new CrudLogger() });
        const interceptor = new Interceptor();

        expect(interceptor.getFields(undefined, undefined)).toEqual([]);
        expect(interceptor.getFields(undefined, ['1', '2', '3'])).toEqual(['1', '2', '3']);
        expect(interceptor.getFields(['11', '12', '13'], undefined)).toEqual(['11', '12', '13']);

        expect(interceptor.getFields(['1', '2', '3'], ['1', '3'])).toEqual(['1', '3']);
        expect(interceptor.getFields(['1', '2', '3'], ['4', '5'])).toEqual([]);
    });

    it('should be able to validate fields from entity columns', () => {
        const Interceptor = ReadOneRequestInterceptor(
            { entity: {} as typeof BaseEntity },
            {
                columns: [
                    { name: 'col1', type: 'string', isPrimary: false },
                    { name: 'col2', type: 'string', isPrimary: false },
                    { name: 'col3', type: 'string', isPrimary: false },
                ],
                logger: new CrudLogger(),
            },
        );
        const interceptor = new Interceptor();

        expect(interceptor.checkFields()).toBeUndefined();
        expect(interceptor.checkFields('col1')).toEqual(['col1']);
        expect(interceptor.checkFields(['col1', 'col2'])).toEqual(['col1', 'col2']);
        try {
            interceptor.checkFields('col');
            throw new Error('fail');
        } catch (error) {
            if (error instanceof UnprocessableEntityException) {
                expect(error.getStatus()).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
                expect(error.message).toEqual('used Invalid name col');
            } else {
                throw new TypeError('Error is not UnprocessableEntityException');
            }
        }
    });

    it('should throw when fields are invalid', () => {
        const Interceptor = ReadOneRequestInterceptor({ entity: {} as typeof BaseEntity }, { columns: [], logger: new CrudLogger() });
        const interceptor = new Interceptor();

        const invalidFieldsList = [1, [1, 2], [['col1', 'col2']], {}, [undefined], [null]];
        for (const fields of invalidFieldsList) {
            expect(() => {
                interceptor.checkFields(fields);
            }).toThrowError(UnprocessableEntityException);
        }
    });

    it('should get relations from custom request options and crudOption', async () => {
        const Interceptor = ReadOneRequestInterceptor({ entity: {} as typeof BaseEntity }, { logger: new CrudLogger() });
        const interceptor = new Interceptor();

        const mockRequest: any = jest.fn();
        mockRequest[CUSTOM_REQUEST_OPTIONS] = { relations: ['foo'] };

        await interceptor.intercept(new ExecutionContextHost([mockRequest]), handler);
        expect(mockRequest[CRUD_ROUTE_ARGS]).toHaveProperty('relations', ['foo']);

        const InterceptorNoRelations = ReadOneRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { [Method.READ_ONE]: { relations: false } } },
            { logger: new CrudLogger() },
        );
        const interceptorNoRelations = new InterceptorNoRelations();

        const mockRequestNoRelations: any = jest.fn();
        mockRequestNoRelations[CUSTOM_REQUEST_OPTIONS] = {};

        await interceptorNoRelations.intercept(new ExecutionContextHost([mockRequestNoRelations]), handler);
        expect(mockRequestNoRelations[CRUD_ROUTE_ARGS]).toHaveProperty('relations', []);

        const InterceptorWithRelations = ReadOneRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { [Method.READ_ONE]: { relations: ['bar'] } } },
            { logger: new CrudLogger() },
        );
        const interceptorWithRelations = new InterceptorWithRelations();

        const mockRequestWithRelations: any = jest.fn();
        mockRequestWithRelations[CUSTOM_REQUEST_OPTIONS] = {};

        await interceptorWithRelations.intercept(new ExecutionContextHost([mockRequestWithRelations]), handler);
        expect(mockRequestWithRelations[CRUD_ROUTE_ARGS]).toHaveProperty('relations', ['bar']);
    });
});
