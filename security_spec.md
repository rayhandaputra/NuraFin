# Security Specification for Finance App

## Data Invariants
1. A user can only read and write their own profile document.
2. Budget items must belong to a specific month/year subcollection under the authenticated user's ID.
3. Monthly income must be a positive number.
4. Status can only be "Lunas" or "Belum dibayar".
5. Deadline must be a valid future or past timestamp.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Attempt to update another user's profile.
2. Attempt to create a budget item with a status other than "Lunas" or "Belum dibayar".
3. Attempt to set `monthlyIncome` to a negative number.
4. Attempt to write a budget item with a missing `amount` field.
5. Attempt to inject a 2MB string into the budget item `name`.
6. Attempt to update the `userId` in a profile document (immutability test).
7. Attempt to list budget items of another user.
8. Attempt to bypass `isValidId` by using a 300-character document ID.
9. Attempt to update a budget item's `amount` to a non-number type.
10. Attempt to create a budget item without being authenticated.
11. Attempt to spoof an admin role by adding an `isAdmin` field to a user document.
12. Attempt to update a budget item but changing the `deadline` to something that isn't a timestamp.

## Red Team Audit Checklist
- [ ] Identity Spoofing (Blocked by `request.auth.uid` comparison)
- [ ] State Shortcutting (Blocked by `affectedKeys().hasOnly()` gates)
- [ ] Resource Poisoning (Blocked by `.size()` and type checks)
- [ ] Orphaned Writes (Blocked by collection nesting under owner ID)
