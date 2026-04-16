// ⚙️ EINMAL ANPASSEN — gilt für die gesamte SaaS
export const BILLING_CONFIG = {
  unitLabel:      'Minute',    // → 'API Call' | 'Token' | 'Row' | ...
  unitPrice:      0.05,        // € pro Einheit
  currency:       '€',
  freeTierUnits:  30,          // kostenlose Einheiten (einmalig pro User)
  billingCycle:   'monthly',
} as const;

export type BillingConfig = typeof BILLING_CONFIG;
