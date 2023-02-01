import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class RequestFieldsDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
    @IsString({ each: true })
    fields: string[];
}
