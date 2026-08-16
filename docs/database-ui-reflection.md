# Lumo Database-to-UI Reflection Matrix

This matrix maps domain events and database mutations to API responses, outbox events, and dashboard UI updates across all six operational roles.

---

## Complete Event Reflection Matrix

| Event / Mutation | Database Rows Created / Updated | Transaction Boundary | Outbox Event | Notification Recipients | Dashboard UI Reflections | Excluded Roles (Access Denied) |
| --- | --- | --- | --- | --- | --- | --- |
| **1. Customer Sourcing Request** | `SourcingRequest` (CREATED), `AuditLog` | `$transaction` | `SOURCING_CREATED` | Sales Team | **Customer UI**: Appears in "My Requests". **Sales UI**: Appears in "Unassigned Sourcing Requests" queue. | `SUPPLIER`, `LOGISTICS`, `AGENT` |
| **2. Sales Offers Assignment** | `OrderAssignment` (OFFERED), `AssignmentEvent`, `AuditLog`, `NotificationOutbox` | `$transaction` | `ASSIGNMENT_OFFERED` | Assignee (Supplier / Agent / Logistics) | **Sales UI**: Assignment status badge set to "OFFERED". **Assignee UI**: Appears in "New Assignment Offers" queue card. | Unassigned Suppliers/Logistics |
| **3. Supplier Accepts Assignment** | `OrderAssignment` (ACCEPTED), `AssignmentEvent`, `AuditLog`, `NotificationOutbox` | `$transaction` | `ASSIGNMENT_ACCEPTED` | Sales, Customer | **Supplier UI**: Moved to "Active Fulfillment Queue". **Sales UI**: Updated status badge. | Unassigned Suppliers |
| **4. Customer Pays via AzamPay** | `Order` (PAID), `PaymentTransaction`, `AuditLog`, `NotificationOutbox` | `$transaction` | `ORDER_PAID` | Customer, Supplier, Sales | **Customer UI**: Status timeline advances to "PAID". **Supplier UI**: Packing queue unlocked. | Unassigned Logistics/Agents |
| **5. Logistics Waybill Update** | `Order` (IN_TRANSIT), `Shipment`, `AuditLog`, `NotificationOutbox` | `$transaction` | `ORDER_SHIPPED` | Customer, Sales | **Logistics UI**: Active shipment moved to "In-Transit". **Customer UI**: Tracking number badge updated. | `SUPPLIER` |
| **6. Delivery Confirmation** | `Order` (DELIVERED/COMPLETED), `AuditLog`, `NotificationOutbox` | `$transaction` | `ORDER_DELIVERED` | Customer, Sales, Supplier | **Customer UI**: Prompted for review. **Supplier UI**: Escrow payout queued. | Unassigned Logistics |
| **7. Internal Note Added** | `Message` (`isInternal=true`), `Conversation` (updatedAt) | Single operation | None | Assigned Sales, Agent, Admin | **Sales / Agent / Admin UI**: Displays confidential internal note in yellow panel. | `BUYER`, `SUPPLIER`, `LOGISTICS` (unless assigned) |
