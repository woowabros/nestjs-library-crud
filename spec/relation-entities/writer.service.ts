import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WriterEntity } from './writer.entity';
import { CrudService } from '../../src/lib/crud.service';

@Injectable()
export class WriterService extends CrudService<WriterEntity> {
    constructor(@InjectRepository(WriterEntity) repository: Repository<WriterEntity>) {
        super(repository);
    }
}
