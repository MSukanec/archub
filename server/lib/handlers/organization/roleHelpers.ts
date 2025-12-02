const PRIVILEGED_ROLE_NAMES = [
  'owner',
  'propietario',
  'admin',
  'administrador',
  'administrator',
];

const OWNER_ROLE_NAMES = [
  'owner',
  'propietario',
];

export function isPrivilegedRole(roleName: string): boolean {
  const normalizedName = (roleName || '').toLowerCase().trim();
  return PRIVILEGED_ROLE_NAMES.some(privileged => 
    normalizedName === privileged || normalizedName.includes(privileged)
  );
}

export function isOwnerRole(roleName: string): boolean {
  const normalizedName = (roleName || '').toLowerCase().trim();
  return OWNER_ROLE_NAMES.some(owner => 
    normalizedName === owner || normalizedName.includes(owner)
  );
}
