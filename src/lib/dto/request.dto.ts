/* eslint-disable max-classes-per-file */
import { mixin, Type } from '@nestjs/common';
import { PickType } from '@nestjs/swagger';
import { getMetadataStorage, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata';

import { capitalizeFirstLetter } from '../capitalize-first-letter';
import { EntityType, Method } from '../interface';

export function CreateRequestDto(parentClass: EntityType, group: Method) {
    const propertyNamesAppliedValidation = getPropertyNamesFromMetadata(parentClass, group);

    class PickClass extends PickType(parentClass as Type<EntityType>, propertyNamesAppliedValidation as Array<keyof EntityType>) {}
    const requestDto = mixin(PickClass);
    Object.defineProperty(requestDto, 'name', {
        value: `${capitalizeFirstLetter(group)}${parentClass.name}Dto`,
    });

    return requestDto;
}

export function getPropertyNamesFromMetadata(parentClass: EntityType, group: Method): string[] {
    const metadataStorage: MetadataStorage = getMetadataStorage();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const getTargetValidationMetadatasArgs = [parentClass, null!, false, false];
    const targetMetadata: ReturnType<typeof metadataStorage.getTargetValidationMetadatas> = (
        metadataStorage.getTargetValidationMetadatas as (...args: unknown[]) => ValidationMetadata[]
    )(...getTargetValidationMetadatasArgs);

    const propertyNamesAppliedValidation = [
        ...new Set(
            targetMetadata
                .filter(({ groups, always }) => always === true || (groups ?? []).includes(group))
                .map(({ propertyName }) => propertyName),
        ),
    ];
    return propertyNamesAppliedValidation;
}
