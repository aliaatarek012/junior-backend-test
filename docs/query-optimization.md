# Challenge 2: Database Query Optimization

| Concern | PostgreSQL | MongoDB |
| --- | --- | --- |
| Code | `src/modules/products/product.sql-repository.ts` | `listByCategory` in `src/modules/products/product.service.ts` |
| Schema / index | `sql/products.sql` | `src/modules/products/product.model.ts` |
| HTTP | none (the app has no PostgreSQL connection) | `GET /api/products/category/:category?page=1` |
| Tests | `tests/product-queries.test.ts` (runs on `pg-mem`) | `tests/product-queries.test.ts` (runs on `mongodb-memory-server`) |

Both queries validate `page` (positive integer) and cap `limit` at the required page size (10 for SQL, 5 for MongoDB) through `resolvePageWindow` in `src/utils/pagination.ts`. Invalid values raise a `400`.

## Approach

```text
Query -> Filter -> Sort -> Paginate -> Index -> Project -> Measure (EXPLAIN) -> Cache hot reads
```

Indexes are designed from the actual filter and sort of each query rather than added per column. Every extra index costs disk, memory and write throughput on every insert, update and delete.

## 1. PostgreSQL: products priced 50 to 200, price ascending, 10 per page

```sql
SELECT id, name, category, price, quantity
FROM products
WHERE price BETWEEN $1 AND $2
ORDER BY price ASC, id ASC
LIMIT $3
OFFSET $4;
-- values: [50, 200, limit, (page - 1) * limit]
```

- **Parameterized.** All values are bound as `$1` to `$4`; no user input is concatenated into SQL.
- **Stable order.** `id` breaks ties between equal prices, so rows cannot repeat or be skipped across pages.
- **Projection.** Only the five needed columns are read, never `SELECT *`.

`findProductsInPriceRange(db, { page })` accepts any object with `query(text, values)`, so a `pg` `Pool` or `Client` can be passed in directly.

### Index

```sql
CREATE INDEX IF NOT EXISTS idx_products_price_id ON products (price, id);
```

The query has a range condition on `price` and is ordered by `(price, id)`. A B-tree on `(price, id)` lets PostgreSQL range-scan from 50 to 200 and read rows already in final order, then stop after `LIMIT` rows, with no separate sort step. An index on `price` alone supports the range but still needs a sort to order ties by `id`. Because `(price, id)` already serves every query that `(price)` would, only the composite index is created.

### Verifying with EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, category, price, quantity
FROM products
WHERE price BETWEEN 50 AND 200
ORDER BY price ASC, id ASC
LIMIT 10 OFFSET 0;
```

Check the following:

- **Scan type.** Expect `Index Scan using idx_products_price_id`. `Seq Scan` means the index is not used. This is normal for small tables or when most rows match the range, because PostgreSQL then correctly prefers a sequential read. `Index Only Scan` would require the index to contain every selected column, which it does not.
- **No `Sort` node** above the scan. Its absence confirms the index supplies the order.
- **Estimated vs actual rows** (`rows=` against `actual ... rows=`). Large gaps mean stale statistics; run `ANALYZE products;`.
- **Execution time** and `Buffers: shared hit/read`.
- Compare the plan before and after creating the index on realistic data volumes.

No benchmark numbers are claimed here. The index was not measured against a real PostgreSQL server; `pg-mem` only verifies query behaviour, not plans.

## 2. MongoDB: Electronics, price descending, 5 per page

```ts
ProductModel.find({ category: { $eq: category } })
  .select("name category price quantity")
  .sort({ price: -1, _id: -1 })
  .skip((page - 1) * 5)
  .limit(5)
  .lean();
