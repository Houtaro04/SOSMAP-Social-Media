import { apiGet } from './api';

export async function debugParticipants() {
  try {
    const res = await apiGet<any>('/ConversationParticipant', { limit: 10 });
    console.log('[DEBUG] Participants sample:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('[DEBUG] Error:', e);
  }
}
