<p align='left'>
  <a href='./README.md'>English</a> | <a href='./README.ko.md'>한국어</a>
</p>

# @nestjs-library/crud

---

NestJS + TypeOrm 기반으로 CRUD를 자동으로 생성합니다.

이 라이브러리는 Entity가 제공하는 CRUD API를 자동으로 제공함으로써,
<br/>반복 작업을 줄여 생산성을 높이기 위해 만들어졌습니다.

---

## Install

---

<a href="https://www.npmjs.com/package/@nestjs-library/crud"> @nestjs-library/crud </a>

-   NPM

```
$ npm install @nestjs-library/crud
```

-   YARN

```
$ yarn add @nestjs-library/crud
```

## Usage

---

### Backend (NestJS)

---

Controller에 Decorator를 정의함으로서 Entity의 CRUD를 제공합니다.

```
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjs-library/crud';

import { CatService } from './cat.service';
import { CatEntity } from './entities/cat.entity';

@Crud({ entity: CatEntity })
@Controller('cat')
@ApiTags('Cat')
export class CatController implements CrudController<CatEntity> {
    constructor(public readonly crudService: CatService) {}
}

```

1. Entity를 정의합니다.

-   <a href="./src/spec/base/base.entity.ts"> base.entity.ts </a>와 같이 `CrudAbstractEntity`를 상속받거나, <a href="./src/spec/custom-entity/custom.entity.ts"> custom.entity.ts </a>와 같이 Typeorm의 `BaseEntity`를 상속받아 작성합니다.

2. Service File 생성

-   <a href="./src/spec/base/base.service.ts"> base.service.ts </a>와 같이 `CrudService<T extends BaseEntity>`를 상속받아 Service를 생성합니다.
-   1번에서 생성된 Entity의 Repository가 선언됩니다.

3. Controller File을 생성

-   <a href="./src/spec/base/base.controller.ts"> base.controller.ts </a>와 같이 `CrudController<T extends BaseEntity>`를 상속받아 Controller를 생성합니다.
-   2번에서 생성된 Service가 선언됩니다.

4. <a href="./src/spec/base/base.module.ts"> base.module.ts </a>와 같이 Module을 정의합니다.

5. RestAPI와 Swagger가 제공되는 것을 확인할 수 있습니다.

---

### Front (Request)

---

#### ReadOne

-   `Get {path}/{:id}`
-   Entity의 Key를 기반으로 `하나`의 Entity를 조회합니다.
-   params을 통해 간단한 매칭 조건을 사용할 수 있습니다.
-   <a href="./src/spec/base/base.controller.read-one.spec.ts"> base.controller.read-one.spec.ts </a> 을 참고할 수 있습니다.

---

### ReadMany

-   `Get {path}/`
-   `다수`의 Entities를 `Pagination` 형태로 전달 받습니다.
-   <a href="./src/spec/read-many/read-many.controller.spec.ts"> read-many.controller.spec.ts </a> 을 참고할 수 있습니다.

---

### Search

-   `Post {path}/search`
-   Body를 통해 조건을 직접 정의하여 조건에 일치하는 Entities를 전달 받습니다.
-   <a href="./src/spec/custom-entity/custom-entity.controller.search.spec.ts">custom-entity.controller.search.spec.ts</a>을 참고할 수 있습니다.

---

### Create

-   `Post {path}`
-   하나 또는 다수의 Entity를 생성합니다.
-   <a href="./src/spec/base/base.controller.create.spec.ts">base.controller.create.spec.ts</a> 을 참고할 수 있습니다.

---

### Update

-   `Patch {path}/{:id}`
-   하나의 Entity를 수정합니다.
-   <a href="./src/spec/base/base.controller.update.spec.ts">base.controller.update.spec.ts</a> 을 참고할 수 있습니다.

---

### Upsert

-   `Put {path}/{:id}`
-   하나의 Entity에 대해서 존재 하지 않는 경우 생성하고, 그렇지 않은 경우 수정합니다.
-   <a href="./src/spec/base/base.controller.upsert.spec.ts">base.controller.upsert.spec.ts</a> 을 참고할 수 있습니다.

---

### Delete

-   `Delete {path}/{:id}`
-   하나의 Entity를 삭제합니다.
-   <a href="./src/spec/base/base.controller.delete.spec.ts">base.controller.delete.spec.ts</a> 을 참고할 수 있습니다.

---

### Recover

-   `Post {path}/{:id}/recover`
-   Soft-delete로 삭제된 하나의 Entity를 복구합니다.
-   Delete Method의 softDeleted 옵션이 활성화 된 경우 사용됩니다.
-   <a href="./src/spec/base/base.controller.recover.spec.ts">base.controller.recover.spec.ts</a> 을 참고할 수 있습니다.

---

## Use Case

### Response로 전달되는 값을 설정할 수 있습니다.

---

Decorator Option으로 route 마다 `response`를 변경 할 수 있습니다.

entity(default), id, none 3가지 옵션을 제공합니다.

```
@Crud({ entity: BaseEntity, routes: { recover: { response: 'id' } } })
```

---

### 전달되는 Response를 제어할 수 있습니다.

---

Decorator Option으로 route 마다 `interceptor`를 추가할 수 있습니다.

```
@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            interceptors: [ResponseCustomInterceptor],
        },
```

