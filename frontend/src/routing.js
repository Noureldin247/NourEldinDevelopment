export function getPathForRole(role) {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'hr') {
    return '/hr';
  }

  return '/';
}

export function getViewFromPath(pathname) {
  if (pathname === '/admin') {
    return 'admin';
  }

  if (pathname === '/hr') {
    return 'hr';
  }

  return 'login';
}
