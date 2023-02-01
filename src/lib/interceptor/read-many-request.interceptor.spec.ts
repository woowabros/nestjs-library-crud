/* eslint-disable @typescript-eslint/naming-convention */
import { CallHandler, UnprocessableEntityException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsEmpty } from 'class-validator';
import { of } from 'rxjs';
import { BaseEntity } from 'typeorm';

import { ReadManyRequestInterceptor } from './read-many-request.interceptor';
import { Constants } from '../constants';
import { PaginationType } from '../interface';
import { ExecutionContextHost } from '../provider';

describe('ReadManyRequestInterceptor', () => {
    it('should intercept and pass CrudReadManyRequest', () => {
        const handler: CallHandler = {
            handle: () => of('test'),
        };
        const Interceptor = ReadManyRequestInterceptor(
            { entity: {} as typeof BaseEntity },
            {
                columns: [{ name: 'col1', type: 'string', isPrimary: false }],
                primaryKeys: [{ name: 'col1', type: 'string' }],
            },
        );
        const interceptor = new Interceptor();

        expect(interceptor).toBeDefined();
        expect(async () => {
            await interceptor.intercept(new ExecutionContextHost([{ [Constants.CUSTOM_REQUEST_OPTIONS]: {} }]), handler);
        }).not.toThrowError();
    });

    it('should be able to return pagination for GET_MORE type', () => {
        const Interceptor = ReadManyRequestInterceptor({ entity: {} as typeof BaseEntity }, {});
        const interceptor = new Interceptor();

        expect(interceptor.getPaginationRequest(PaginationType.CURSOR, { key: 'value', nextCursor: 'token' })).toEqual({
            token: 'token',
            type: 'cursor',
        });
    });

    it('should be able to fields validation from entity columns', async () => {
        class QueryDto extends BaseEntity {
            @IsString({ groups: ['readMany'] })
            @IsNotEmpty({ groups: ['readMany'] })
            @Type(() => String)
            col1: string;

            @IsNumber(undefined, { groups: ['readMany'] })
            @IsNotEmpty({ groups: ['readMany'] })
            @Type(() => Number)
            col2: number;

            @IsNumber(undefined, { groups: ['update'] })
            @IsNotEmpty({ groups: ['update'] })
            @IsEmpty({ groups: ['readMany'] })
            @Type(() => Number)
            col3: number;
        }

        const Interceptor = ReadManyRequestInterceptor({ entity: QueryDto }, {});
        const interceptor = new Interceptor();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(await interceptor.validateQuery(undefined as any)).toBeUndefined();
        expect(await interceptor.validateQuery({ col1: 1, col2: '2' })).toEqual({
            col1: '1',
            col2: 2,
        });
        expect(await interceptor.validateQuery({ col1: 1, col2: 2 })).toEqual({
            col1: '1',
            col2: 2,
        });

        await expect(interceptor.validateQuery({ col1: 1 })).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateQuery({ col2: '1' })).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateQuery({ col1: 1, col2: '2', col3: 1 })).rejects.toThrow(UnprocessableEntityException);
    });

    it('should be get relation values per each condition', () => {
        const Interceptor = ReadManyRequestInterceptor({ entity: {} as typeof BaseEntity }, {});
        const interceptor = new Interceptor();

        expect(interceptor.getRelations({ relations: [] })).toEqual([]);
        expect(interceptor.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptor.getRelations({})).toBeUndefined();

        const InterceptorWithOptions = ReadManyRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { readMany: { relations: ['option'] } } },
            {},
        );
        const interceptorWithOptions = new InterceptorWithOptions();
        expect(interceptorWithOptions.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithOptions.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithOptions.getRelations({})).toEqual(['option']);

        const InterceptorWithFalseOptions = ReadManyRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { readMany: { relations: false } } },
            {},
        );
        const interceptorWithFalseOptions = new InterceptorWithFalseOptions();
        expect(interceptorWithFalseOptions.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithFalseOptions.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithFalseOptions.getRelations({})).toEqual([]);
    });

    it('should be validate pagination query', () => {
        const Interceptor = ReadManyRequestInterceptor({ entity: {} as typeof BaseEntity }, {});
        const interceptor = new Interceptor();

        interceptor.getPaginationRequest(PaginationType.CURSOR, undefined as any);
        expect(() => interceptor.getPaginationRequest(PaginationType.CURSOR, { nextCursor: 3 })).toThrowError(UnprocessableEntityException);

        interceptor.getPaginationRequest(PaginationType.OFFSET, undefined as any);
        expect(() => interceptor.getPaginationRequest(PaginationType.OFFSET, { limit: 200 })).toThrowError(UnprocessableEntityException);
    });
});
