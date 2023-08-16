### Relation Test Case

There are the fours entities

-   writerEntity: Manages writer information.
-   categoryEntity: Manages the category of the question.
-   questionEntity: Manages a question.
-   CommentEntity: Manages comments added to a question.

Entities are related as follows.

questionEntity --ManyToOne-- writerEntity, categoryEntity
<br/>&nbsp;&nbsp;ㄴOneToMany- CommentEntity --ManyToOne-- writerEntity
