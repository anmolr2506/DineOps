export const getRoleHomeRoute = (role) => {
    if (role === 'admin') return '/session-dashboard';
    if (role === 'staff') return '/session-dashboard';
    if (role === 'kitchen') return '/session-dashboard';
    return '/';
};
