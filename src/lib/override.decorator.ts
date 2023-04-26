import { OVERRIDE_METHOD_METADATA } from './constants';
import { Method } from './interface';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Override = (name: keyof typeof Method) => (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(OVERRIDE_METHOD_METADATA, name, target[key]);
    return descriptor;
};
