import { ApiPropertyOptional } from '@nestjs/swagger';

import { Sort } from '../interface';
import { QueryFilter, operators } from '../interface/query-operation.interface';

export class RequestSearchDto<T> {
    @ApiPropertyOptional({ description: 'select fields', isArray: true, type: String })
    select?: Array<keyof Partial<T>>;

    @ApiPropertyOptional({
        description: 'where conditions',
        isArray: true,
        type: 'object',
        properties: {
            operator: {
                description: 'operator',
                type: 'string',
                enum: operators,
            },
            operand: {
                description: 'operand',
                type: 'any',
                examples: ['value', 1, true],
            },
            not: {
                description: 'not operator',
                type: 'boolean',
                example: true,
            },
        },
    })
    where?: Array<QueryFilter<T>>;

    @ApiPropertyOptional({ description: 'order', type: Object })
    order?: {
        [key in keyof Partial<T>]: Sort | `${Sort}`;
    };

    @ApiPropertyOptional({ description: 'withDeleted', type: Boolean })
    withDeleted?: boolean;

    @ApiPropertyOptional({ description: 'take', type: Number, example: 20 })
    take?: number;

    @ApiPropertyOptional({ description: 'Use to search the next page', type: String })
    nextCursor?: string;

    @ApiPropertyOptional({ description: 'limit', type: Number, default: 20 })
    limit?: number;

    @ApiPropertyOptional({ description: 'offset', type: Number, default: 0 })
    offset?: number;
}
