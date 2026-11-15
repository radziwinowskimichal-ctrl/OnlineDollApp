/**
 * Office permission matrix — single source of truth.
 * Mirrored (and enforced) in `lib/context.tsx` via `canManage()`.
 *
 * Office users  = role "admin" + role "employee" (Erwin, Steffi, BOSS)
 * Mechanics     = role "mechanic" — no access to office data at all (GDPR/RODO isolation)
 */

export const OFFICE_MANAGEABLE_ACTIONS = [
  "fleet.edit", // add / edit / delete trailers, reset fleet, service status
  "reservation.edit", // edit + delete reservations
  "client.edit", // edit + delete clients
  "client.balance", // balance corrections
  "workshop.delete", // delete workshop orders
  "data.restore", // restore / delete backups
  "settings.edit", // status colours & app settings
  "profile.manage", // add / delete employee + mechanic profiles
] as const;

export type OfficeAction = (typeof OFFICE_MANAGEABLE_ACTIONS)[number];

/** Returns true when the given role may run the action. */
export function canRoleManage(role: "admin" | "employee" | "mechanic" | null | undefined, action: OfficeAction): boolean {
  if (role !== "admin" && role !== "employee") return false;
  return OFFICE_MANAGEABLE_ACTIONS.includes(action);
}

/** Mechanic-safe data scope: mechanics never receive clients/reservations/backups. */
export function isOfficeRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "employee";
}
