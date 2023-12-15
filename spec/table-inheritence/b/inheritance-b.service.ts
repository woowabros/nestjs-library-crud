import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InheritanceEntityB } from './inheritance-b-entity';
import { CrudService } from '../../../src';

@Injectable()
export class InheritanceServiceB extends CrudService<InheritanceEntityB> {
    constructor(@InjectRepository(InheritanceEntityB) repository: Repository<InheritanceEntityB>) {
        super(repository);
    }
}
