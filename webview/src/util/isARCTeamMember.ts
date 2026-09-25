/**
 * Utility to check if a user is a ARC team member
 */
export function isARCTeamMember(email?: string): boolean {
  if (!email) return false;
  return email.includes("@arc.dev");
}
