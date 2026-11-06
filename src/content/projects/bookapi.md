---
title: "Book Marketplace REST API"
summary: "A used-book marketplace API in Spring Boot and PostgreSQL, with JWT login, purchase rules, and optimistic locking so two buyers can't purchase the same book."
tech: ["Java 21", "Spring Boot", "Spring Data JPA", "PostgreSQL", "Spring Security", "JWT", "JUnit 5", "Mockito", "MockMvc"]
featured: true
order: 10
status: "In progress"
context: "Personal project"
repo: "https://github.com/DaQ-Ng/Bookapi"
---

## Overview

A REST API for a used-book marketplace. Users register and log in, list books for sale, and buy books
listed by other users. It is built in layers (controller → service → repository) with PostgreSQL for storage.

## What it does

- **Accounts:** `POST /auth/register` and `POST /auth/login`. Passwords are hashed with BCrypt, and login
  returns a signed JWT that expires after one hour.
- **Listings:** `GET /books` (paged, with an optional title filter) and `GET /books/{id}` are public.
  Creating, updating, and deleting a listing require a token. The seller is taken from the token, not the request body.
- **Orders:** `POST /orders` buys a book. Buying your own book returns `403`, an already-sold book returns `409`,
  and a missing book returns `404`.
- **Validation:** request bodies are checked with Jakarta Bean Validation, and invalid input returns `400`
  with a message for each field.

## Architecture

```
HTTP request → JwtAuthFilter → Controller → Service → Repository (Spring Data JPA) → PostgreSQL
```

- **Controllers** handle routing and HTTP status codes only.
- **Services** hold the business rules (who may buy, what counts as sold) and have no HTTP code.
- **Repositories** extend `JpaRepository`, and Spring generates the SQL.
- **Relationships:** a `Book` has a `@ManyToOne` link to its seller (`User`), and an `Order` links a buyer to a book.
- **Security** is stateless: a custom filter checks the `Authorization` header on each request, and a missing
  or invalid token returns `401`.
- **Configuration:** the database password and JWT secret come from environment variables, not from the code.

## Challenge: two buyers, one book

If two users try to buy the last copy at the same moment, both requests can read `available = true` before either
saves. To stop that, `Book` has a JPA `@Version` field. When the second save runs against a stale version, Hibernate
throws an optimistic-locking exception, and a global `@RestControllerAdvice` handler turns it into
`409 Conflict` for the buyer who lost the race.

## Testing

Tests use JUnit 5 and Mockito for service logic (with mocked repositories) and `@WebMvcTest` with MockMvc for the
HTTP layer, so most of them run without a database. They cover:

- the `409` response when a purchase loses the race
- the buyer and seller being taken from the logged-in user rather than the request body
- a regression where a `POST` with an `id` in the body could overwrite an existing record
- `404` and `400` responses for missing books and invalid input

```bash
./mvnw test
```
