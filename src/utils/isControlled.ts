/**
 * Returns true when the controlled_status indicates the party is controlled.
 * Accepted values (case-insensitive): 'C', 'Controlled', 'Y'
 */
export function isControlled(controlledStatus: string | null | undefined): boolean {
  if (!controlledStatus) return false;
  const normalized = controlledStatus.trim().toUpperCase();
  return normalized === 'C' || normalized === 'CONTROLLED' || normalized === 'Y';
}
