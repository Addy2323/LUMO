# Lumo Database Architecture & Entity Inventory

## 1. Overview & Core Architecture Principles

The Lumo Digital Commerce Platform relies on a single PostgreSQL database managed via Prisma ORM. The architecture enforces server-authoritative state transitions, multi-role identity management, organization-level data scoping, and transactional outbox event publishing.

### Key Operational Principles
* **Single Identity & Active Role**: A user account (`User`) holds approved role assignments (`UserRoleAssignment` & `UserRole`). Requests specify an operational `activeRole` in the session JWT.
* **Database-Backed Session Authorization**: API endpoints perform real-time database checks to verify non-revoked session status, active role assignment, active organization membership, account status, and Admin MFA.
* **Single Outbox Transaction Pattern**: Domain state changes (e.g. `transitionOrder`, `offerAssignment`) write domain state updates, audit logs, and `NotificationOutbox` records within a single atomic Prisma `$transaction`.

---

## 2. Complete Database Table Catalog

| Model / Table | Purpose | Primary Key | Foreign Keys | Unique Constraints | Important Indexes | Owner / Domain | Used By Roles |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `User` (`users`) | Authenticated user accounts & authentication status | `id` (uuid) | None | `email` | `email` | Identity | All 6 Roles |
| `UserRoleAssignment` (`user_role_assignments`) | Multi-role assignment records with status | `id` (cuid) | `userId` → `User` | `@@unique([userId, role])` | `@@index([userId, status])` | Identity | All 6 Roles |
| `UserRole` (`user_roles`) | Legacy role approval records | `id` (uuid) | `userId` → `User` | `@@unique([userId, role])` | `@@index([userId, status])` | Identity | All 6 Roles |
| `Session` (`sessions`) | Server-managed session store with activeRole | `id` (uuid) | `userId` → `User` | `token` | `token`, `userId` | Auth | All 6 Roles |
| `Organization` (`organizations`) | B2B supplier, logistics, or internal organizations | `id` (uuid) | None | None | None | Identity | `SUPPLIER`, `LOGISTICS`, `ADMIN` |
| `OrganizationMember` (`organization_members`) | Active organization memberships & positions | `id` (uuid) | `organizationId` → `Organization`, `userId` → `User` | `@@unique([organizationId, userId])` | `@@index([userId, isActive])` | Identity | `SUPPLIER`, `LOGISTICS`, `ADMIN` |
| `Order` (`orders`) | B2B commerce order master record | `id` (uuid) | `userId` → `User`, `sourcingRequestId` → `SourcingRequest` | `orderNumber` | `userId`, `status` | Commerce | All 6 Roles |
| `OrderItem` (`order_items`) | Line items for orders | `id` (uuid) | `orderId` → `Order`, `productId` → `Product` | None | `orderId` | Commerce | `BUYER`, `SALES`, `ADMIN` |
| `OrderAssignment` (`order_assignments`) | Task assignment lifecycle records | `id` (uuid) | `assigneeOrganizationId` → `Organization` | None | `@@index([orderId, assignmentRole, status])`, `@@index([assigneeId, status])` | Operations | `SALES`, `SUPPLIER`, `LOGISTICS`, `AGENT`, `ADMIN` |
| `AssignmentEvent` (`assignment_events`) | Audit trail of assignment state changes | `id` (uuid) | `assignmentId` → `OrderAssignment`, `actorId` → `User` | None | `@@index([assignmentId, createdAt])` | Audit | All 6 Roles |
| `Conversation` (`conversations`) | Multi-participant order/sourcing chat thread | `id` (uuid) | `orderId` → `Order`, `sourcingRequestId` → `SourcingRequest` | None | `@@index([orderId])`, `@@index([sourcingRequestId])` | Messaging | All 6 Roles |
| `ConversationParticipant` (`conversation_participants`) | Joined users for conversation threads | `id` (uuid) | `conversationId` → `Conversation`, `userId` → `User` | `@@unique([conversationId, userId])` | `conversationId`, `userId` | Messaging | All 6 Roles |
| `Message` (`messages`) | Chat messages & confidential internal notes | `id` (uuid) | `conversationId` → `Conversation`, `senderId` → `User` | None | `conversationId`, `createdAt` | Messaging | All 6 Roles |
| `NotificationOutbox` (`notification_outbox`) | Transactional outbox for SMS/in-app events | `id` (uuid) | None | `idempotencyKey` | `@@index([status, createdAt])` | Notifications | System / Worker |
| `InAppNotification` (`in_app_notifications`) | In-app user notifications | `id` (uuid) | `userId` → `User` | None | `@@index([userId, isRead])` | Notifications | All 6 Roles |
| `AuditLog` (`audit_logs`) | Security audit log of actions & transitions | `id` (uuid) | `userId` → `User` | None | `userId`, `createdAt` | Security | `ADMIN` |

---

## 3. Atomic Transaction & Outbox Strategy

Every critical state mutation in Lumo adheres to a single atomic Prisma transaction:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update Domain Model (Order / Assignment) with Optimistic Concurrency Locking
  // 2. Create AuditLog entry
  // 3. Create NotificationOutbox entry with unique idempotencyKey
})
```

The BullMQ background worker polls `NotificationOutbox` records, dispatches external SMS via Meseji, creates `InAppNotification` records, and updates `NotificationOutbox.status` to `PROCESSED`.
