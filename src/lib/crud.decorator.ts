/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any */
import { CrudRouteFactory } from './crud.route.factory';
import { CrudService } from './crud.service';

import type { CrudOptions } from './interface';

type Constructor = new (...args: any[]) => any;

export const Crud =
    (options: CrudOptions) =>
    <T extends Constructor>(target: T) => {
        const crudRouteFactory = new CrudRouteFactory(target, options);
        crudRouteFactory.init();

        const ValidatedController = class extends target {
            constructor(...args: any[]) {
                super(...args);
                if (!(this.crudService instanceof CrudService)) {
                    throw new TypeError('controller should include member crudService, which is instance of CrudService');
                }
            }
        };
        Object.defineProperty(ValidatedController, 'name', { value: target.name });
        return ValidatedController;
    };
