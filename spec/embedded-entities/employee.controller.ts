import { Controller } from '@nestjs/common';

import { EmployeeEntity } from './employee.entity';
import { EmployeeService } from './employee.service';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudController } from '../../src/lib/interface';

@Crud({
    entity: EmployeeEntity,
})
@Controller('employee')
export class EmployeeController implements CrudController<EmployeeEntity> {
    constructor(public readonly crudService: EmployeeService) {}
}
