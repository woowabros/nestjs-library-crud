import { NestInterceptor, UnprocessableEntityException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseEntity } from 'typeorm';

import { CreateRequestInterceptor } from './create-request.interceptor';
import { CrudLogger } from '../provider/crud-logger';

type InterceptorType = NestInterceptor<any, any> & { validateBody: (body: unknown) => Promise<unknown> };
describe('CreateRequestInterceptor', () => {
    class BodyDto extends BaseEntity {
        @IsString({ groups: ['create'] })
        @IsNotEmpty({ groups: ['create'] })
        @Type(() => String)
        col1: string;

        @IsNumber(undefined, { groups: ['create'] })
        @IsNotEmpty({ groups: ['create'] })
        @Type(() => Number)
        col2: number;

        @IsNumber(undefined, { groups: ['update'] })
        @IsNotEmpty({ groups: ['update'] })
        @IsEmpty({ groups: ['create'] })
        @Type(() => Number)
        col3: number;
    }

    it('should intercepts and validate body', async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const Interceptor = CreateRequestInterceptor({ entity: BodyDto }, { relations: [], logger: new CrudLogger() });
        const interceptor = new Interceptor() as InterceptorType;
        expect(await interceptor.validateBody({ col1: 1, col2: '2' })).toEqual({ col1: '1', col2: 2 });
        expect(await interceptor.validateBody({ col1: 1, col2: 2 })).toEqual({ col1: '1', col2: 2 });

        await expect(interceptor.validateBody({ col1: 1 })).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateBody({ col2: '1' })).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateBody({ col1: 1, col2: '2', col3: 1 })).rejects.toThrow(UnprocessableEntityException);
    });

    it('should intercepts and validate body which is array', async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const Interceptor = CreateRequestInterceptor({ entity: BodyDto }, { relations: [], logger: new CrudLogger() });
        const interceptor = new Interceptor() as InterceptorType;
        expect(
            await interceptor.validateBody([
                { col1: 1, col2: '2' },
                { col1: 100, col2: 200 },
            ]),
        ).toEqual([
            { col1: '1', col2: 2 },
            { col1: '100', col2: 200 },
        ]);

        await expect(interceptor.validateBody([{ col1: 1, col2: '2' }, { col1: 1 }])).rejects.toThrow(UnprocessableEntityException);
        await expect(interceptor.validateBody([{ col1: 1, col2: '2' }, { col2: '1' }])).rejects.toThrow(UnprocessableEntityException);
        await expect(
            interceptor.validateBody([
                { col1: 1, col2: '2' },
                { col1: 1, col2: '2', col3: 1 },
            ]),
        ).rejects.toThrow(UnprocessableEntityException);
    });
});
