# Viki pets Security Specification (Phase 0)

## 1. Data Invariants
- Every `Product` document in `/products/{productId}` must contain strictly the allowed fields (`name`, `price`, `stock`, `imageUrl`, `isPublic`, `createdAt`, `updatedAt`, and optional `rarities`).
- `name` must be a non-empty string (`1..80` chars), `price` a non-negative number (`0..1000000`), `stock` a non-negative integer (`0..100000`), `imageUrl` a string up to `400000` chars, and optional `rarities` a bounded list (`<= 4`) allowing only `['F', 'R', 'N', 'M']`.
- `createdAt` and `updatedAt` must match `request.time` on creation, and `createdAt` is immutable on update.
- Public visitors can read/list products where `resource.data.isPublic == true`.
- Creating, updating, or deleting products and `/meta/catalog` requires Firebase authentication via an anonymous session unlocked by server-side `ADMIN_PASSWORD` verification or a verified store administrator (`canManageCatalog()`).

## 2. Dirty Dozen Payloads
1. Unauthenticated `create` on `/products/p1` -> `PERMISSION_DENIED`
2. Non-admin verified user `create` on `/products/p1` -> `PERMISSION_DENIED`
3. Unverified email admin spoof (`email_verified: false`) `create` on `/products/p1` -> `PERMISSION_DENIED`
4. Shadow field injection (`{ ...validProduct, isAdmin: true }`) -> `PERMISSION_DENIED`
5. Missing required field (`stock` omitted) -> `PERMISSION_DENIED`
6. Invalid `name` (`""` or 200-char string) -> `PERMISSION_DENIED`
7. Negative `price` (`-50`) -> `PERMISSION_DENIED`
8. Non-integer or negative `stock` (`-1` or `1.5`) -> `PERMISSION_DENIED`
9. Oversized `imageUrl` (> 400KB) -> `PERMISSION_DENIED`
10. Client-forged `createdAt` timestamp != `request.time` -> `PERMISSION_DENIED`
11. Unauthenticated or non-admin `delete` on `/products/p1` -> `PERMISSION_DENIED`
12. Unauthenticated `list` on `/products` without `where('isPublic', '==', true)` -> `PERMISSION_DENIED`
