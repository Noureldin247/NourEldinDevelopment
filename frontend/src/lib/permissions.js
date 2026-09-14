// مستويات الصلاحيات — الإدارة أعلى، والموارد البشرية تتولى كل المهام التشغيلية الأخرى
// Role hierarchy levels — admin on top; HR covers every other operational role.
export const ROLE_LEVELS = {
  admin: 2,
  hr: 1,
};

export function isAdmin(role) {
  return role === 'admin';
}

export function hasMinimumLevel(role, requiredLevel) {
  return (ROLE_LEVELS[role] ?? 0) >= requiredLevel;
}

// الإدارة تصل لأي قسم دايمًا، حتى لو مش مذكورة صراحةً في allowedRoles
// Admin can always access every module, even when not explicitly listed in allowedRoles.
export function canAccessModule(role, allowedRoles) {
  return isAdmin(role) || allowedRoles.includes(role);
}
