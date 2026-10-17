import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';

const router = Router();
const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().regex(/^(?:\+?254|0)7\d{8}$/),
  fulfilment: z.enum(['pickup', 'delivery']),
  deliveryArea: z.string().trim().max(120).optional().default(''),
  deliveryAddress: z.string().trim().max(500).optional().default(''),
  paymentMethod: z.enum(['mpesa', 'cash']),
  customerNote: z.string().trim().max(1000).optional().default(''),
  items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(50) })).min(1).max(50)
}).refine(x => x.fulfilment !== 'delivery' || (x.deliveryArea.length > 0 && x.deliveryAddress.length > 0), { message: 'Delivery area and address are required for delivery.' });

function requireAdmin(req, res, next) {
  const configured = process.env.ADMIN_API_TOKEN;
  const supplied = req.get('x-admin-token') || '';
  if (!configured || configured.startsWith('replace_')) return res.status(503).json({ error: 'Admin API is not configured.' });
  const a = Buffer.from(supplied); const b = Buffer.from(configured);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Unauthorized.' });
  next();
}

router.get('/health', (_req, res) => res.json({ ok: true, service: 'samax-enterprises-api' }));

router.get('/products', async (req, res, next) => {
  try {
    const { rows } = await req.db.query(
      `SELECT id, sku, name, category, description, price_kes AS price, stock_quantity, image_url, active
       FROM products WHERE active = TRUE AND stock_quantity >= 0
       AND ($1::text IS NULL OR category = $1) AND ($2::text IS NULL OR (name || ' ' || category || ' ' || description) ILIKE '%' || $2 || '%')
       ORDER BY category, name LIMIT 500`,
      [req.query.category || null, req.query.q || null]
    );
    res.json({ products: rows });
  } catch (err) { next(err); }
});

router.post('/orders', async (req, res, next) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid order details.', details: parsed.error.issues.map(i => ({ path: i.path, message: i.message })) });
  const data = parsed.data; const client = await req.db.connect();
  try {
    await client.query('BEGIN');
    const ids = data.items.map(i => i.productId);
    const { rows: products } = await client.query('SELECT id, sku, name, price_kes, stock_quantity FROM products WHERE active = TRUE AND id = ANY($1::bigint[]) FOR UPDATE', [ids]);
    const byId = new Map(products.map(p => [Number(p.id), p]));
    let subtotal = 0;
    const lines = [];
    for (const item of data.items) {
      const p = byId.get(item.productId);
      if (!p) { const e = new Error('One or more products are unavailable.'); e.status = 409; throw e; }
      if (Number(p.stock_quantity) < item.quantity) { const e = new Error(`Insufficient stock for ${p.name}.`); e.status = 409; throw e; }
      const lineTotal = Number(p.price_kes) * item.quantity;
      subtotal += lineTotal;
      lines.push({ p, quantity: item.quantity, lineTotal });
    }
    // Delivery fees must be configured from confirmed area/fee rules before production launch.
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;
    const orderNumber = `SAM-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const orderResult = await client.query(
      `INSERT INTO orders(order_number, customer_name, customer_phone, fulfilment, delivery_area, delivery_address, delivery_fee_kes, subtotal_kes, total_kes, payment_method, payment_status, customer_note)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, order_number, total_kes, payment_status, order_status`,
      [orderNumber, data.customerName, data.customerPhone, data.fulfilment, data.deliveryArea, data.deliveryAddress, deliveryFee, subtotal, total, data.paymentMethod, data.paymentMethod === 'cash' ? 'cash_due' : 'pending', data.customerNote]
    );
    const order = orderResult.rows[0];
    for (const line of lines) {
      await client.query(`INSERT INTO order_items(order_id, product_id, sku_snapshot, product_name_snapshot, unit_price_kes, quantity, line_total_kes) VALUES($1,$2,$3,$4,$5,$6,$7)`, [order.id, line.p.id, line.p.sku, line.p.name, line.p.price_kes, line.quantity, line.lineTotal]);
      await client.query('UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2', [line.quantity, line.p.id]);
    }
    await client.query('COMMIT');
    res.status(201).json({ order: { orderNumber: order.order_number, totalKes: Number(order.total_kes), paymentStatus: order.payment_status, orderStatus: order.order_status }, message: data.paymentMethod === 'mpesa' ? 'Order saved. M-Pesa initiation is not enabled yet; do not send money until the site confirms the payment flow.' : 'Order saved. Cash payment is due according to the shop confirmation.' });
  } catch (err) { await client.query('ROLLBACK').catch(() => {}); next(err); }
  finally { client.release(); }
});

router.get('/admin/orders', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await req.db.query(`SELECT order_number, customer_name, customer_phone, fulfilment, delivery_area, subtotal_kes, delivery_fee_kes, total_kes, payment_method, payment_status, order_status, created_at FROM orders ORDER BY created_at DESC LIMIT 200`);
    res.json({ orders: rows });
  } catch (err) { next(err); }
});

router.post('/payments/mpesa/stk-push', async (_req, res) => {
  // Intentionally closed until Till/STK eligibility and production credentials are verified with Safaricom.
  if (process.env.MPESA_ENABLED !== 'true') return res.status(503).json({ error: 'M-Pesa is not configured yet. Use cash or contact the shop before paying.' });
  return res.status(501).json({ error: 'M-Pesa adapter still needs to be implemented and tested for this Till account.' });
});

export default router;
