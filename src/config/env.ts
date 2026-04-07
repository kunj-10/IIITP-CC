export const ENV = {
    PORT: Number(process.env.PORT) || 8080,
    CLIENT_ID: process.env.CLIENT_ID || 'demo-client-app',
    CLIENT_SECRET: process.env.CLIENT_SECRET || 'super-secret-key',
    AUTH_CODE_EXPIRATION_MS: 5 * 60 * 1000,
    ACCESS_TOKEN_EXPIRATION_S: 3600,
    DB_PATH: process.env.DB_PATH || (process.env.K_SERVICE ? '/tmp/users.sqlite' : 'users.sqlite')
};
