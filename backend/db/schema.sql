-- PostgreSQL schema foundation. Run only against a new/backup-protected database.
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_kes INTEGER NOT NULL CHECK (price_kes >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS products_active_category_idx ON products(active, category);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  fulfilment TEXT NOT NULL CHECK (fulfilment IN ('pickup','delivery')),
  delivery_area TEXT,
  delivery_address TEXT,
  delivery_fee_kes INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_kes >= 0),
  subtotal_kes INTEGER NOT NULL CHECK (subtotal_kes >= 0),
  total_kes INTEGER NOT NULL CHECK (total_kes >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa','cash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded','cash_due')),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','preparing','ready_for_pickup','out_for_delivery','completed','cancelled')),
  customer_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(order_status, payment_status);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  sku_snapshot TEXT NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  unit_price_kes INTEGER NOT NULL CHECK (unit_price_kes >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_kes INTEGER NOT NULL CHECK (line_total_kes >= 0)
);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_transaction_id TEXT UNIQUE,
  order_id BIGINT REFERENCES orders(id) ON DELETE RESTRICT,
  amount_kes INTEGER,
  result_code TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
