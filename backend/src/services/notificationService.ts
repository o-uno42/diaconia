import { supabase } from '../lib/supabase';

/**
 * Create a notification for a user.
 * Called from routes on task completion, task booking, etc.
 */
export async function createNotification(userId: string, message: string): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    message,
    read: false,
  });
}
