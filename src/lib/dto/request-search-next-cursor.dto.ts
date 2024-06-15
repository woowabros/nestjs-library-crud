import { PickType } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchNextCursorDto extends PickType(RequestSearchDto, ['nextCursor', 'take']) {
    static getExample(): RequestSearchNextCursorDto {
        return {
            take: 20,
            nextCursor: 'next_cursor',
        };
    }
}
