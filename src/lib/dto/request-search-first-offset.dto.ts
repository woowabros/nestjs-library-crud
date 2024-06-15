import { PickType } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchFirstOffsetDto extends PickType(RequestSearchDto, [
    'select',
    'where',
    'order',
    'withDeleted',
    'limit',
    'offset',
]) {
    static getExample(): RequestSearchFirstOffsetDto {
        return {
            select: ['field1'] as Array<keyof Partial<unknown>>,
            where: [{ field1: { operator: '=', operand: 'value', not: true } }],
            order: { field1: 'ASC' },
            withDeleted: false,
            limit: 20,
            offset: 0,
        };
    }
}
