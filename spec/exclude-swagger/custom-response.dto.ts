import { ApiProperty } from '@nestjs/swagger';

export class CustomResponseDto {
    @ApiProperty()
    name: string;
}
