import { onRequest } from 'firebase-functions/v2/https';

/**
 * Health check endpoint for Cloud Functions v2.
 */
export const healthCheck = onRequest({ cors: true }, (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Contract Review Backend Functions v2',
    timestamp: new Date().toISOString(),
  });
});
