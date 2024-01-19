<p align="center">
    <img src="https://github.com/woowabros/nestjs-library-crud/actions/workflows/ci.yml/badge.svg" alt="Node.js CI">
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

# @nestjs-library/crud

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

### Step 4: Module에 생성된 Entity와 Service, Controller를 추가합니다.

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

-   `GET /users` - retrieves a list of users with pagination
-   `GET /users/:id` - retrieves a single user by ID
-   `POST /users` - creates single or multiple users
-   `PATCH /users/:id` - updates an existing user by ID
-   `DELETE /users/:id` - deletes an existing user by ID
-   `PUT /users/:id` - upserts (update or create) an existing user by ID
-   `POST /users/search` - retrieves a list of users based on complex search criteria
-   `POST /users/:id/recover` - recovers a soft deleted user by ID

## 구성

Crud 데코레이터는 아래와 같은 구성 옵션을 제공합니다:

### entity

(필수) 컨트롤러가 동작하기 위해서 TypeORM 엔티티가 필요합니다.

### routes

(선택) routes 옵션을 사용해서 각 Route에 대한 구성을 지정할 수 있습니다. 모든 Route에는 다음의 기본 옵션들이 있습니다.

```typescript
import { NestInterceptor, Type } from '@nestjs/common';

interface RouteBaseOption {
    decorators?: Array<PropertyDecorator | MethodDecorator>;
    interceptors?: Array<Type<NestInterceptor>>;
    swagger?: {
        hide?: boolean;
        response?: Type<unknown>;
    };
    exclude?: string[];
}
```

그리고 각 Route들은 아래와 같은 고유한 옵션을 지닙니다.

(추가 예정)

### only

(선택) 생성할 Route에 대한 배열을 지정하여 해당 Route들만 생성되도록 구성할 수 있습니다. 만약 지정되지 않는다면 모든 Route가 생성됩니다.

예를 들어, CREATE/READ_ONE에 대해서만 생성하고 싶다면 아래와 같이 구성할 수 있습니다.

```typescript
import { Crud, Method } from '@nestjs-library/crud';

@Crud({ entity: User, only: [Method.CREATE,  Method.READ_ONE] })
```

---

## [Contributors](https://github.com/type-challenges/type-challenges/graphs/contributors)

![Contributors](https://contrib.rocks/image?repo=woowabros/nestjs-library-crud)

---

## License

This library is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
