# Product Inventory API

TypeScript Express and MongoDB REST API with JWT authentication, role-based authorization, Express Validator input checks, Swagger documentation, and ten-item pagination.

Interactive OpenAPI documentation is available at `/api-docs`. Log in at `POST /api/auth/login`, copy `data.token`, then use **Authorize** with `Bearer <token>` to test protected product operations.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`, replacing all placeholder secrets and the initial admin password.
3. Start MongoDB, or configure a reachable `MONGODB_URI`.
4. Run `npm run dev` during development. Use `npm run build` followed by `npm start` for production.

Run the automated tests with `npm test`.

## Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Return a JWT token. |
| `GET` | `/api/products?page=1` | Public | List products, 10 per page. |
| `GET` | `/api/products/category/:category?page=1` | Public | Products in a category by price descending, 5 per page. |
| `GET` | `/api/products/:id` | Public | Get one product. |
| `POST` | `/api/products` | Admin | Create a product. |
| `PUT` | `/api/products/:id` | Admin | Update a product. |
| `DELETE` | `/api/products/:id` | Admin | Delete a product. |

At startup the configured `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` create an admin only if that email does not already exist. Likewise, the optional `INITIAL_USER_EMAIL` and `INITIAL_USER_PASSWORD` create a regular `user` account, useful for checking that non-admin tokens receive `403`. Both are persisted with a bcrypt hash. Provide the returned token as `Authorization: Bearer <token>` for write operations. Pagination is one-based; invalid page values receive a validation error.

```json
{
  "name": "Mechanical Keyboard",
  "category": "Electronics",
  "price": 99.99,
  "quantity": 25
}
```

`name`, `price`, and `quantity` are required for both creation and updates. `category` is optional. Input failures return `422`; missing or invalid authentication returns `401`; valid non-admin tokens receive `403`.

## Query optimization (Challenge 2)

The PostgreSQL price-range query, MongoDB category query, their indexes, and how to verify them with `EXPLAIN` are described in [docs/query-optimization.md](docs/query-optimization.md).

---

# Original Test Brief

Welcome to the coding test for the **Backend Developer role**. This test evaluates your skills in Node.js, Express.js, Express Validator, JWT Authentication, Authorization Middleware, database management, and API design.

## Test Instructions

1. **Clone the Repository**: Fork this repository and complete the coding challenges below.
2. **Complete the Challenges**: Implement the tasks as specified.
3. **Submit the Solution**: Once you have completed the tasks, push your code to your repository and share the link.


---

# ⏳ Time Limit

You have **2 days** to complete this test.

### Submission Steps

1. Fork this repository
2. Complete the implementation
3. Push your solution to your fork
4. Email your GitHub repository link to:

careers@fekracorp.com

---

## Challenge 1: Build a RESTful API with Node.js, Express, Express Validator, and JWT Authentication

### Objective
Create a RESTful API using Node.js and Express.js to manage a Product Inventory System with JWT authentication and authorization middleware.

### Requirements

#### Authentication:
- Use JWT for authentication. Implement a login endpoint (`POST /auth/login`) to generate a JWT token, which will be required to access the protected routes.

#### Authorization:
- Implement authorization middleware to protect routes that require admin access (e.g., adding, updating, and deleting products).
- Authorization middleware should check the role from the decoded JWT token and ensure only users with the `admin` role can access these routes.

#### Endpoints:
- **POST /auth/login**: User login (returns a JWT token).
- **POST /products**: Add a new product (`name`, `category`, `price`, `quantity`). Only accessible to admin.
- **GET /products**: List all products with pagination (10 products per page).
- **GET /products/:id**: Get a single product by its ID.
- **PUT /products/:id**: Update a product. Only accessible to admin.
- **DELETE /products/:id**: Delete a product. Only accessible to admin.

#### Input Validation (using Express Validator):
- Use Express Validator for validation on the POST and PUT endpoints.
- Ensure the following validations:
  - `name` is required.
  - `category` is optional but should be a string.
  - `price` should be a positive number.
  - `quantity` should be a non-negative integer.

#### Database:
- Use MongoDB for storing product data with the following schema:

```json
{
  "name": String,
  "category": String,
  "price": Number,
  "quantity": Number,
  "createdAt": Date,
  "updatedAt": Date
}
```

## Features:
- Implement basic validation for required fields and proper error handling using Express Validator.
- Ensure security best practices for authentication and authorization.

---

## Challenge 2: Database Query Optimization

### Objective
Write optimized SQL/NoSQL queries to retrieve product data efficiently.

Requirements
SQL Query: (Assuming PostgreSQL)

Write a query to fetch products with a price between $50 and $200, ordered by price (ascending), with pagination (10 products per page).
NoSQL Query: (Assuming MongoDB)

Write a query to retrieve products by category (e.g., "Electronics"), sorted by price in descending order. Limit the result to 5 products per page.
Optimization:

How would you optimize the queries for high traffic scenarios (e.g., indexing, caching)?


---

## Submission Instructions

1. **Clone This Repository**: Fork this repository and set up your environment.
2. **Complete the Tasks**: Implement the tasks in the respective directories for each challenge.
3. **Test Your Work**: Ensure your APIs, authentication, authorization, and queries work as expected.
4. **Submit Your Solution**: Push your completed code to your public GitHub repository and share the link with us.


---
# 📤 Submission Reminder

You have 2 days.

Fork → Implement → Push → Send GitHub link to:

careers@fekracorp.com

Good luck.

