import { OmitType } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchFirstCursorDto extends OmitType(RequestSearchDto, ['nextCursor']) {
    static getExample(): RequestSearchFirstCursorDto {
        return {
            select: ['field1'] as Array<keyof Partial<unknown>>,
            where: [{ field: 'field1', operator: 'eq', operand: 'value', not: true }],
            order: { field1: 'ASC' },
            withDeleted: false,
            take: 20,
        };
    }
}
