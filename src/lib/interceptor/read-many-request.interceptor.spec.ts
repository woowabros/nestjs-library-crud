/* eslint-disable @typescript-eslint/naming-convention */
import { CallHandler, NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsEmpty } from 'class-validator';
import { of } from 'rxjs';
import { BaseEntity } from 'typeorm';

import { CustomReadManyRequestOptions } from './custom-request.interceptor';
import { ReadManyRequestInterceptor } from './read-many-request.interceptor';
import { CUSTOM_REQUEST_OPTIONS } from '../constants';
import { ExecutionContextHost } from '../provider';
import { CrudLogger } from '../provider/crud-logger';

describe('ReadManyRequestInterceptor', () => {
    it('should intercept and pass CrudReadManyRequest', () => {
        const handler: CallHandler = {
            handle: () => of('test'),
        };
        const Interceptor = ReadManyRequestInterceptor(
            { entity: {} as typeof BaseEntity },
            {
                columns: [{ name: 'col1', type: 'string', isPrimary: false }],
                relations: [],
                primaryKeys: [{ name: 'col1', type: 'string' }],
                logger: new CrudLogger(),
            },
        );
        const interceptor = new Interceptor();

        expect(interceptor).toBeDefined();
        expect(async () => {
            await interceptor.intercept(new ExecutionContextHost([{ [CUSTOM_REQUEST_OPTIONS]: {} }]), handler);
        }).not.toThrow();
    });

    it('should be able to fields validation from entity columns', async () => {
        type InterceptorType = NestInterceptor<any, any> & {
            validateQuery: (query: Record<string, unknown>) => unknown;
        };
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

        const Interceptor = ReadManyRequestInterceptor({ entity: QueryDto }, { relations: [], logger: new CrudLogger() });
        const interceptor = new Interceptor() as InterceptorType;

        expect(await interceptor.validateQuery(undefined as any)).toEqual({});
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

        // should be able to ignore limit and offset
        expect(await interceptor.validateQuery({ col1: 1, col2: 2, limit: 3 })).toEqual({
            col1: '1',
            col2: 2,
        });
        expect(await interceptor.validateQuery({ col1: 1, col2: 2, offset: 10 })).toEqual({
            col1: '1',
            col2: 2,
        });
        expect(await interceptor.validateQuery({ col1: 1, col2: 2, limit: 3, offset: 10 })).toEqual({
            col1: '1',
            col2: 2,
        });
    });

    it('should be get relation values per each condition', () => {
        type InterceptorType = NestInterceptor<any, any> & {
            getRelations: (customReadManyRequestOptions: CustomReadManyRequestOptions) => string[];
        };
        const Interceptor = ReadManyRequestInterceptor({ entity: {} as typeof BaseEntity }, { relations: [], logger: new CrudLogger() });
        const interceptor = new Interceptor() as InterceptorType;

        expect(interceptor.getRelations({ relations: [] })).toEqual([]);
        expect(interceptor.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptor.getRelations({})).toEqual([]);

        const InterceptorWithOptions = ReadManyRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { readMany: { relations: ['option'] } } },
            { relations: [], logger: new CrudLogger() },
        );
        const interceptorWithOptions = new InterceptorWithOptions() as InterceptorType;
        expect(interceptorWithOptions.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithOptions.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithOptions.getRelations({})).toEqual(['option']);

        const InterceptorWithFalseOptions = ReadManyRequestInterceptor(
            { entity: {} as typeof BaseEntity, routes: { readMany: { relations: false } } },
            { relations: [], logger: new CrudLogger() },
        );
        const interceptorWithFalseOptions = new InterceptorWithFalseOptions() as InterceptorType;
        expect(interceptorWithFalseOptions.getRelations({ relations: [] })).toEqual([]);
        expect(interceptorWithFalseOptions.getRelations({ relations: ['table'] })).toEqual(['table']);
        expect(interceptorWithFalseOptions.getRelations({})).toEqual([]);
    });
});