```

- **Explicit `$eq`.** The filter can never be interpreted as a query operator.
- **Tie-breaker.** `_id` breaks ties between equal prices so pages are deterministic.
- **Projection.** `select` returns only the listed fields plus `_id`. `lean()` skips building Mongoose documents for read-only results.
- **Total count.** `countDocuments` runs in parallel with the page query and uses the same index prefix.

### Compound index

```ts
productSchema.index({ category: 1, price: -1, _id: -1 });
```

This follows the equality, sort, range ordering. `category` is the equality filter, and `price, _id` match the sort exactly, so MongoDB walks one contiguous slice of the index already in order and stops after `skip + limit` entries. Without `_id` in the index, the tie-breaker sort would force an in-memory `SORT` over every product in the category. Separate indexes on `category` and `price` cannot serve this filter and sort together, so none were added. This index replaces the previous `{ category: 1, price: -1 }`, which is a prefix of the new one and therefore redundant.

Mongoose's `autoIndex` creates new indexes but never drops old ones. On an existing database, run `ProductModel.syncIndexes()` once, or `db.products.dropIndex("category_1_price_-1")`.

### Verifying with explain("executionStats")

```ts
await ProductModel.find({ category: "Electronics" })
  .select("name category price quantity")
  .sort({ price: -1, _id: -1 })
  .skip(0)
  .limit(5)
  .explain("executionStats");
```

Check the following:

- **Winning plan.** Expect `IXSCAN` on `category_1_price_-1__id_-1`. `COLLSCAN` means a full collection scan.
- **No `SORT` stage.** Its absence means the index provides the order.
- **`totalKeysExamined` and `totalDocsExamined`.** These should be close to `skip + limit`, not to the collection size.
- **`executionTimeMillis`.** Compare on realistic data.

The test suite asserts the first two points and that at most five documents are examined. It does not measure speed.

## 3. Offset vs cursor (keyset) pagination

`OFFSET` and `skip()` satisfy the page-number requirement, but the database still walks past every skipped row. Page 1 skips 0 rows, while page 10,000 skips 99,990 for SQL or 49,995 for MongoDB, so cost grows with page depth. Concurrent inserts can also shift rows between pages.

For deep or infinite scrolling, use the last row of the current page as the cursor. The existing indexes already support both queries.

PostgreSQL:

```sql
SELECT id, name, category, price, quantity
FROM products
WHERE price BETWEEN $1 AND $2
  AND (price, id) > ($3, $4)        -- last row's price and id
ORDER BY price ASC, id ASC
LIMIT 10;
```

MongoDB, ordered by `price: -1, _id: -1`:

```ts
{ category: "Electronics",
  $or: [{ price: { $lt: lastPrice } }, { price: lastPrice, _id: { $lt: lastId } }] }
```

Each page then costs about the same regardless of depth, at the price of not supporting "jump to page N". The challenge requires page numbers, so offset pagination is implemented and keyset pagination is documented as the scaling path.

## 4. Caching (strategy only)

Redis is not part of this project, so no cache was added. For read-heavy traffic, a cache-aside layer in the service would work like this:

- **Keys.** `products:category:Electronics:page:1` and `products:price:50:200:page:1`, plus the limit if it ever becomes configurable.
- **Flow.** Read the key. On a miss, run the query and `SET key value EX <ttl>`. A short TTL (30 to 120 seconds) bounds staleness even if an invalidation is missed.
- **Invalidation.** After create, update or delete, remove the affected list keys. A changed product can move items across every page, so delete by prefix, such as all `products:category:<old and new category>:*` keys, or bump a version number embedded in the key (`products:v42:...`) to invalidate everything at once.
- **Don't** cache per-user or authenticated responses under shared keys.

## 5. Other high-traffic considerations

- Read replicas for list endpoints. MongoDB `readPreference: "secondaryPreferred"` can be used if slight staleness is acceptable.
- Connection pooling: Mongoose's default pool, or `pg.Pool` / PgBouncer.
- The exact `total` count gets expensive on huge result sets. Consider returning `hasNextPage` by fetching `limit + 1` rows, or an estimated count.
- Re-check plans after data grows, since the optimizer's choices depend on table statistics.
