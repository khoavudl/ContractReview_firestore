import { setGlobalOptions } from 'firebase-functions/v2';

// Enforce asia-southeast1 (Singapore) region globally for all Cloud Functions v2
setGlobalOptions({ region: 'asia-southeast1' });

export { healthCheck } from './functions/healthCheck.js';
export { onUserDocWrite } from './functions/auth/onUserDocWrite.js';
export { deleteContract } from './functions/contracts/deleteContract.js';
export { analyzeContractAI } from './functions/ai/analyzeContractAI.js';
export { sendContractEmail } from './functions/email/sendContractEmail.js';

