import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CustomEntity } from './custom-entity.entity';
import { CrudService } from '../../src/lib/crud.service';

@Injectable()
export class CustomEntityService extends CrudService<CustomEntity> {
    constructor(@InjectRepository(CustomEntity) repository: Repository<CustomEntity>) {
        super(repository);
    }

    async getAll(): Promise<CustomEntity[]> {
        const entities = await this.repository.find();
        return entities;
    }
}
