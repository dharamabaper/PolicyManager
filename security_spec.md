# Security Specification — BimaCalc Studio (LIC Agent CRM & Actuarial Suite)

## 1. Data Invariants
1. **Global Default Deny**: Any path not explicitly matched under `/agents/{agentId}` or `/policies/{policyId}` is denied for all reads and writes.
2. **Verified Authentication Gate**: All read and write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Agent Profile Ownership (`/agents/{agentId}`)**:
   - Document ID `agentId` must strictly match `request.auth.uid` and `isValidId(agentId)`.
   - `incoming().uid == request.auth.uid`.
   - PII Isolation: Only the owner (`request.auth.uid == agentId`) can `get`, `create`, or `update` their own agent profile. `list` and `delete` are forbidden on `/agents/{agentId}`.
4. **Customer Policy Ownership & Relational Integrity (`/policies/{policyId}`)**:
   - Every policy must have `agentId == request.auth.uid` and require that `/databases/$(database)/documents/agents/$(request.auth.uid)` exists (`exists(...)`) upon creation.
   - `get`, `list`, `update`, and `delete` are strictly restricted to policies where `resource.data.agentId == request.auth.uid`.
   - `createdAt`, `agentId`, and `policyNumber` are immutable after creation.
   - Server timestamps (`request.time`) are strictly enforced for `createdAt` (on create) and `updatedAt` (on create and update).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Identity Spoofing on Agent Profile)**: Authenticated user `agent_A` attempts to create `/agents/agent_B` with `uid: "agent_B"`. -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Spoofing)**: User with `email_verified: false` attempts to create `/agents/agent_A`. -> `PERMISSION_DENIED`.
3. **Payload 3 (PII Blanket Read on Agents)**: Authenticated user `agent_A` attempts `get(/agents/agent_B)` or `list(/agents)`. -> `PERMISSION_DENIED`.
4. **Payload 4 (Shadow Field Injection on Agent Profile)**: User sends valid `/agents/agent_A` payload plus `isAdmin: true`. Rejected by `.keys().hasOnly(...)`. -> `PERMISSION_DENIED`.
5. **Payload 5 (Orphaned Customer Policy Creation)**: User `agent_no_profile` attempts to create `/policies/pol_1` before creating `/agents/agent_no_profile`. Rejected by `exists(/agents/$(request.auth.uid))`. -> `PERMISSION_DENIED`.
6. **Payload 6 (Cross-Agent Policy Injection)**: User `agent_A` attempts to create `/policies/pol_1` with `agentId: "agent_B"`. -> `PERMISSION_DENIED`.
7. **Payload 7 (Unauthorized Query Scraping on Policies)**: User `agent_A` issues an unconstrained `list(/policies)` query without `where('agentId', '==', 'agent_A')`. Rejected by `resource.data.agentId == request.auth.uid`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Denial of Wallet / Oversized String)**: User sends a 10KB string in `customerName` (exceeding `maxLength: 100`). -> `PERMISSION_DENIED`.
9. **Payload 9 (ID Poisoning Attack)**: User attempts to create `/policies/invalid$id!@#` failing `isValidId(policyId)`. -> `PERMISSION_DENIED`.
10. **Payload 10 (Immutable Field Tampering)**: User attempts to update `createdAt` or `agentId` on an existing `/policies/pol_1`. -> `PERMISSION_DENIED`.
11. **Payload 11 (Forged Client Timestamp)**: User sends a past or future timestamp instead of `request.time` for `updatedAt`. -> `PERMISSION_DENIED`.
12. **Payload 12 (Invalid Enum State)**: User attempts to set `status: "HackedStatus"` not in `['Active', 'Grace Period', 'Lapsed', 'Matured']`. -> `PERMISSION_DENIED`.
