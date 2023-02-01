import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CategoryEntity } from './category.entity';
import { CrudService } from '../../src/lib/crud.service';

@Injectable()
export class CategoryService extends CrudService<CategoryEntity> {
    constructor(@InjectRepository(CategoryEntity) repository: Repository<CategoryEntity>) {
        super(repository);
    }
}
