import { BaseEntity } from 'typeorm';

import { CrudService } from '../crud.service';

export interface CrudController<T extends BaseEntity> {
    crudService: CrudService<T>;
}
