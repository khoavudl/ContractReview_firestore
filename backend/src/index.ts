import { setGlobalOptions } from 'firebase-functions/v2';
import { getFirebaseAdmin } from './config/firebaseAdmin.js';

// Pre-initialize Firebase Admin SDK singleton before registering functions
getFirebaseAdmin();

// Enforce asia-southeast1 (Singapore) region globally for all Cloud Functions v2
setGlobalOptions({ region: 'asia-southeast1' });

export { healthCheck } from './functions/healthCheck.js';
export { onUserDocWrite } from './functions/auth/onUserDocWrite.js';
export { deleteContract } from './functions/contracts/deleteContract.js';
export { onContractStatusChanged } from './functions/contracts/onContractStatusChanged.js';
// Temporarily excluded per user requirement (will be enabled when needed):
// export { analyzeContractAI } from './functions/ai/analyzeContractAI.js';
// export { sendContractEmail } from './functions/email/sendContractEmail.js';


