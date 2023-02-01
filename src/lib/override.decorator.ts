import { Constants } from './constants';
import { Method } from './interface';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Override = (name: keyof typeof Method) => (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(Constants.OVERRIDE_METHOD_METADATA, name, target[key]);
    return descriptor;
};
