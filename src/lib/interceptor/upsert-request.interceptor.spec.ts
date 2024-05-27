/* eslint-disable @typescript-eslint/naming-convention */
import { NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseEntity } from 'typeorm';

import { UpsertRequestInterceptor } from './upsert-request.interceptor';
import { CrudLogger } from '../provider/crud-logger';

type InterceptorType = NestInterceptor<any, any> & { validateBody: (body: unknown) => Promise<unknown> };
describe('UpsertRequestInterceptor', () => {
    it('should be not include value of primary key', async () => {
        class BodyDto extends BaseEntity {
            @IsString({ groups: ['create'] })
            @IsNotEmpty({ groups: ['create'] })
            @Type(() => String)
            col1: string;

            @IsNumber(undefined, { groups: ['upsert'] })
            @IsNotEmpty({ groups: ['upsert'] })
            @Type(() => Number)
            col2: number;

            @IsNumber(undefined, { groups: ['create'] })
            @IsNotEmpty({ groups: ['create'] })
            @IsEmpty({ groups: ['update'] })
            @Type(() => Number)
            col3: number;
        }

        const Interceptor = UpsertRequestInterceptor(
            { entity: BodyDto },
            { primaryKeys: [{ name: 'col1', type: 'string' }], relations: [], logger: new CrudLogger() },
        );
        const interceptor = new Interceptor() as InterceptorType;

        await expect(interceptor.validateBody({ col1: 1, col2: 2 })).rejects.toThrow(
            new UnprocessableEntityException('Cannot include value of primary key'),
        );
        expect(await interceptor.validateBody({ col2: 2 })).toEqual({ col2: 2 });
    });

    it('should intercepts and validate body', async () => {
        class BodyDto extends BaseEntity {
            @IsString({ groups: ['upsert', 'create'] })
            @IsNotEmpty({ groups: ['upsert', 'create'] })
            @Type(() => String)
            col1: string;

            @IsNumber(undefined, { groups: ['upsert', 'create'] })
            @IsNotEmpty({ groups: ['upsert', 'create'] })
            @Type(() => Number)
            col2: number;

            @IsNumber(undefined, { groups: ['create'] })
            @IsNotEmpty({ groups: ['create'] })
            @IsEmpty({ groups: ['upsert'] })
            @Type(() => Number)
            col3: number;
        }
        const Interceptor = UpsertRequestInterceptor({ entity: BodyDto }, { primaryKeys: [], relations: [], logger: new CrudLogger() });
        const interceptor = new Interceptor() as InterceptorType;
        expect(await interceptor.validateBody({ col1: 1, col2: '2' })).toEqual({
            col1: '1',
            col2: 2,
        });

        expect(await interceptor.validateBody({ col1: 1, col2: 2 })).toEqual({
            col1: '1',
            col2: 2,
        });

        await expect(interceptor.validateBody({ col1: 1 })).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateBody({ col2: '1' })).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateBody({ col1: 1, col2: '2', col3: 1 })).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw when body is null or undefined', async () => {
        const Interceptor = UpsertRequestInterceptor(
            { entity: {} as typeof BaseEntity },
            { primaryKeys: [], relations: [], logger: new CrudLogger() },
        );
        const interceptor = new Interceptor() as InterceptorType;

        await expect(interceptor.validateBody(null)).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateBody(undefined)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw when body is not object', async () => {
        const Interceptor = UpsertRequestInterceptor(
            { entity: {} as typeof BaseEntity },
            { primaryKeys: [], relations: [], logger: new CrudLogger() },
        );
        const interceptor = new Interceptor() as InterceptorType;

        await expect(interceptor.validateBody(1)).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateBody('')).rejects.toThrow(UnprocessableEntityException);
    });
});
