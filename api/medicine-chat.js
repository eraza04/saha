import { generateText, streamText } from 'ai';
import { createMedicineHandler } from '../lib/medicine-chat.mjs';
import { resolveChatModel } from '../lib/chat-provider.mjs';

// One Web Standard handler, shared with local development. Disabled until configured.
export default { fetch:createMedicineHandler({generate:generateText,stream:streamText,modelFor:resolveChatModel}) };
