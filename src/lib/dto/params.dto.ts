import { mixin } from '@nestjs/common';
import { PickType } from '@nestjs/swagger';
import { BaseEntity } from 'typeorm';

export function CreateParamsDto(parentClass: typeof BaseEntity, keys: Array<keyof BaseEntity>) {
    class ParamsDto extends PickType(parentClass, keys) {}
    return mixin(ParamsDto);
}
