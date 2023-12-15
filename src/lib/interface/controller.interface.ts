import { EntityType } from '.';
import { CrudService } from '../crud.service';

export interface CrudController<T extends EntityType> {
    crudService: CrudService<T>;
}
