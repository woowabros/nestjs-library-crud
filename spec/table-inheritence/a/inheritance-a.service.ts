import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InheritanceEntityA } from './inheritance-a-entity';
import { CrudService } from '../../../src';

@Injectable()
export class InheritanceServiceA extends CrudService<InheritanceEntityA> {
    constructor(@InjectRepository(InheritanceEntityA) repository: Repository<InheritanceEntityA>) {
        super(repository);
    }
}
