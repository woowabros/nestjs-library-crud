import { Logger, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import _ from 'lodash';
import { BaseEntity } from 'typeorm';

import { CreateParamsDto } from '../dto/params.dto';
import { Column, GROUP } from '../interface';

export abstract class RequestAbstractInterceptor {
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
            Logger.error(`Invalid query params: ${invalidColumns.toLocaleString()}`);
            throw exception;
        }
        const transformed = plainToClass(CreateParamsDto(entity, paramsKey as unknown as Array<keyof BaseEntity>), params);
        const errorList = await validate(transformed, { groups: [GROUP.PARAMS] });
        if (errorList.length > 0) {
            throw exception;
        }
        return Object.assign({}, transformed);
    }
}
