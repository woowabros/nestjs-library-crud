import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';

import { RequestSearchDto } from './request-search.dto';

export class RequestSearchOffsetDto extends OmitType(RequestSearchDto, ['take']) {
    @ApiPropertyOptional({ description: 'limit', type: Number, default: 20 })
    limit?: number;

    @ApiPropertyOptional({ description: 'offset', type: Number, default: 0 })
    offset?: number;
}