`Response Interceptor`를 추가하고 전달되는 Response를 제어할 수 있습니다.

---

### Swagger를 비 활성화 할 수 있습니다.

---

Decorator Option으로 route 마다 `swagger`를 비 활성화 할 수 있습니다.

<a href="./spe/exclude-swagger/exclude-swagger.spec.ts">exclude-swagger.spec.ts</a>와 같이 method 별로 Swagger를 비활성화 할 수 있습니다.

```
@Crud({ entity: BaseEntity, routes: { recover: { swagger: false } } })
```

---

### Decorator를 추가 할 수 있습니다.

---

Decorator Option으로 route 마다 `decorators`를 정의할 수 있습니다.

<a href="./spec/auth-guard/auth-guard.spec.ts">auth-guard.spec.ts</a>, <a href="./spec/custom-swagger-decorator/apply-api-extra-model.spec.ts">apply-api-extra-model.spec.ts</a>와 같이 method 별로 Decorator를 추가할 수 있습니다.

Decorator의 기능이 CRUD에서 제공하는 기능일 경우 추가된 Decorator로 override 됩니다.

```
@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            decorators: [UseGuards(AuthGuard)],
        },
        readMany: {
            decorators: [UseGuards(AuthGuard)],
        },
        ...
    },
})
```

---

### method를 Override 할 수 있습니다.

---

`Override` 데코레이터를 통해 Controller에서 Method의 기능을 변경 할 수 있습니다.

<a href="./spec/override-decorator/override-decorator.controller.spec.ts">override-decorator.controller.spec.ts</a> 를 참고할 수 있습니다.

```
@Crud({
    entity: BaseEntity,
})
@Controller('test')
export class DuplicatedOverrideController implements CrudController<BaseEntity> {
    constructor(public readonly crudService: BaseService) {}

    @Override('READ_ONE')
    overrideReadOne1() {
        return 'readOne1';
    }
}
```

---

### ReadMany Method는 Cursor와 Offset Pagination을 지원합니다.

---

ReadMany Method는 `Cursor`(default)와 `Offset` 방식의 Pagination을 지원합니다.

<a href="./spec/pagination/pagination.spec.ts">pagination.spec.ts</a>, <a href="./spec/read-many/read-many.controller.spec.ts">read-many.controller.spec.ts</a> 를 참고할 수 있습니다.

```
@Crud({ entity: BaseEntity, routes: { readMany: { paginationType: 'cursor' } })

@Crud({ entity: BaseEntity, routes: { readMany: { paginationType: 'offset' } })
```

---

### 단일 Entity를 확인하기 위한 Param을 변경할 수 있습니다.

---

Decorator Option으로 route 마다 `params`을 변경 할 수 있습니다.

Primary Key 대신 Entity의 다른 Key를 Param으로 사용하거나,

Custom Interceptor와 함께 Param 조건을 자유롭게 변경할 수 있습니다.

<a href="./spec/param-option">param-option</a>에서 구현된 케이스를 확인할 수 있습니다.

```
@Crud({ entity: BaseEntity, routes: { readOne: { params: [param] } })

```

---

### Entity에 정의된 Relations 을 비활성화 할 수 있습니다.

---

Entity에 정의된 Relation에 대해서 비활성화 할 수 있습니다.

Decorator Option으로 route 마다 `relations`을 변경 할 수 있습니다.

Custom Interceptor와 함께 relations 조건을 자유롭게 변경할 수 있습니다.

<a href="./spec/relation-entities">relation-entities</a>에서 작성된 케이스를 확인할 수 있습니다.

---

### Request 단위로 제어할 수 있습니다.

---

Decorator Option으로 route 마다 `interceptor`를 추가할 수 있습니다.

```
@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            interceptors: [ResponseCustomInterceptor],
        },
```

`Custom Interceptor`를 추가하고 Request 마다 제어할 수 있습니다.

Custom Interceptor로 Request를 수정하거나, 제공되는 CustomRequestOptions을 통해 설정 할 수 있습니다.

<a href="./spec/request-interceptor">request-interceptor</a>에서 작성된 케이스를 확인할 수 있습니다.

```
@Injectable()
export class ReadOneRequestInterceptor extends CustomRequestInterceptor {
    async overrideOptions(req: Request): Promise<CustomReadOneRequestOptions> {
        return new Promise((resolve, _reject) => {
            resolve({
                fields: req.params.id === '1' ? ['name', 'createdAt'] : undefined,
                softDeleted: +req.params.id % 2 === 0,
            });
        });
    }
}
```

<a href="./spec/response-interceptor">response-interceptor</a>에서 작성된 케이스를 확인할 수 있습니다.

---

### Soft-Delete 여부를 설정할 수 있습니다.

---

Decorator Option으로 route 마다 `softDelete` 여부를 설정할 수 있습니다.

`recover`는 Delete Method에 softDelete가 활성화된 경우에만 사용할 수 있습니다..

<a href="./spec/soft-delete-and-recover">soft-delete-and-recover</a>에서 작성된 케이스를 확인할 수 있습니다.

```
@Crud({ entity: BaseEntity, routes: { readOne: { softDelete: true } })
```

---

### [Contributors](https://github.com/type-challenges/type-challenges/graphs/contributors)

![Contributors](https://contrib.rocks/image?repo=woowabros/nestjs-library-crud)

---

## License

MIT
