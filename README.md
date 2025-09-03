Architectural Notes & Trade-offs (Summary)
Why PostgreSQL (SQL) over NoSQL?

Decision: Chose PostgreSQL because the data model (Users, Books, Borrowing Records) is highly relational.

Reasoning: SQL enforces data integrity through foreign key constraints, which is critical for a library system to prevent orphaned data (e.g., a borrowing record pointing to a deleted book).

Trade-off: Less schema flexibility. Future changes require formal database migrations.

How was the concurrency issue ("borrowing the last book") solved?

Decision: Implemented Pessimistic Locking within a database transaction.

Reasoning: When a user starts to borrow a book, the system locks that book's row in the database. Any other user trying to borrow the same book must wait until the first user's transaction is complete. This is a straightforward and robust way to guarantee data consistency.

Trade-off: Can introduce minor delays if there is high contention for the same book, but data accuracy was prioritized over microsecond performance gains.

Who handles data transformation (Entity to DTO)? Service vs. Controller.

Decision: The Controller layer is responsible for converting entities into Data Transfer Objects (DTOs).

Reasoning: This follows the Separation of Concerns principle. The Service layer focuses purely on business logic and works with domain models (entities), making it reusable. The Controller handles HTTP-related tasks, including formatting the data for the client.

Trade-off: This adds a small amount of mapping code (new UserResponseDto(...)) to the controllers, but it results in a cleaner, more flexible, and maintainable long-term architecture.