import { PickType } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchNextCursorDto extends PickType(RequestSearchDto, ['nextCursor']) {
    static getExample(): RequestSearchNextCursorDto {
        return {
            nextCursor: 'next_cursor',
        };
    }
}
