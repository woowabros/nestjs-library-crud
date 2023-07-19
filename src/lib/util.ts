export const capitalizeFirstLetter = (raw: string) => `${raw.charAt(0).toUpperCase()}${raw.slice(1)}`;

export const isSomeEnum =
    <TEnum extends Record<string, unknown>>(enumType: TEnum) =>
    (nextCursor: unknown): nextCursor is TEnum[keyof TEnum] =>
        Object.values(enumType).includes(nextCursor as TEnum[keyof TEnum]);
