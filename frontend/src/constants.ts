/**
 * Merchant Category Code (MCC) options surfaced in the UI.
 * Qualified codes match the backend mcc.ts allowlist (IRS Publication 502).
 */
export const MCC_OPTIONS = [
  // --- Qualified medical expenses ---
  { code: '5912', label: 'Pharmacy', qualified: true },
  { code: '8062', label: 'Hospital', qualified: true },
  { code: '8011', label: "Doctor's Office", qualified: true },
  { code: '8021', label: 'Dentist', qualified: true },
  { code: '8042', label: 'Optometrist', qualified: true },
  { code: '5047', label: 'Medical Supplies', qualified: true },
  // --- Not qualified ---
  { code: '5812', label: 'Restaurant', qualified: false },
  { code: '5411', label: 'Grocery Store', qualified: false },
  { code: '5732', label: 'Electronics Store', qualified: false },
  { code: '5999', label: 'General Retail', qualified: false },
] as const;

export type MccCode = (typeof MCC_OPTIONS)[number]['code'];
