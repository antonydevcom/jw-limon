export const appRoles = ["admin", "viewer"] as const;

export type AppRole = (typeof appRoles)[number];

export function isAppRole(value: string): value is AppRole {
  return appRoles.includes(value as AppRole);
}
