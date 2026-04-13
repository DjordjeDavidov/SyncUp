export const communityRoleOrder = ["OWNER", "ADMIN", "MODERATOR", "MEMBER"] as const;

export type CommunityRole = (typeof communityRoleOrder)[number];

export function getCommunityRoleRank(role: CommunityRole) {
  return communityRoleOrder.indexOf(role);
}

export function canEditCommunity(role: CommunityRole | null | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageCommunityMembers(role: CommunityRole | null | undefined) {
  return role === "OWNER" || role === "ADMIN" || role === "MODERATOR";
}

export function canAssignCommunityRoles(role: CommunityRole | null | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function canPostInCommunity(role: CommunityRole | null | undefined) {
  return Boolean(role);
}

export function getManageableRoles(actorRole: CommunityRole | null | undefined) {
  if (actorRole === "OWNER") {
    return communityRoleOrder.filter((role) => role !== "OWNER");
  }

  if (actorRole === "ADMIN") {
    return ["MODERATOR", "MEMBER"] as const;
  }

  return [] as const;
}

export function canChangeCommunityRole(args: {
  actorRole: CommunityRole | null | undefined;
  targetRole: CommunityRole;
  nextRole: CommunityRole;
  isSelf: boolean;
}) {
  const { actorRole, targetRole, nextRole, isSelf } = args;

  if (!actorRole || isSelf || nextRole === "OWNER") {
    return false;
  }

  if (actorRole === "OWNER") {
    return targetRole !== "OWNER";
  }

  if (actorRole === "ADMIN") {
    return (targetRole === "MODERATOR" || targetRole === "MEMBER") && (nextRole === "MODERATOR" || nextRole === "MEMBER");
  }

  return false;
}

export function canRemoveCommunityMember(args: {
  actorRole: CommunityRole | null | undefined;
  targetRole: CommunityRole;
  isSelf: boolean;
}) {
  const { actorRole, targetRole, isSelf } = args;

  if (!actorRole || isSelf) {
    return false;
  }

  if (actorRole === "OWNER") {
    return targetRole !== "OWNER";
  }

  if (actorRole === "ADMIN") {
    return targetRole === "MODERATOR" || targetRole === "MEMBER";
  }

  if (actorRole === "MODERATOR") {
    return targetRole === "MEMBER";
  }

  return false;
}
