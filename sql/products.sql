CREATE TABLE IF NOT EXISTS products (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(200)   NOT NULL,
    category   VARCHAR(100),
    price      NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    quantity   INTEGER        NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Matches WHERE price BETWEEN ... ORDER BY price ASC, id ASC: the range is an index
-- range scan and rows come out already in (price, id) order, so no sort step is needed.
-- A separate single-column index on price would be redundant with this one.
CREATE INDEX IF NOT EXISTS idx_products_price_id ON products (price, id);
