import { ApiProperty } from '@nestjs/swagger';

export class AdditionalBaseInfo {
    @ApiProperty()
    color: string;
}
