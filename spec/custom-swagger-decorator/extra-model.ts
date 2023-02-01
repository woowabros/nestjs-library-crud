import { ApiProperty } from '@nestjs/swagger';

export class ExtraModel {
    @ApiProperty({ description: 'id' })
    id: string;
}
