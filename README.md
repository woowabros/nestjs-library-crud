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

```ts
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

-   <a href="./tree/main/spec/base/base.entity.ts"> base.entity.ts </a>와 같이 `CrudAbstractEntity`를 상속받거나, <a href="./tree/main/spec/custom-entity/custom.entity.ts"> custom.entity.ts </a>와 같이 Typeorm의 `BaseEntity`를 상속받아 작성합니다.

2. Service File 생성

-   <a href="./tree/main/spec/base/base.service.ts"> base.service.ts </a>와 같이 `CrudService<T extends BaseEntity>`를 상속받아 Service를 생성합니다.
-   1번에서 생성된 Entity의 Repository가 선언됩니다.

3. Controller File을 생성

-   <a href="./tree/main/spec/base/base.controller.ts"> base.controller.ts </a>와 같이 `CrudController<T extends BaseEntity>`를 상속받아 Controller를 생성합니다.
-   2번에서 생성된 Service가 선언됩니다.

4. <a href="./tree/main/spec/base/base.module.ts"> base.module.ts </a>와 같이 Module을 정의합니다.

5. RestAPI와 Swagger가 제공되는 것을 확인할 수 있습니다.

---

### Front (Request)

---

#### ReadOne

-   `Get {path}/{:id}`
-   Entity의 Key를 기반으로 `하나`의 Entity를 조회합니다.
-   params을 통해 간단한 매칭 조건을 사용할 수 있습니다.
-   <a href="./tree/main/spec/base/base.controller.read-one.spec.ts"> base.controller.read-one.spec.ts </a> 을 참고할 수 있습니다.

---

### ReadMany

-   `Get {path}/`
-   `다수`의 Entities를 `Pagination` 형태로 전달 받습니다.
-   <a href="./tree/main/spec/read-many/read-many.controller.spec.ts"> read-many.controller.spec.ts </a> 을 참고할 수 있습니다.

ReadMany는 query를 통해 단순한 비교 조건으로 사용할 수 있습니다.

다음과 같이 `key: value` 형태로 사용할 수 있습니다.

```ts
const { body: cursorResponseBody } = await request(app.getHttpServer())
    .get(`/${PaginationType.CURSOR}`)
    .query({ name: 'name-29' })
    .expect(HttpStatus.OK);
```

ReadMany는 Cursor 방식(Default)과 Offset 방식의 페이지네이션을 제공합니다.

<a href="./tree/main/spec/pagination">pagination Test</a>를 참고할 수 있습니다.

> Cursor pagination

Cursor Pagination은 첫 페이지 조회 이후 전달 받은 Request Body의 metadata에 포함된 `nextCursor`와 `query` 값을 사용합니다.

`nextCursor`값과 `query`을 Query로 전달함으로써 다음 페이지에 해당하는 데이터를 조회할 수 있습니다.

2가지 토큰을 통해 처음 조회했던 Query 조건과 nextCursor의 위치를 추정합니다.

query 조건에 `nextCursor`와 `query`가 존재하는 경우 그 외의 필드는 무시됩니다.

다음의 테스트 코드를 통해 동작 형태를 참고할 수 있습니다.

```ts
const { body: cursorResponseBody } = await request(app.getHttpServer())
    .get(`/${PaginationType.CURSOR}`)
    .query({ name: 'name-29' })
    .expect(HttpStatus.OK);

expect(cursorResponseBody.metadata).toEqual({
    nextCursor: expect.any(String),
    limit: defaultLimit,
    query: expect.any(String),
});

const { body: nextResponseBody } = await request(app.getHttpServer())
    .get(`/${PaginationType.CURSOR}`)
    .query({
        nextCursor: cursorResponseBody.metadata.nextCursor,
        query: cursorResponseBody.metadata.query,
    })
    .expect(HttpStatus.OK);
```

> Offset pagination

Offset Pagination은 첫 페이지 조회 이후 전달 받은 Request Body의 metadata에 포함된 `query` 값을 사용합니다.

`offset`과 `query`을 Query로 전달함으로써 다음 페이지에 해당하는 데이터를 조회할 수 있습니다.

다음의 테스트 코드를 통해 동작 형태를 참고할 수 있습니다.

```ts
const { body: offsetResponseBody } = await request(app.getHttpServer())
    .get(`/${PaginationType.OFFSET}`)
    .query({ name: 'name-29' })
    .expect(HttpStatus.OK);

expect(offsetResponseBody.metadata).toEqual({ page: 1, pages: 1, total: 1, offset: 1, query: expect.any(String) });

const { body: offsetNextResponseBody } = await request(app.getHttpServer())
    .get(`/${PaginationType.OFFSET}`)
    .query({
        query: offsetResponseBody.metadata.query,
        offset: offsetResponseBody.metadata.offset,
    })
    .expect(HttpStatus.OK);
