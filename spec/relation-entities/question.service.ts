import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QuestionEntity } from './question.entity';
import { CrudService } from '../../src/lib/crud.service';

@Injectable()
export class QuestionService extends CrudService<QuestionEntity> {
    constructor(@InjectRepository(QuestionEntity) repository: Repository<QuestionEntity>) {
        super(repository);
    }
}
