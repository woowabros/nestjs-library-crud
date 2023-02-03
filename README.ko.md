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

다음과 같이 Decorator를 정의함으로서 Entity의 CRUD를 제공합니다.

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

Decorator가 제공하는 CRUD로 Entity의 정보를 관리할 수 있습니다.

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

### Create

-   `Post {path}`
-   하나 또는 다수의 Entity를 생성합니다.
-   <a href="./src/spec/base/base.controller.create.spec.ts">base.controller.create.spec.ts</a> 을 참고할 수 있습니다.

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
-   <a href="./src/spec/base/base.controller.recover.spec.ts">base.controller.recover.spec.ts</a> 을 참고할 수 있습니다.

---

### Use Case

// TODO 사용 시나리오 정의 및 관련 Spec 파일 링크

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

### [Contributors](https://github.com/type-challenges/type-challenges/graphs/contributors)

![Contributors](https://contrib.rocks/image?repo=woowabros/nestjs-library-crud)

## License

MIT
