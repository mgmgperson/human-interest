/**
 * Merchant Category Code (MCC) qualification for HSA purchases.
 *
 * MCCs are 4-digit codes assigned by card networks to classify merchants.
 * The IRS defines which expense categories are eligible for HSA reimbursement.
 * This list covers the most common qualified medical MCCs.
 *
 * Reference: IRS Publication 502 + Visa/Mastercard MCC reference
 */

const QUALIFIED_MCC_CODES = new Set([
  // Pharmacies & drug stores
  '5912',
  // Hospitals
  '8062',
  '8063',
  '8064',
  // Doctors & physicians
  '8011',
  // Dentists & orthodontists
  '8021',
  // Optometrists & ophthalmologists
  '8042',
  // Chiropractors
  '8041',
  // Medical laboratories
  '8071',
  // Nursing & personal care facilities
  '8049',
  // Health practitioners (general)
  '8099',
  // Medical equipment & supplies
  '5047',
  '5122',
  // Mental health services
  '8049',
]);

/** Returns true if the given MCC code is a qualified HSA medical expense. */
export function isQualifiedMedicalExpense(mccCode: string): boolean {
  return QUALIFIED_MCC_CODES.has(mccCode);
}

/**
 * Returns a human-readable category label for a given MCC code.
 * Used to display the merchant type in the transaction history UI.
 */
export function getMccLabel(mccCode: string): string {
  const labels: Record<string, string> = {
    '5912': 'Pharmacy',
    '8062': 'Hospital',
    '8063': 'Hospital',
    '8064': 'Hospital',
    '8011': 'Doctor / Physician',
    '8021': 'Dentist',
    '8042': 'Optometrist',
    '8041': 'Chiropractor',
    '8071': 'Medical Laboratory',
    '8049': 'Health Practitioner',
    '8099': 'Health Practitioner',
    '5047': 'Medical Supplies',
    '5122': 'Medical Supplies',
    '5812': 'Restaurant',
    '5411': 'Grocery Store',
    '5732': 'Electronics',
    '5999': 'General Retail',
  };
  return labels[mccCode] ?? 'Unknown Merchant';
}
