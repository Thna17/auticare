export const openApiDocument = {
  openapi: '3.0.3',
  info: { title: 'AutiCare API', version: '0.1.0' },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/auth/register': { post: { summary: 'Register parent' } },
    '/auth/login': { post: { summary: 'Login parent' } },
    '/auth/forgot-password': { post: { summary: 'Request password reset' } },
    '/auth/reset-password': { post: { summary: 'Reset password' } },
    '/auth/logout': { post: { summary: 'Logout parent' } },
    '/auth/me': { get: { summary: 'Current parent' } },
    '/children': { get: { summary: 'List current parent children' } },
  },
};
