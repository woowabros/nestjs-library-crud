import { PickType } from '@nestjs/swagger';

import { RequestSearchOffsetDto } from './request-search-offset.dto';

export class RequestSearchNextOffsetDto extends PickType(RequestSearchOffsetDto, ['limit', 'offset', 'nextCursor'] as const) {
    static getExample(): RequestSearchNextOffsetDto {
        return {
            limit: 20,
            offset: 20,
            nextCursor: 'next_cursor',
        };
    }
}
