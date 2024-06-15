import { PickType } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchFirstCursorDto extends PickType(RequestSearchDto, ['select', 'where', 'order', 'withDeleted', 'take']) {
    static getExample(): RequestSearchFirstCursorDto {
        return {
            select: ['field1'] as Array<keyof Partial<unknown>>,
            where: [{ field1: { operator: '=', operand: 'value', not: true } }],
            order: { field1: 'ASC' },
            withDeleted: false,
            take: 20,
        };
    }
}
