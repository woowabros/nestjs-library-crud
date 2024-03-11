# @nestjs-library/crud

<p align="center">
    <img src="https://github.com/woowabros/nestjs-library-crud/actions/workflows/ci.yml/badge.svg" alt="Node.js CI">
    <a href='https://coveralls.io/github/woowabros/nestjs-library-crud?branch=main'>
        <img src='https://coveralls.io/repos/github/woowabros/nestjs-library-crud/badge.svg?branch=main' alt='Coverage Status' />
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/npm/v/@nestjs-library/crud">
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/bundlephobia/minzip/@nestjs-library/crud">
    </a>
    <a href="https://www.npmjs.com/package/@nestjs-library/crud">
        <img src="https://img.shields.io/npm/dw/@nestjs-library/crud">
    </a>        
</p>

<p align="center">
    <a href="./README.md">
        <span>English<span>
    </a> 
    <span>|</span>
    <a href="./README.ko.md">
        <span>한국어<span>
    </a> 
</p>

CRUD Rest API를 자동으로 생성하는 라이브러리입니다.

`NestJS`와 `TypeORM` 기반으로 작성되었습니다.

## 기능

Entity를 기반으로 ReadOne, ReadMany, Search, Update, Insert, Upsert, Delete, Recover API과 Swagger Documents를 제공합니다.

-   TypeOrm이 지원하는 모든 종류의 DBMS에서 사용할 수 있습니다.
-   모든 API는 `Swagger` Document를 제공하며, `Decorator`를 통해 Override 할 수 있습니다.
-   모든 API는 `Options`을 통해 관리할 수 있으며, Request 별로 제어가 필요한 경우 `Interceptor`를 통해 Request와 Response를 관리할 수 있습니다.
-   모든 API는 `Validation`을 위한 Dto를 제공하고 있으며, Entity에 정의된 `groups` 정보를 통해 자동으로 생성합니다.
-   `ReadMany`와 `Search`는 Cursor와 Offset Type의 페이지네이션을 제공합니다.
-   `ReadMany`를 통해 단순한 조건으로 조회를 할 수 있다면, `Search`는 복잡한 조건으로 조회할 수 있습니다.
-   `SoftDelete`와 `Recover`를 지원합니다.
-   구현된 `많은 기능과 사례`는 작성된 <a href="./spec"> <span>예제<span></a>를 확인할 수 있습니다.

---

## 설치

```bash
# npm
npm install @nestjs-library/crud

# yarn
yarn add @nestjs-library/crud

# pnpm
pnpm add @nestjs-library/crud
```

## 사용 방법

---

### Step 1. Entity를 정의합니다.

Crud decorator를 사용하기 위해서는 먼저 TypeORM Entity를 정의해야 합니다.
다음의 예시에서는 id, username, email 속성을 가진 User Entity를 정의합니다.

```typescript
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    email: string;
}
```

### Step 2: Service provider를 생성합니다.

TypeORM Entity에 대한 NestJS Service 를 생성합니다.
이 때 Service 객체는 CrudService를 상속해야 합니다.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudService } from '@nestjs-library/crud';
import { Repository } from 'typeorm';

import { User } from './user.entity';

@Injectable()
export class UserService extends CrudService<User> {
    constructor(@InjectRepository(User) repository: Repository<User>) {
        super(repository);
    }
}
```

### Step 3. Controller를 생성합니다.

TypeORM Entity에 대한 NestJS Controller 를 생성합니다.
이 때 Controller 객체는 CrudController를 구현해야 합니다.

```typescript
import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@nestjs-library/crud';

import { User } from './user.entity';
import { UserService } from './user.service';

@Crud({ entity: User })
@Controller('users')
export class UserController implements CrudController<User> {
    constructor(public readonly crudService: UserService) {}
}
```

### Step 4: 생성된 Entity와 Service, Controller를 Module에 추가합니다.

NestJS 모듈을 정의합니다. 위에서 생성한 Entity, Service, Controller를 각각 imports, controllers, providers에 추가합니다.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
```

### Step 5: Server를 시작하고 CRUD API를 확인할 수 있습니다.

모듈이 초기화되면 다음의 endpoint가 자동으로 생성됩니다.

