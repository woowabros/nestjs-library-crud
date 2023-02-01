export const capitalizeFirstLetter = (raw: string) => `${raw.charAt(0).toUpperCase()}${raw.slice(1)}`;

export const isSomeEnum =
    <TEnum extends Record<string, unknown>>(enumType: TEnum) =>
    (token: unknown): token is TEnum[keyof TEnum] =>
        Object.values(enumType).includes(token as TEnum[keyof TEnum]);