```

---

### Search

-   `Post {path}/search`
-   Body를 통해 조건을 직접 정의하여 조건에 일치하는 Entities를 전달 받습니다.
-   <a href="./tree/main/spec/custom-entity/custom-entity.controller.search.spec.ts">custom-entity.controller.search.spec.ts</a>을 참고할 수 있습니다.

Search는 ReadMany가 Query parameter를 통한 key: value 형태의 exact match만을 지원함에 따라 추가되었습니다.

다양한 형태의 명령을 지원하기 위해 Post Method의 Body를 활용하여, `Cursor Pagination`을 제공합니다.

Body의 인터페이스는 첫 페이지와 다음 페이지를 호출하는 형태로 구분될 수 있습니다.

> 첫 페이지

```ts
    select?: Array<keyof Partial<T>>;
    where?: Array<QueryFilter<T>>;
    order?: {
        [key in keyof Partial<T>]: Sort | `${Sort}`;
    };
    withDeleted?: boolean;
    take?: number;
```

TypeORM의 `FindManyOptions` 형태를 사용하여, 기본적은 SQL 형태를 사용합니다.

Where절은 Array형태로 입력받으며, CRUD Decorator에서 정의한 `QueryFilter`를 사용됩니다.

QueryFilter는 `AND 연산`으로 동작되며, 각 Array는 `OR 연산`으로 동작됩니다.<br/>`NOT` 연산은 각 QueryFilter에서 정의할수 있습니다.

제공하는 조건(operator)는 <a href="./tree/main/src/lib/interface/query-operation.interface.ts">query-operation.interface.ts</a>를 참고할 수 있습니다.

```ts
type QueryFilter<T> = {
    [key in keyof Partial<T>]: QueryFilterOperation;
};

type QueryFilterOperation =
    | { operator: OperatorUnion; operand: unknown; not?: boolean }
    | {
          operator: typeof operatorBetween;
          operand: [unknown, unknown];
          not?: boolean;
      }
    | {
          operator: typeof operatorIn;
          operand: unknown[];
          not?: boolean;
      }
    | { operator: typeof operatorNull; not?: boolean };
```

예를 들어 `name이 "Hong"으로 시작`하는 조건이 필요하다면 다음과 같이 사용합니다.

```ts
{
    // other options...
    where: [{ name: { operator: 'LIKE', operand: 'Hong%' } }];
}
```

`name이 "Hong"으로 시작` 하고 `age가 20세 미만`이라면 다음과 같이 사용합니다.

```ts
{
    // other options...
    where: [
        {
            name: { operator: 'LIKE', operand: 'Hong%' },
            age: { operator: '<', operand: 20 },
        },
    ],
}
```

`name이 "Hong"으로 시작` 하고 `age가 20세 미만` 이거나, `name이 "Park"으로 시작` 하고 `age가 20세부터 30세`까지인 조건은 다음과 같이 사용합니다.

```ts
{
    // other options...
    where: [
        {
            name: { operator: 'LIKE', operand: 'Hong%' },
            age: { operator: '<', operand: 20 },
        },
        {
            name: { operator: 'LIKE', operand: 'Park%' },
            age: { operator: 'BETWEEN', operand: [20, 30] },
        },
    ],
}
```

`name이 "Hong"으로 시작` 하고 `age가 20세 미만` 이거나, `name이 "Park"으로 시작` 하고 `age가 20세부터 30세`이거나, `class가 null이 아닌` 조건은 다음과 같이 사용합니다.

```ts
{
    // other options...
    where: [
        {
            name: { operator: 'LIKE', operand: 'Hong%' },
            age: { operator: '<', operand: 20 },
        },
        {
            name: { operator: 'LIKE', operand: 'Park%' },
            age: { operator: 'BETWEEN', operand: [20, 30] },
        },
        {
            class: { operator: 'NULL', not: true },
        },
    ],
}
```

> 다음 페이지

```
    nextCursor?: string;
    query?: string;
