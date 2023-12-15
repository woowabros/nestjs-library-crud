import { Type, mixin } from '@nestjs/common';
import { PickType } from '@nestjs/swagger';

import { EntityType } from '../interface';

export function CreateParamsDto(parentClass: EntityType, keys: Array<keyof EntityType>) {
    class ParamsDto extends PickType(parentClass as Type<EntityType>, keys) {}
    return mixin(ParamsDto);
}
