import swaggerJSDoc from "swagger-jsdoc";

const productIdParameter = {
  name: "id", in: "path", required: true,
  description: "MongoDB product identifier.", schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};
const errorResponses = {
  "400": { description: "Malformed JSON or invalid resource identifier.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
  "401": { description: "Authentication failed.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
  "403": { description: "Authenticated user is not an admin.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
  "404": { description: "Product or route was not found.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
  "422": { description: "Request validation failed.", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
  "500": { description: "Unexpected server error.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
};
const productBody = {
  required: true,
  content: { "application/json": { schema: { $ref: "#/components/schemas/ProductRequest" } } },
};

const definition = {
  openapi: "3.0.3",
  info: { title: "Product Inventory API", version: "1.0.0", description: "JWT-secured REST API for managing product inventory." },
  servers: [{ url: "/", description: "Current server" }],
  tags: [{ name: "Authentication" }, { name: "Products" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Paste the token returned by POST /api/auth/login." } },
    schemas: {
      User: { type: "object", required: ["id", "email", "role"], properties: { id: { type: "string" }, email: { type: "string", format: "email", example: "admin@example.com" }, role: { type: "string", enum: ["admin", "user"] } } },
      LoginRequest: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email", example: "admin@example.com" }, password: { type: "string", minLength: 1, example: "admin-password" } } },
      LoginResponse: { type: "object", required: ["token", "tokenType", "expiresIn"], properties: { token: { type: "string" }, tokenType: { type: "string", example: "Bearer" }, expiresIn: { type: "string", example: "1h" } } },
      Product: { type: "object", required: ["_id", "name", "price", "quantity", "createdAt", "updatedAt"], properties: { _id: { type: "string", example: "507f1f77bcf86cd799439011" }, name: { type: "string", maxLength: 200, example: "Mechanical Keyboard" }, category: { type: "string", maxLength: 100, example: "Electronics" }, price: { type: "number", format: "float", minimum: 0.01, example: 99.99 }, quantity: { type: "integer", minimum: 0, example: 25 }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } } },
      ProductRequest: { type: "object", required: ["name", "price", "quantity"], properties: { name: { type: "string", minLength: 1, maxLength: 200 }, category: { type: "string", maxLength: 100 }, price: { type: "number", minimum: 0.01 }, quantity: { type: "integer", minimum: 0 } }, example: { name: "Mechanical Keyboard", category: "Electronics", price: 99.99, quantity: 25 } },
      ProductResponse: { type: "object", required: ["data"], properties: { data: { $ref: "#/components/schemas/Product" } } },
      Pagination: { type: "object", required: ["page", "limit", "total", "totalPages"], properties: { page: { type: "integer", minimum: 1 }, limit: { type: "integer", example: 10 }, total: { type: "integer" }, totalPages: { type: "integer" } } },
      ErrorResponse: { type: "object", required: ["message"], properties: { message: { type: "string", example: "Product not found." } } },
      ValidationError: { type: "object", required: ["message", "errors"], properties: { message: { type: "string", example: "Validation failed." }, errors: { type: "array", items: { type: "object", required: ["field", "message"], properties: { field: { type: "string" }, message: { type: "string" } } } } } },
    },
  },
  paths: {
    "/api/auth/login": { post: { tags: ["Authentication"], summary: "Log in", description: "Validates user credentials and returns a JWT access token.", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } }, responses: { "200": { description: "Authenticated successfully.", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } }, "401": errorResponses["401"], "400": errorResponses["400"], "500": errorResponses["500"] } } },
    "/api/products": {
      get: { tags: ["Products"], summary: "List products", description: "Returns products ordered by creation time, with ten products per page.", parameters: [{ name: "page", in: "query", description: "One-based page number.", required: false, schema: { type: "integer", minimum: 1, default: 1 } }], responses: { "200": { description: "Product page.", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Product" } }, pagination: { $ref: "#/components/schemas/Pagination" } } } } } }, "422": errorResponses["422"], "500": errorResponses["500"] } },
      post: { tags: ["Products"], summary: "Create a product", description: "Creates a product. Name is required (1–200 characters), category is optional (up to 100 characters), price must be positive, and quantity a non-negative integer.", security: [{ bearerAuth: [] }], requestBody: productBody, responses: { "201": { description: "Product created.", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } } }, ...errorResponses } },
    },
    "/api/products/{id}": {
      get: { tags: ["Products"], summary: "Get a product", description: "Returns one product by MongoDB identifier.", parameters: [productIdParameter], responses: { "200": { description: "Product found.", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } } }, "400": errorResponses["400"], "404": errorResponses["404"], "422": errorResponses["422"], "500": errorResponses["500"] } },
      put: { tags: ["Products"], summary: "Update a product", description: "Replaces product fields using the same required validation rules as creation.", security: [{ bearerAuth: [] }], parameters: [productIdParameter], requestBody: productBody, responses: { "200": { description: "Product updated.", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } } }, ...errorResponses } },
      delete: { tags: ["Products"], summary: "Delete a product", description: "Permanently deletes a product by identifier.", security: [{ bearerAuth: [] }], parameters: [productIdParameter], responses: { "204": { description: "Product deleted." }, ...errorResponses } },
    },
  },
};

export default swaggerJSDoc({ definition, apis: [] });
