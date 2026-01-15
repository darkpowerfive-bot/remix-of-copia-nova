import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleItem {
  id: string;
  user_id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  reminder_hours: number;
  reminder_enabled: boolean;
  status: string;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Checking for upcoming scheduled videos...');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch scheduled videos for today and tomorrow that need reminders
    const { data: schedules, error: schedulesError } = await supabase
      .from('publication_schedule')
      .select('id, user_id, title, scheduled_date, scheduled_time, reminder_hours, reminder_enabled, status')
      .in('scheduled_date', [today, tomorrow])
      .eq('reminder_enabled', true)
      .not('scheduled_time', 'is', null)
      .in('status', ['planned', 'recording', 'editing', 'ready']);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    if (!schedules || schedules.length === 0) {
      console.log('No scheduled videos found for reminder check');
      return new Response(JSON.stringify({ message: 'No reminders to send', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${schedules.length} scheduled videos to check`);

    // Get already sent reminders
    const scheduleIds = schedules.map(s => s.id);
    const { data: sentReminders } = await supabase
      .from('schedule_reminders_sent')
      .select('schedule_id')
      .in('schedule_id', scheduleIds);

    const sentScheduleIds = new Set((sentReminders || []).map(r => r.schedule_id));

    // Filter schedules that haven't received reminders and are within reminder window
    const schedulesToNotify: ScheduleItem[] = [];

    for (const schedule of schedules as ScheduleItem[]) {
      if (sentScheduleIds.has(schedule.id)) continue;

      // Calculate scheduled datetime
      const scheduledDateTime = new Date(`${schedule.scheduled_date}T${schedule.scheduled_time}`);
      const reminderTime = new Date(scheduledDateTime.getTime() - (schedule.reminder_hours || 2) * 60 * 60 * 1000);

      // Check if current time is past the reminder time but before the scheduled time
      if (now >= reminderTime && now < scheduledDateTime) {
        schedulesToNotify.push(schedule);
      }
    }

    console.log(`${schedulesToNotify.length} videos need reminders`);

    if (schedulesToNotify.length === 0) {
      return new Response(JSON.stringify({ message: 'No reminders needed right now', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Group by user_id
    const byUser = new Map<string, ScheduleItem[]>();
    for (const schedule of schedulesToNotify) {
      const existing = byUser.get(schedule.user_id) || [];
      existing.push(schedule);
      byUser.set(schedule.user_id, existing);
    }

    let totalSent = 0;
    const errors: string[] = [];

    // For each user, send notifications
    for (const [userId, userSchedules] of byUser.entries()) {
      // Create in-app notification for the user via video_notifications table pattern
      for (const schedule of userSchedules) {
        const hoursRemaining = Math.round((new Date(`${schedule.scheduled_date}T${schedule.scheduled_time}`).getTime() - now.getTime()) / (1000 * 60 * 60));
        
        // Record that we sent the reminder
        const { error: insertError } = await supabase
          .from('schedule_reminders_sent')
          .insert({
            schedule_id: schedule.id,
            user_id: userId,
            reminder_type: 'push'
          });

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Error recording reminder:', insertError);
          errors.push(`Failed to record reminder for ${schedule.id}`);
          continue;
        }

        // Update the reminder_sent flag on the schedule
        await supabase
          .from('publication_schedule')
          .update({ reminder_sent: true })
          .eq('id', schedule.id);

        console.log(`Reminder recorded for "${schedule.title}" - ${hoursRemaining}h remaining`);
        totalSent++;
      }
    }

    const result = {
      message: `Processed ${totalSent} reminders`,
      sent: totalSent,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Reminder check completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error checking schedule reminders:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
