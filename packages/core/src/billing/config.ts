// ⚙️ EINMAL ANPASSEN — gilt für die gesamte SaaS
export const BILLING_CONFIG = {
  unitLabel:        'Minute',
  unitPrice:        0.05,       // € per minute (usage-based plan)
  currency:         '€',
  freeTierUnits:    30,
  monthlyFlatPrice: 9,          // € per month (flat plan)
} as const;

export type BillingConfig = typeof BILLING_CONFIG;