```

ReadMany의 `Cursor Pagination의 사용법`과 동일하며 `NextCursor와 Query` 값을 Body로 전달함으로써 동작합니다.

nextCursor와 query는 `response body의 metadata로 전달`됩니다.

---

### Create

-   `Post {path}`
-   하나 또는 다수의 Entity를 생성합니다.
-   <a href="./tree/main/spec/base/base.controller.create.spec.ts">base.controller.create.spec.ts</a> 을 참고할 수 있습니다.

---

### Update

-   `Patch {path}/{:id}`
-   하나의 Entity를 수정합니다.
-   <a href="./tree/main/spec/base/base.controller.update.spec.ts">base.controller.update.spec.ts</a> 을 참고할 수 있습니다.

---

### Upsert

-   `Put {path}/{:id}`
-   하나의 Entity에 대해서 존재 하지 않는 경우 생성하고, 그렇지 않은 경우 수정합니다.
-   <a href="./tree/main/spec/base/base.controller.upsert.spec.ts">base.controller.upsert.spec.ts</a> 을 참고할 수 있습니다.

---

### Delete

-   `Delete {path}/{:id}`
-   하나의 Entity를 삭제합니다.
-   <a href="./tree/main/spec/base/base.controller.delete.spec.ts">base.controller.delete.spec.ts</a> 을 참고할 수 있습니다.

---

### Recover

-   `Post {path}/{:id}/recover`
-   Soft-delete로 삭제된 하나의 Entity를 복구합니다.
-   Delete Method의 softDeleted 옵션이 활성화 된 경우 사용됩니다.
-   <a href="./tree/main/spec/base/base.controller.recover.spec.ts">base.controller.recover.spec.ts</a> 을 참고할 수 있습니다.

---

## Use Case

### 전달되는 Response를 제어할 수 있습니다.

---

Decorator Option으로 route 마다 `interceptor`를 추가할 수 있습니다.

```ts
@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            interceptors: [ResponseCustomInterceptor],
            swagger: {
                response: BaseResponseDto,
            },
        },
    },
})
class FooController {}
```

`Response Interceptor`를 추가하고 전달되는 Response를 제어할 수 있습니다.

`swagger.response` 옵션을 통해 Swagger의 Response Interface를 변경할 수 있습니다.

---

### Swagger를 비 활성화 할 수 있습니다.

---

Decorator Option으로 route 마다 `swagger`를 비 활성화 할 수 있습니다.

<a href="./spe/exclude-swagger/exclude-swagger.spec.ts">exclude-swagger.spec.ts</a>와 같이 method 별로 Swagger를 비활성화 할 수 있습니다.

```
@Crud({ entity: BaseEntity, routes: { recover: { swagger: { hide: true } } } })
```

---

### Decorator를 추가 할 수 있습니다.

---

Decorator Option으로 route 마다 `decorators`를 정의할 수 있습니다.

<a href="./spec/auth-guard/auth-guard.spec.ts">auth-guard.spec.ts</a>, <a href="./spec/custom-swagger-decorator/apply-api-extra-model.spec.ts">apply-api-extra-model.spec.ts</a>, <a href="./spec/swagger-decorator">swagger-decorator</a>와 같이 method 별로 Decorator를 추가할 수 있습니다.

Decorator의 기능이 CRUD에서 제공하는 기능과 중복될 경우 입력된 Decorator로 override 됩니다.

```ts
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
class FooController {}
```

---

### method를 Override 할 수 있습니다.

---

`Override` 데코레이터를 통해 Controller에서 Method의 기능을 변경 할 수 있습니다.

<a href="./spec/override-decorator/override-decorator.controller.spec.ts">override-decorator.controller.spec.ts</a> 를 참고할 수 있습니다.

```ts
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

```ts
// option 1. cursor
@Crud({ entity: BaseEntity, routes: { readMany: { paginationType: 'cursor' } })

// option 2. offset
@Crud({ entity: BaseEntity, routes: { readMany: { paginationType: 'offset' } })
```

---

### 단일 Entity를 확인하기 위한 Param을 변경할 수 있습니다.

---

Decorator Option으로 route 마다 `params`을 변경 할 수 있습니다.

Primary Key 대신 Entity의 다른 Key를 Param으로 사용하거나,

Custom Interceptor와 함께 Param 조건을 자유롭게 변경할 수 있습니다.

<a href="./spec/param-option">param-option</a>에서 구현된 케이스를 확인할 수 있습니다.

```ts
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

```ts
@Crud({
    entity: BaseEntity,
    routes: {
        readOne: {
            interceptors: [ResponseCustomInterceptor],
        },
    },
})
class FooController {}
```

`Custom Interceptor`를 추가하고 Request 마다 제어할 수 있습니다.

Custom Interceptor로 Request를 수정하거나, 제공되는 CustomRequestOptions을 통해 설정 할 수 있습니다.

<a href="./spec/request-interceptor">request-interceptor</a>에서 작성된 케이스를 확인할 수 있습니다.

```ts
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

```ts
@Crud({ entity: BaseEntity, routes: { readOne: { softDelete: true } })
```

---

### [Contributors](https://github.com/type-challenges/type-challenges/graphs/contributors)

![Contributors](https://contrib.rocks/image?repo=woowabros/nestjs-library-crud)

---

## License

MIT
