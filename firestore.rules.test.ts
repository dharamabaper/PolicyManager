/**
 * Adversarial Security Rules Specification Runner ("Dirty Dozen" Verification)
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  authUid: string | null;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Agent Profile',
    operation: 'create',
    path: '/agents/agent_B',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { uid: 'agent_B', fullName: 'Spoofer' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoofing',
    operation: 'create',
    path: '/agents/agent_A',
    authUid: 'agent_A',
    emailVerified: false,
    payload: { uid: 'agent_A', fullName: 'Unverified' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'PII Blanket Read on Another Agent Profile',
    operation: 'get',
    path: '/agents/agent_B',
    authUid: 'agent_A',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Agent Profile',
    operation: 'create',
    path: '/agents/agent_A',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { uid: 'agent_A', isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Orphaned Policy Creation Without Agent Profile',
    operation: 'create',
    path: '/policies/pol_1',
    authUid: 'agent_without_profile',
    emailVerified: true,
    payload: { agentId: 'agent_without_profile', policyNumber: '891234567' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-Agent Policy Injection',
    operation: 'create',
    path: '/policies/pol_1',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { agentId: 'agent_B', policyNumber: '891234567' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unconstrained List Scraping on Policies',
    operation: 'list',
    path: '/policies',
    authUid: 'agent_B',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial of Wallet Oversized String',
    operation: 'create',
    path: '/policies/pol_1',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { agentId: 'agent_A', customerName: 'X'.repeat(500) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/policies/bad$id!',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { agentId: 'agent_A' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable Field Tampering on Update',
    operation: 'update',
    path: '/policies/pol_1',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { agentId: 'agent_B' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Forged Client Timestamp on Update',
    operation: 'update',
    path: '/policies/pol_1',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { updatedAt: '2099-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Invalid Enum Status Value',
    operation: 'update',
    path: '/policies/pol_1',
    authUid: 'agent_A',
    emailVerified: true,
    payload: { status: 'InvalidStatus' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
