export const isRootPath = () => window.location.pathname === '/';

export const isSlowNetwork = () => navigator.connection
    ? navigator.connection.saveData ||
    (navigator.connection.type !== 'wifi' &&
        navigator.connection.type !== 'ethernet' &&
        /([23])g/.test(navigator.connection.effectiveType))
    : false;
