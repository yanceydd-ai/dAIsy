export const SAFETY_OFFICER = 'SAFETY_OFFICER' as const;
export const ACTIVITIES_COORDINATOR = 'ACTIVITIES_COORDINATOR' as const;
export const IT_ADMIN = 'IT_ADMIN' as const;
export const COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER' as const;

export type Role =
  | typeof SAFETY_OFFICER
  | typeof ACTIVITIES_COORDINATOR
  | typeof IT_ADMIN
  | typeof COMPLIANCE_OFFICER;

// Maps Azure AD group object IDs (from env) to application roles.
// Returns the first matched role when a user is in multiple groups.
export function getRoleFromGroups(groups: string[]): Role | null {
  const mapping: Array<{ envVar: string; role: Role }> = [
    { envVar: 'AZURE_GROUP_SAFETY_OFFICERS', role: SAFETY_OFFICER },
    { envVar: 'AZURE_GROUP_ACTIVITIES_COORDINATORS', role: ACTIVITIES_COORDINATOR },
    { envVar: 'AZURE_GROUP_IT_ADMINS', role: IT_ADMIN },
    { envVar: 'AZURE_GROUP_COMPLIANCE_OFFICERS', role: COMPLIANCE_OFFICER },
  ];

  for (const { envVar, role } of mapping) {
    const groupId = process.env[envVar];
    if (groupId && groups.includes(groupId)) {
      return role;
    }
  }

  return null;
}
