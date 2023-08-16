### Relation Test Case

다음의 Entity가 있습니다.

-   writerEntity: 작성자 정보를 관리합니다.
-   categoryEntity: 질문글의 종류를 관리합니다.
-   questionEntity: 질문글을 관리합니다.
-   CommentEntity: 질문글에 추가되는 댓글을 관리합니다.

Entity는 아래와 같이 관계되어있습니다.

questionEntity --ManyToOne-- writerEntity, categoryEntity
<br/>&nbsp;&nbsp;ㄴOneToMany- CommentEntity --ManyToOne-- writerEntity
