-- Add admin policies for all user tables to allow import/export functionality

-- activity_logs
CREATE POLICY "Admins can manage all activity logs" 
ON public.activity_logs FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- agent_files
CREATE POLICY "Admins can manage all agent files" 
ON public.agent_files FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- analyzed_videos
CREATE POLICY "Admins can manage all analyzed videos" 
ON public.analyzed_videos FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- batch_generation_history
CREATE POLICY "Admins can manage all batch history" 
ON public.batch_generation_history FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- channel_analyses
CREATE POLICY "Admins can manage all channel analyses" 
ON public.channel_analyses FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- channel_goals
CREATE POLICY "Admins can manage all channel goals" 
ON public.channel_goals FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- folders
CREATE POLICY "Admins can manage all folders" 
ON public.folders FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- generated_audios
CREATE POLICY "Admins can manage all generated audios" 
ON public.generated_audios FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- generated_images
CREATE POLICY "Admins can manage all generated images" 
ON public.generated_images FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- generated_scripts
CREATE POLICY "Admins can manage all generated scripts" 
ON public.generated_scripts FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- generated_titles
CREATE POLICY "Admins can manage all generated titles" 
ON public.generated_titles FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- imagefx_monthly_usage
CREATE POLICY "Admins can manage all imagefx usage" 
ON public.imagefx_monthly_usage FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- monitored_channels
CREATE POLICY "Admins can manage all monitored channels" 
ON public.monitored_channels FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pinned_videos
CREATE POLICY "Admins can manage all pinned videos" 
ON public.pinned_videos FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pomodoro_state
CREATE POLICY "Admins can manage all pomodoro states" 
ON public.pomodoro_state FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- production_board_tasks
CREATE POLICY "Admins can manage all production tasks" 
ON public.production_board_tasks FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- publication_schedule
CREATE POLICY "Admins can manage all schedules" 
ON public.publication_schedule FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- push_subscriptions
CREATE POLICY "Admins can manage all push subscriptions" 
ON public.push_subscriptions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- reference_thumbnails
CREATE POLICY "Admins can manage all reference thumbnails" 
ON public.reference_thumbnails FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- saved_analytics_channels
CREATE POLICY "Admins can manage all saved analytics channels" 
ON public.saved_analytics_channels FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- saved_prompts
CREATE POLICY "Admins can manage all saved prompts" 
ON public.saved_prompts FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- scene_prompts
CREATE POLICY "Admins can manage all scene prompts" 
ON public.scene_prompts FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- schedule_reminders_sent
CREATE POLICY "Admins can manage all schedule reminders" 
ON public.schedule_reminders_sent FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- script_agents
CREATE POLICY "Admins can manage all script agents" 
ON public.script_agents FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- srt_history
CREATE POLICY "Admins can manage all srt history" 
ON public.srt_history FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- tags
CREATE POLICY "Admins can manage all tags" 
ON public.tags FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- title_tags
CREATE POLICY "Admins can manage all title tags" 
ON public.title_tags FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- video_tags
CREATE POLICY "Admins can manage all video tags" 
ON public.video_tags FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- task_completion_history
CREATE POLICY "Admins can manage all task history" 
ON public.task_completion_history FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_api_settings
CREATE POLICY "Admins can manage all api settings" 
ON public.user_api_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_credits
CREATE POLICY "Admins can manage all user credits" 
ON public.user_credits FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_goals
CREATE POLICY "Admins can manage all user goals" 
ON public.user_goals FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_individual_permissions
CREATE POLICY "Admins can manage all individual permissions" 
ON public.user_individual_permissions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_file_uploads
CREATE POLICY "Admins can manage all file uploads" 
ON public.user_file_uploads FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_kanban_settings
CREATE POLICY "Admins can manage all kanban settings" 
ON public.user_kanban_settings FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_preferences
CREATE POLICY "Admins can manage all user preferences" 
ON public.user_preferences FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- video_analyses
CREATE POLICY "Admins can manage all video analyses" 
ON public.video_analyses FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- video_generation_jobs
CREATE POLICY "Admins can manage all video jobs" 
ON public.video_generation_jobs FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- video_notifications
CREATE POLICY "Admins can manage all video notifications" 
ON public.video_notifications FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- viral_detection_usage
CREATE POLICY "Admins can manage all viral detection usage" 
ON public.viral_detection_usage FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- viral_library
CREATE POLICY "Admins can manage all viral library" 
ON public.viral_library FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- viral_monitoring_config
CREATE POLICY "Admins can manage all viral monitoring config" 
ON public.viral_monitoring_config FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- niche_best_times (allow admin insert/update/delete)
CREATE POLICY "Admins can manage niche best times" 
ON public.niche_best_times FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));