# @nestjs-library/crud

NestJS + TypeOrm 기반으로 CRUD를 자동으로 생성합니다.

이 라이브러리는 단순한 Entity가 제공하는 CRUD API를 자동으로 제공함으로써,
반복 작업을 줄여 생산성을 높이기 위해 만들어졌습니다.

### Usage

Import the `Crud` decorator from `@nestjs-library/crud` and use it like so:

```
# my.controller.ts
import { Crud, CrudController } from '@nestjs-library/crud'

@Crud({
    entity: MyEntity
})
@Controller()
export class MyController implements CrudController<MyEntity> {
    constructor(public readonly crudService: myService) {}
}

# my.service.ts
import { CrudService } from '@nestjs-library/crud'
@Injectable()
export class MyService extends CrudService<MyEntity> {
    constructor(@InjectRepository(MyEntity) repository: Repository<MyEntity>) {
        super(repository);
    }
}
```

#### 스키매틱을 이용하는 경우

1. TODO 스키매틱

#### 직접 작성하는 경우

1. `Entity`를 만드세요.
2. CrudService를 상속받아 `Service`를 만드세요.
3. CrudController 상속받아 `Controller`를 만들어고 `@Crud` 데코레이터를 선언합니다.
4. Module에 만들어진 Controller와 Provider를 추가합니다.

---

### FAQ

#### 사용자 권한에 따라 Endpoint를 제공해야 합니다.

1. Guard Decorator를 생성합니다.
2. Crud Decorator에 옵션으로 추가합니다.
    > test case `auth-guard`를 참고할 수 있습니다.

#### 사용자의 권한에 따라 전달할 수 있는 정보를 관리할 수 있어야 합니다.

1. `CrudCustomRequestInterceptor를 상속`받아 Request Interceptor를 생성합니다.
2. `overrideOptions` method를 override하여 Request Option을 수정해서 전달합니다.
3. Crud Decorator에 옵션으로 추가합니다.
    > test case `request-interceptor`를 참고할 수 있습니다.

#### Response 결과를 변경해야 합니다.

1. Request Interceptor를 만들고 Response 결과를 가공합니다.
2. Crud Decorator에 옵션으로 추가합니다.
    > test case `response-interceptor`를 참고할 수 있습니다.

#### 기본으로 제공되는 Swagger Decorator를 변경해야 합니다.

1. 변경하려는 Swagger Decorator를 Crud Decorator에 옵션으로 추가합니다.

### Contribution

#### Adding new Method

1. Add new Method to enum `Method`

2. Policy for new Method need to be added to `CRUD_POLICY`.

    - This policy will be used as default when no custom options provided.

3. Add an option to `CrudOptions.routes`.

    - This is an option user will provide through `@Crud()` decorator

4. Create Request Interface which extends `CrudRequestBase`

    - It will be provided to `CrudService` so that you can use it for implementation.

5. Create Interceptor via mixin

    - Recommend to validate request and process it to meet the interface of request you created step before. (for example, `read-one-request.interceptor.ts`)

6. Add new Method to `CrudAbstractService`

7. Implement feature of new Method in `CrudService`
