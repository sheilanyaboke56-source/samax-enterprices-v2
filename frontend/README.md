# Samax Enterprises — website starter

This is a responsive, installable-PWA-oriented **front-end starter/demo**, branded forest green and gold. It includes product search and category filters, a cart, checkout details, and a WhatsApp order-message handoff to the supplied business number (0723 752 583).

## Important before publishing
- Product names, descriptions, emoji illustrations and prices in `app.js` are examples, not confirmed stock or prices. Replace them with real inventory.
- The checkout currently opens WhatsApp; it does **not** create a server-side order or verify payment.
- M-Pesa Daraja, SMS, WhatsApp Business Platform automation, customer accounts, admin login, inventory database, delivery-fee rules, order tracking, tax/invoice logic, backups and secure production hosting are **not implemented yet**.
- The manifest has no app icons yet. Add proper Samax icons before app-store-like polish.
- The website should be served over HTTPS for reliable PWA installation. A local preview can use `python -m http.server 8000` from this folder and visit `http://localhost:8000`.

## First setup
1. Open `index.html` in a browser or run the local server command above.
2. Edit the `products` array in `app.js` or prepare the supplied Excel catalogue template for import during backend development.
3. Verify the WhatsApp destination in `app.js` and `index.html` before launch.
4. Do not put API secrets, M-Pesa credentials, passwords or customer data in front-end files.

## Proposed production architecture
- Front end: PWA storefront with installable manifest and generated icon set.
- Back end: authenticated API (for example Node.js/TypeScript) and PostgreSQL database.
- Admin: role-based login, catalogue/stock/order management, audit trail.
- Payments: official Safaricom Daraja STK Push, with server-side callback validation and transaction reconciliation. Never treat a browser redirect as proof of payment.
- Notifications: opt-in WhatsApp Business Platform templates and SMS provider integration.
- Hosting: HTTPS, environment-managed secrets, database backups, monitoring, rate limiting, and tested restore process.

## Suggested launch sequence
1. Confirm the existing M-Pesa account type (Till or Paybill) and the account holder/business details.
2. Register and verify the chosen `.co.ke` domain; availability is not checked by this starter.
3. Fill the product workbook with actual products, prices, quantities, categories and photo filenames.
4. Confirm delivery zones/fees, pickup hours, returns policy and the business email.
5. Build and test the server/database/admin/payment integration in a staging environment.
6. Run end-to-end tests for guest checkout, customer accounts, payment callbacks, refunds/cancellations, delivery and pickup before launch.
