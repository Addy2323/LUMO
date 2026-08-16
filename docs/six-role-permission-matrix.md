# Lumo Six-Role Authorization & Permission Matrix

## 1. Role Scoping & Dashboard Access Matrix

| Role (`activeRole`) | Dashboard Route | Allowed Operational Scopes | Tenant Scoping Requirement | Confidential Notes Access (`LUMO_INTERNAL`) |
| --- | --- | --- | --- | --- |
| **`BUYER`** | `/account` | Own Orders, Sourcing Requests, Saved Cart | Scoped strictly to `User.id` | ❌ DENIED |
| **`SUPPLIER`** | `/supplier` | Fulfillment Assignments, Active Quotes | Scoped to active `Organization.id` (`type=SUPPLIER`) | ❌ DENIED |
| **`SALES`** | `/sales` | Customer Inbox, Unassigned Requests, Quotes | Cross-customer sales queue | ✅ ALLOWED (Assigned/Internal) |
| **`LOGISTICS`** | `/logistics` | Carrier Shipments, Electronic Waybills | Scoped to active `Organization.id` (`type=LOGISTICS_COMPANY`) | ❌ Restricted (Assigned orders only) |
| **`AGENT`** | `/agent` | Field Sourcing Tasks, Factory Inspections | Scoped to assigned field country/order | ✅ ALLOWED (Assigned/Internal) |
| **`ADMIN`** | `/admin` | System-wide Governance, Kanban, Escrow | Global platform scope (MFA required) | ✅ ALLOWED (Full Admin Security) |

---

## 2. Order Transition Authorization Matrix

| Transition | Permitted Roles | Notes |
| --- | --- | --- |
| `DRAFT` → `PENDING_PAYMENT` | `BUYER`, `SALES`, `ADMIN` | Customer submits order for payment |
| `PENDING_PAYMENT` → `PAID` | `BUYER`, `ADMIN` | AzamPay webhook or admin confirmation |
| `PAID` → `PROCESSING` | `SUPPLIER`, `SALES`, `ADMIN` | Supplier accepts fulfillment |
| `PROCESSING` → `SHIPPED` | `SUPPLIER`, `LOGISTICS`, `ADMIN` | Carrier issues waybill & dispatches |
| `SHIPPED` → `DELIVERED` | `LOGISTICS`, `BUYER`, `ADMIN` | Carrier or buyer confirms receipt |
| `DELIVERED` → `COMPLETED` | `BUYER`, `SALES`, `ADMIN` | Transaction finalized & funds released |
