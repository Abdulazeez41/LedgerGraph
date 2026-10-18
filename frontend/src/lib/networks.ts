import { CustomerSummary, NetworkRing } from '@/api/types';

/**
 * Discovers contact-sharing rings and syndicates from the customer base.
 * Clusters entities that share phone numbers, emails, or physical addresses.
 */
export function discoverNetworkRings(customers: CustomerSummary[]): NetworkRing[] {
  const phoneMap = new Map<string, CustomerSummary[]>();
  const emailMap = new Map<string, CustomerSummary[]>();
  const addressMap = new Map<string, CustomerSummary[]>();

  for (const c of customers) {
    if (c.phone && c.phone.trim().length > 5) {
      const cleanPhone = c.phone.replace(/[^0-9+]/g, '');
      const list = phoneMap.get(cleanPhone) || [];
      list.push(c);
      phoneMap.set(cleanPhone, list);
    }

    if (c.email && c.email.includes('@')) {
      const cleanEmail = c.email.trim().toLowerCase();
      const list = emailMap.get(cleanEmail) || [];
      list.push(c);
      emailMap.set(cleanEmail, list);
    }

    if (c.address && c.address.trim().length > 6) {
      const cleanAddr = c.address.trim().toLowerCase();
      const list = addressMap.get(cleanAddr) || [];
      list.push(c);
      addressMap.set(cleanAddr, list);
    }
  }

  const rings: NetworkRing[] = [];
  let ringIndex = 1;

  // Process shared phones
  for (const [phone, members] of phoneMap.entries()) {
    if (members.length > 1) {
      rings.push(createRing(`RING-PH-${ringIndex++}`, 'phone', phone, members));
    }
  }

  // Process shared emails
  for (const [email, members] of emailMap.entries()) {
    if (members.length > 1) {
      rings.push(createRing(`RING-EM-${ringIndex++}`, 'email', email, members));
    }
  }

  // Process shared addresses
  for (const [address, members] of addressMap.entries()) {
    if (members.length > 1) {
      rings.push(createRing(`RING-AD-${ringIndex++}`, 'address', address, members));
    }
  }

  // Sort rings by highest overdue exposure first
  return rings.sort((a, b) => b.totalOverdue - a.totalOverdue || b.maxRiskScore - a.maxRiskScore);
}

function createRing(
  id: string,
  type: 'phone' | 'email' | 'address',
  sharedValue: string,
  members: CustomerSummary[]
): NetworkRing {
  const totalCreditLimit = members.reduce((sum, m) => sum + (m.credit_limit || 0), 0);
  const totalOverdue = members.reduce((sum, m) => sum + (m.overdue_balance || 0), 0);
  const maxRiskScore = Math.max(...members.map((m) => m.risk_score || 0));

  return {
    id,
    type,
    sharedValue,
    members,
    totalCreditLimit,
    totalOverdue,
    maxRiskScore,
  };
}
