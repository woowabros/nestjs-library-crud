import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { CrudService } from '../../src/lib/crud.service';

@Injectable()
export class MultiplePrimaryKeyService extends CrudService<MultiplePrimaryKeyEntity> {
    constructor(@InjectRepository(MultiplePrimaryKeyEntity) repository: Repository<MultiplePrimaryKeyEntity>) {
        super(repository);
    }

    async getAll(): Promise<MultiplePrimaryKeyEntity[]> {
        const entities = await this.repository.find();
        return entities;
    }
}
