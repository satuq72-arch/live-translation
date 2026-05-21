// ⚙️ EINMAL ANPASSEN — gilt für die gesamte SaaS
export const BILLING_CONFIG = {
  unitLabel:             'Minute',
  unitPrice:             0.05,   // € per minute (usage-based plan)
  currency:              '€',
  freeTierUnits:         30,
  monthlyFlatPrice:      19,     // € per month (flat plan)
  monthlyIncludedUnits:  800,    // minutes included in flat plan
  overageUnitPrice:      0.03,   // € per minute beyond included units
} as const;

export type BillingConfig = typeof BILLING_CONFIG;
