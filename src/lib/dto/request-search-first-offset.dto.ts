import { OmitType } from '@nestjs/swagger';

import { RequestSearchOffsetDto } from './request-search-offset.dto';

export class RequestSearchFirstOffsetDto extends OmitType(RequestSearchOffsetDto, ['nextCursor']) {
    static getExample(): RequestSearchFirstOffsetDto {
        return {
            select: ['field1'] as Array<keyof Partial<unknown>>,
            where: [{ field: 'field1', operator: 'eq', operand: 'value', not: true }],
            order: { field1: 'ASC' },
            withDeleted: false,
            limit: 20,
            offset: 0,
        };
    }
}
