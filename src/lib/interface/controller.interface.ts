import type { EntityType } from '.';
import type { CrudService } from '../crud.service';

export interface CrudController<T extends EntityType> {
    crudService: CrudService<T>;
}
