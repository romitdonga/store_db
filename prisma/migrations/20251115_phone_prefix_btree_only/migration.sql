-- Render-compatible: no extensions required
CREATE INDEX IF NOT EXISTS idx_sales_customer_phone_btree
  ON sales (customer_phone);

-- Optional: for stricter prefix performance with LIKE, use text_pattern_ops when allowed
-- CREATE INDEX IF NOT EXISTS idx_sales_customer_phone_pattern
--   ON sales USING btree (customer_phone text_pattern_ops);

-- old reposnse --RDX
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- 
-- CREATE INDEX IF NOT EXISTS idx_sales_customer_phone_pattern
--   ON sales USING btree (customer_phone text_pattern_ops);
-- 
-- CREATE INDEX IF NOT EXISTS idx_sales_customer_phone_trgm
--   ON sales USING gin (customer_phone gin_trgm_ops);