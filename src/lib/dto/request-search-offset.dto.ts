import { ApiPropertyOptional } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchOffsetDto<T> extends RequestSearchDto<T> {
    @ApiPropertyOptional({ description: 'limit', type: Number, default: 20 })
    limit?: number;

    @ApiPropertyOptional({ description: 'offset', type: Number })
    offset?: number;
}
