import { CrudRouteFactory } from './crud.route.factory';
import { CrudOptions } from './interface';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Crud =
    (options: CrudOptions) =>
    (target: unknown): void => {
        const crudRouteFactory = new CrudRouteFactory(target, options);
        crudRouteFactory.init();
    };
