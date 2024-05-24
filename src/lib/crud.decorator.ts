import { CrudRouteFactory } from './crud.route.factory';
import { CrudService } from './crud.service';
import { CrudOptions } from './interface';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Crud =
    (options: CrudOptions) =>
    <T extends { new (...args: any[]): any }>(target: T) => {
        const crudRouteFactory = new CrudRouteFactory(target, options);
        crudRouteFactory.init();

        return class extends target {
            constructor(...args: any[]) {
                super(...args);
                if (!(this.crudService instanceof CrudService)) {
                    throw new TypeError('controller should include member crudService, which is instance of CrudService');
                }
            }
        };
    };
