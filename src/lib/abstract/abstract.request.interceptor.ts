import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from 'express';
import _ from 'lodash';
import { BaseEntity } from 'typeorm';

import { CreateParamsDto } from '../dto/params.dto';
import { Author, Column, CrudOptions, GROUP, Method } from '../interface';
import { CrudLogger } from '../provider/crud-logger';

export abstract class RequestAbstractInterceptor {
    constructor(public readonly crudLogger: CrudLogger) {}

    async checkParams(
        entity: typeof BaseEntity,
        params: Record<string, string>,
        factoryColumns: Column[] = [],
        exception = new NotFoundException(),
    ): Promise<Partial<Record<keyof BaseEntity, unknown>>> {
        if (_.isNil(params)) {
            return {};
        }
        const columns = factoryColumns.map(({ name }) => name);
        const paramsKey = Object.keys(params);
        const invalidColumns = _.difference(paramsKey, columns);
        if (invalidColumns.length > 0) {
            this.crudLogger.log(`Invalid query params: ${invalidColumns.toLocaleString()}`);
            throw exception;
        }
        const transformed = plainToInstance(CreateParamsDto(entity, paramsKey as unknown as Array<keyof BaseEntity>), params);
        const errorList = await validate(transformed, { groups: [GROUP.PARAMS], forbidUnknownValues: false });
        if (errorList.length > 0) {
            this.crudLogger.log(errorList, 'ValidationError');
            throw exception;
        }
        return Object.assign({}, transformed);
    }

    getAuthor(
        request: Request | Record<string, unknown>,
        crudOptions: CrudOptions,
        method: Exclude<Method, Method.READ_MANY | Method.READ_ONE | Method.SEARCH>,
    ): Author | undefined {
        const author = crudOptions?.routes?.[method]?.author;

        if (!author) {
            return;
        }

        return {
            ...author,
            value: author.value ?? _.get(request, author.filter!, author.value),
        };
    }
}
