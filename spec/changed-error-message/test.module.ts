/* eslint-disable max-classes-per-file */
import {
    ArgumentsHost,
    Catch,
    ConflictException,
    Controller,
    ExceptionFilter,
    HttpException,
    Injectable,
    Module,
    UseFilters,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString } from 'class-validator';
import { Response } from 'express';
import { Entity, BaseEntity, Repository, PrimaryColumn, Column, Index } from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController, GROUP, Method } from '../../src/lib/interface';

@Catch(ConflictException)
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly message: string) {}
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();

        response.status(status).json({
            statusCode: status,
            message: this.message,
        });
    }
}

@Entity('test')
export class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsString({ always: true })
    @IsOptional({ groups: [GROUP.READ_MANY] })
    uuid: string;

    @Column()
    @Index({ unique: true })
    @IsString({ always: true })
    @IsOptional({ groups: [GROUP.READ_MANY] })
    name: string;
}

@Injectable()
export class TestService extends CrudService<TestEntity> {
    constructor(@InjectRepository(TestEntity) repository: Repository<TestEntity>) {
        super(repository);
    }
}

@Crud({
    entity: TestEntity,
    only: ['create', 'readMany'],
    routes: {
        [Method.CREATE]: {
            decorators: [UseFilters(new HttpExceptionFilter('custom error message'))],
        },
    },
})
@Controller('base')
export class TestController implements CrudController<TestEntity> {
    constructor(public readonly crudService: TestService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([TestEntity])],
    controllers: [TestController],
    providers: [TestService],
})
export class TestModule {}
