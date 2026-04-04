export const getRoleHomeRoute = (role) => {
    if (role === 'admin') return '/dashboard';
    if (role === 'staff') return '/pos';
    if (role === 'kitchen') return '/kitchen';
    return '/';
};