-   `GET /users` - pagination을 적용하여 user의 목록을 조회합니다.
-   `GET /users/:id` - ID를 기반으로 단일한 user를 조회합니다.
-   `POST /users` - 단일한, 혹은 여러 명의 user를 생성합니다.
-   `PATCH /users/:id` - ID를 기반으로 기존의 user를 수정합니다.
-   `DELETE /users/:id` - ID를 기반으로 기존의 user를 삭제합니다.
-   `PUT /users/:id` - ID를 기반으로 기존의 user를 upsert (수정하거나 생성) 합니다.
-   `POST /users/search` - 복잡한 검색 조건을 적용하여 user의 목록을 조회합니다.
-   `POST /users/:id/recover` - ID를 기반으로 soft delete 된 user를 복구합니다.

---

## 설정

Crud decorator는 다음과 같은 옵션을 제공합니다.

### entity

(required) controller가 다룰 TypeORM Entity를 지정합니다.

### routes

(optional) 옵션을 지정하여 각각의 route를 설정합니다.

예를 들어 Search route의 기본 pagination 크기를 설정하고 싶다면, 다음과 같이 옵션을 지정할 수 있습니다.

```typescript
@Crud({
    entity: User,
    routes: {
        search: { numberOfTake: 5 },
    },
})
```

모든 route는 다음의 기본 옵션들을 가질 수 있습니다.

```typescript
import { NestInterceptor, Type } from '@nestjs/common';

interface RouteBaseOption {
    decorators?: Array<PropertyDecorator | MethodDecorator>;
    interceptors?: Array<Type<NestInterceptor>>;
    swagger?: {
        hide?: boolean;
        response?: Type<unknown>;
    };
}
```

`CREATE`, `UPDATE`, `DELETE`, `UPSERT`, `RECOVER` route는 다음의 옵션을 가질 수 있습니다.

```typescript
interface SaveOptions {
    listeners?: boolean;
}
```

각각의 route는 아래와 같은 옵션을 가질 수 있습니다.

#### `READ_ONE`

```typescript
interface ReadOneOptions {
    params?: string[];
    softDelete?: boolean;
    relations?: false | string[];
}
```

#### `READ_MANY`

```typescript
import { Sort, PaginationType } from 'src/lib/interface';

interface ReadManyOptions {
    sort?: Sort | `${Sort}`;
    paginationType?: PaginationType | `${PaginationType}`;
    numberOfTake?: number;
    relations?: false | string[];
    softDelete?: boolean;
}
```

#### `SEARCH`

```typescript
import { PaginationType } from 'src/lib/interface';

interface SearchOptions {
    paginationType?: PaginationType | `${PaginationType}`;
    numberOfTake?: number;
    limitOfTake?: number;
    relations?: false | string[];
    softDelete?: boolean;
}
```

#### `CREATE`

```typescript
import { Type } from '@nestjs/common';
import { Author } from 'src/lib/interface';

interface CreateOptions {
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `UPDATE`

```typescript
import { Type } from '@nestjs/common';
import { Author } from 'src/lib/interface';

interface UpdateOptions {
    params?: string[];
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `DELETE`

```typescript
import { Author } from 'src/lib/interface';

interface DeleteOptions {
    params?: string[];
    softDelete?: boolean;
    author?: Author;
}
```

#### `UPSERT`

```typescript
interface UpsertOptions {
    params?: string[];
    swagger?: {
        body?: Type<unknown>;
    };
    author?: Author;
}
```

#### `RECOVER`

```typescript
interface RecoverOptions {
    params?: string[];
    author?: Author;
}
```

### only

(optional) route를 생성할 Method 목록을 지정합니다.

예를 들어 Create와 ReadOne에 대한 route만 생성하고 싶다면 다음과 같이 설정할 수 있습니다.

```typescript
import { Crud, Method } from '@nestjs-library/crud';

@Crud({ entity: User, only: [Method.CREATE,  Method.READ_ONE] })
```

## [Contributors](https://github.com/woowabros/nestjs-library-crud/graphs/contributors)

![Contributors](https://contrib.rocks/image?repo=woowabros/nestjs-library-crud)

---

## License

This library is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
