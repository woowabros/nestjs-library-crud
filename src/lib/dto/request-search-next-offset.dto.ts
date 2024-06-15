import { PickType } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchNextOffsetDto extends PickType(RequestSearchDto, ['limit', 'offset', 'nextCursor'] as const) {
    static getExample(): RequestSearchNextOffsetDto {
        return {
            limit: 20,
            offset: 20,
            nextCursor: 'next_cursor',
        };
    }
}
