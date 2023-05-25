import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CrudService } from '../../src/lib/crud.service';
import { CrudCreateRequest, CrudDeleteOneRequest } from '../../src/lib/interface/request.interface';
import { BaseEntity } from '../base/base.entity';

@Injectable()
export class CustomServiceService extends CrudService<BaseEntity> {
    constructor(@InjectRepository(BaseEntity) repository: Repository<BaseEntity>) {
        super(repository);
    }

    newCreate(params: CrudCreateRequest<BaseEntity>) {
        return {
            payload: params,
            result: 'ok',
        };
    }

    newDelete(params: CrudDeleteOneRequest<BaseEntity>) {
        return {
            payload: params,
            result: 'ok',
        };
    }
}
