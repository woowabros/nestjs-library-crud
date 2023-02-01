import { BaseEntity } from 'typeorm';

import { CrudAbstractService } from '../abstract/crud.abstract.service';

export interface CrudController<T extends BaseEntity> {
    crudService: CrudAbstractService<T>;
}
