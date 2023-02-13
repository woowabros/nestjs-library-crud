import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DepthOneEntity } from './depth-one.entity';
import { CrudService } from '../../src/lib/crud.service';

@Injectable()
export class DepthOneService extends CrudService<DepthOneEntity> {
    constructor(@InjectRepository(DepthOneEntity) repository: Repository<DepthOneEntity>) {
        super(repository);
    }
}
