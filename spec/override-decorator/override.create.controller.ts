import { Controller } from '@nestjs/common';

import { AddCurrentTimeInterceptor } from './add-current-time.interceptor';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudRouteArgs } from '../../src/lib/crud.route.args.decorator';
import { UpdateRequestInterceptor } from '../../src/lib/interceptor/update-request.interceptor';
import { CrudController, CrudUpdateOneRequest } from '../../src/lib/interface';
import { Override } from '../../src/lib/override.decorator';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Crud({
    entity: BaseEntity,
    routes: {
        update: {
            interceptors: [UpdateRequestInterceptor, AddCurrentTimeInterceptor],
            author: {
                property: 'updatedBy',
                value: 'user',
            },
        },
    },
})
@Controller('test')
export class OverrideCreateController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}

    @Override('CREATE')
    overrideCreate() {
        return { result: 'createOne' };
    }

    @Override('UPDATE')
    overrideUpdate(@CrudRouteArgs() crudUpdateOneRequest: CrudUpdateOneRequest<BaseEntity>) {
        return { ...crudUpdateOneRequest, result: 'updateOne' };
    }

    search() {
        return { result: 'search' };
    }
}
