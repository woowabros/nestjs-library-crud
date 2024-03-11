import { ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from '../base/base.entity';

export class UpdateRequestDto implements Partial<BaseEntity> {
    @ApiPropertyOptional({ description: 'optional name', type: String })
    name: string;
}
