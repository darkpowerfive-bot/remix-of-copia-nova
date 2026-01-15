export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      agent_files: {
        Row: {
          agent_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "script_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      analyzed_videos: {
        Row: {
          analysis_data_json: Json | null
          analyzed_at: string | null
          channel_id: string | null
          created_at: string | null
          detected_microniche: string | null
          detected_niche: string | null
          detected_subniche: string | null
          folder_id: string | null
          id: string
          original_comments: number | null
          original_days: number | null
          original_thumbnail_url: string | null
          original_title: string | null
          original_views: number | null
          translated_title: string | null
          user_id: string
          video_url: string
          youtube_video_id: string | null
        }
        Insert: {
          analysis_data_json?: Json | null
          analyzed_at?: string | null
          channel_id?: string | null
          created_at?: string | null
          detected_microniche?: string | null
          detected_niche?: string | null
          detected_subniche?: string | null
          folder_id?: string | null
          id?: string
          original_comments?: number | null
          original_days?: number | null
          original_thumbnail_url?: string | null
          original_title?: string | null
          original_views?: number | null
          translated_title?: string | null
          user_id: string
          video_url: string
          youtube_video_id?: string | null
        }
        Update: {
          analysis_data_json?: Json | null
          analyzed_at?: string | null
          channel_id?: string | null
          created_at?: string | null
          detected_microniche?: string | null
          detected_niche?: string | null
          detected_subniche?: string | null
          folder_id?: string | null
          id?: string
          original_comments?: number | null
          original_days?: number | null
          original_thumbnail_url?: string | null
          original_title?: string | null
          original_views?: number | null
          translated_title?: string | null
          user_id?: string
          video_url?: string
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyzed_videos_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      api_providers: {
        Row: {
          created_at: string | null
          credits_per_unit: number
          id: string
          is_active: number
          is_default: number
          is_premium: number
          markup: number
          model: string
          name: string
          provider: string
          real_cost_per_unit: number
          unit_size: number
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_per_unit?: number
          id?: string
          is_active?: number
          is_default?: number
          is_premium?: number
          markup?: number
          model: string
          name: string
          provider: string
          real_cost_per_unit?: number
          unit_size?: number
          unit_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_per_unit?: number
          id?: string
          is_active?: number
          is_default?: number
          is_premium?: number
          markup?: number
          model?: string
          name?: string
          provider?: string
          real_cost_per_unit?: number
          unit_size?: number
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      batch_generation_history: {
        Row: {
          created_at: string
          id: string
          prompt_count: number
          prompts: string
          style_id: string | null
          style_name: string | null
          success_count: number | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_count?: number
          prompts: string
          style_id?: string | null
          style_name?: string | null
          success_count?: number | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_count?: number
          prompts?: string
          style_id?: string | null
          style_name?: string | null
          success_count?: number | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          meta_description: string | null
          meta_keywords: string[] | null
          product_cta: string | null
          product_title: string | null
          product_url: string | null
          published_at: string | null
          read_time: string | null
          seo_score: number | null
          slug: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          product_cta?: string | null
          product_title?: string | null
          product_url?: string | null
          published_at?: string | null
          read_time?: string | null
          seo_score?: number | null
          slug: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          product_cta?: string | null
          product_title?: string | null
          product_url?: string | null
          published_at?: string | null
          read_time?: string | null
          seo_score?: number | null
          slug?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      blog_page_views: {
        Row: {
          article_id: string | null
          id: string
          page_path: string
          referrer: string | null
          user_agent: string | null
          view_date: string
          viewed_at: string
          visitor_hash: string
        }
        Insert: {
          article_id?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          user_agent?: string | null
          view_date?: string
          viewed_at?: string
          visitor_hash: string
        }
        Update: {
          article_id?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          user_agent?: string | null
          view_date?: string
          viewed_at?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_page_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_analyses: {
        Row: {
          analysis_result: Json | null
          channels: Json
          created_at: string
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          channels?: Json
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          channels?: Json
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      channel_goals: {
        Row: {
          channel_url: string
          completed_at: string | null
          created_at: string
          current_value: number | null
          deadline: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          period_key: string | null
          period_type: string
          start_value: number | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_url: string
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          period_key?: string | null
          period_type?: string
          start_value?: number | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_url?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          period_key?: string | null
          period_type?: string
          start_value?: number | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          display_order: number | null
          id: string
          is_active: boolean | null
          label: string | null
          price: number
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          price: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          price?: number
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_usage: {
        Row: {
          created_at: string | null
          credits_used: number
          details: Json | null
          id: string
          model_used: string | null
          operation_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used: number
          details?: Json | null
          id?: string
          model_used?: string | null
          operation_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number
          details?: Json | null
          id?: string
          model_used?: string | null
          operation_type?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          subject: string
          template_type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject: string
          template_type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string
          template_type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string | null
          id: string
          items_count: number | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items_count?: number | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items_count?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_audios: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration: number | null
          id: string
          text: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          text: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          text?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          image_url: string | null
          prompt: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          prompt: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          prompt?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_scripts: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string | null
          credits_used: number
          duration: number
          id: string
          language: string
          model_used: string | null
          title: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string | null
          credits_used?: number
          duration?: number
          id?: string
          language?: string
          model_used?: string | null
          title: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string | null
          credits_used?: number
          duration?: number
          id?: string
          language?: string
          model_used?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_scripts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "script_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_titles: {
        Row: {
          created_at: string | null
          explicacao: string | null
          folder_id: string | null
          formula: string | null
          id: string
          is_favorite: boolean | null
          is_used: boolean | null
          model_used: string | null
          pontuacao: number | null
          title_text: string
          user_id: string
          video_analysis_id: string | null
        }
        Insert: {
          created_at?: string | null
          explicacao?: string | null
          folder_id?: string | null
          formula?: string | null
          id?: string
          is_favorite?: boolean | null
          is_used?: boolean | null
          model_used?: string | null
          pontuacao?: number | null
          title_text: string
          user_id: string
          video_analysis_id?: string | null
        }
        Update: {
          created_at?: string | null
          explicacao?: string | null
          folder_id?: string | null
          formula?: string | null
          id?: string
          is_favorite?: boolean | null
          is_used?: boolean | null
          model_used?: string | null
          pontuacao?: number | null
          title_text?: string
          user_id?: string
          video_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_titles_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_titles_video_analysis_id_fkey"
            columns: ["video_analysis_id"]
            isOneToOne: false
            referencedRelation: "analyzed_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      imagefx_monthly_usage: {
        Row: {
          created_at: string
          id: string
          images_generated: number
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          images_generated?: number
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          images_generated?: number
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      migration_invites: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_amount: number
          email: string
          expires_at: string | null
          full_name: string | null
          id: string
          invited_by: string | null
          notes: string | null
          plan_name: string
          sent_at: string | null
          status: string
          token: string
          whatsapp: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_amount?: number
          email: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          plan_name?: string
          sent_at?: string | null
          status?: string
          token?: string
          whatsapp?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_amount?: number
          email?: string
          expires_at?: string | null
          full_name?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          plan_name?: string
          sent_at?: string | null
          status?: string
          token?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      monitored_channels: {
        Row: {
          channel_name: string | null
          channel_url: string
          created_at: string | null
          growth_rate: string | null
          id: string
          last_checked: string | null
          last_video_id: string | null
          micronicho: string | null
          niche: string | null
          notify_new_videos: boolean | null
          subniche: string | null
          subscribers: string | null
          user_id: string
          videos_count: number | null
        }
        Insert: {
          channel_name?: string | null
          channel_url: string
          created_at?: string | null
          growth_rate?: string | null
          id?: string
          last_checked?: string | null
          last_video_id?: string | null
          micronicho?: string | null
          niche?: string | null
          notify_new_videos?: boolean | null
          subniche?: string | null
          subscribers?: string | null
          user_id: string
          videos_count?: number | null
        }
        Update: {
          channel_name?: string | null
          channel_url?: string
          created_at?: string | null
          growth_rate?: string | null
          id?: string
          last_checked?: string | null
          last_video_id?: string | null
          micronicho?: string | null
          niche?: string | null
          notify_new_videos?: boolean | null
          subniche?: string | null
          subscribers?: string | null
          user_id?: string
          videos_count?: number | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      niche_best_times: {
        Row: {
          best_days: string[] | null
          best_hours: string[] | null
          created_at: string | null
          id: string
          niche: string
          reasoning: string | null
        }
        Insert: {
          best_days?: string[] | null
          best_hours?: string[] | null
          created_at?: string | null
          id?: string
          niche: string
          reasoning?: string | null
        }
        Update: {
          best_days?: string[] | null
          best_hours?: string[] | null
          created_at?: string | null
          id?: string
          niche?: string
          reasoning?: string | null
        }
        Relationships: []
      }
      pinned_videos: {
        Row: {
          channel_id: string | null
          created_at: string
          id: string
          likes: string | null
          published_at: string | null
          thumbnail_url: string | null
          title: string | null
          user_id: string
          video_id: string
          video_url: string
          views: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          id?: string
          likes?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
          user_id: string
          video_id: string
          video_url: string
          views?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          id?: string
          likes?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string
          video_id?: string
          video_url?: string
          views?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pinned_videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "monitored_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_permissions: {
        Row: {
          created_at: string | null
          id: string
          imagefx_monthly_limit: number | null
          is_annual: boolean | null
          monthly_credits: number | null
          permissions: Json
          plan_name: string
          price_amount: number | null
          storage_limit_gb: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imagefx_monthly_limit?: number | null
          is_annual?: boolean | null
          monthly_credits?: number | null
          permissions?: Json
          plan_name: string
          price_amount?: number | null
          storage_limit_gb?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imagefx_monthly_limit?: number | null
          is_annual?: boolean | null
          monthly_credits?: number | null
          permissions?: Json
          plan_name?: string
          price_amount?: number | null
          storage_limit_gb?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pomodoro_state: {
        Row: {
          break_duration: number
          completed_sessions: number
          created_at: string
          id: string
          is_running: boolean
          last_updated_at: string
          long_break_duration: number
          session_type: string
          time_left: number
          user_id: string
          work_duration: number
        }
        Insert: {
          break_duration?: number
          completed_sessions?: number
          created_at?: string
          id?: string
          is_running?: boolean
          last_updated_at?: string
          long_break_duration?: number
          session_type?: string
          time_left?: number
          user_id: string
          work_duration?: number
        }
        Update: {
          break_duration?: number
          completed_sessions?: number
          created_at?: string
          id?: string
          is_running?: boolean
          last_updated_at?: string
          long_break_duration?: number
          session_type?: string
          time_left?: number
          user_id?: string
          work_duration?: number
        }
        Relationships: []
      }
      product_clicks: {
        Row: {
          article_id: string | null
          click_date: string
          clicked_at: string
          id: string
          product_title: string | null
          product_url: string
          referrer: string | null
          user_agent: string | null
          visitor_hash: string
        }
        Insert: {
          article_id?: string | null
          click_date?: string
          clicked_at?: string
          id?: string
          product_title?: string | null
          product_url: string
          referrer?: string | null
          user_agent?: string | null
          visitor_hash: string
        }
        Update: {
          article_id?: string | null
          click_date?: string
          clicked_at?: string
          id?: string
          product_title?: string | null
          product_url?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_clicks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_board_tasks: {
        Row: {
          column_id: string
          completed_at: string | null
          created_at: string
          id: string
          schedule_id: string | null
          task_order: number
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          column_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          schedule_id?: string | null
          task_order?: number
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          column_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          schedule_id?: string | null
          task_order?: number
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_board_tasks_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "publication_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          created_at: string | null
          credits: number | null
          email: string | null
          full_name: string | null
          id: string
          status: string | null
          storage_limit: number | null
          storage_used: number | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          status?: string | null
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string | null
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      publication_schedule: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          niche: string | null
          notes: string | null
          priority: string | null
          reminder_enabled: boolean | null
          reminder_hours: number | null
          reminder_sent: boolean | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          niche?: string | null
          notes?: string | null
          priority?: string | null
          reminder_enabled?: boolean | null
          reminder_hours?: number | null
          reminder_sent?: boolean | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          niche?: string | null
          notes?: string | null
          priority?: string | null
          reminder_enabled?: boolean | null
          reminder_hours?: number | null
          reminder_sent?: boolean | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reference_thumbnails: {
        Row: {
          channel_name: string | null
          created_at: string
          description: string | null
          extracted_prompt: string | null
          folder_id: string | null
          id: string
          image_url: string
          niche: string | null
          style_analysis: Json | null
          sub_niche: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          description?: string | null
          extracted_prompt?: string | null
          folder_id?: string | null
          id?: string
          image_url: string
          niche?: string | null
          style_analysis?: Json | null
          sub_niche?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          description?: string | null
          extracted_prompt?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string
          niche?: string | null
          style_analysis?: Json | null
          sub_niche?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_thumbnails_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_analytics_channels: {
        Row: {
          cached_data: Json | null
          channel_id: string
          channel_name: string
          channel_thumbnail: string | null
          channel_url: string
          created_at: string
          display_order: number | null
          id: string
          last_fetched_at: string | null
          notes: string | null
          notes_updated_at: string | null
          subscribers: number | null
          total_videos: number | null
          total_views: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cached_data?: Json | null
          channel_id: string
          channel_name: string
          channel_thumbnail?: string | null
          channel_url: string
          created_at?: string
          display_order?: number | null
          id?: string
          last_fetched_at?: string | null
          notes?: string | null
          notes_updated_at?: string | null
          subscribers?: number | null
          total_videos?: number | null
          total_views?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cached_data?: Json | null
          channel_id?: string
          channel_name?: string
          channel_thumbnail?: string | null
          channel_url?: string
          created_at?: string
          display_order?: number | null
          id?: string
          last_fetched_at?: string | null
          notes?: string | null
          notes_updated_at?: string | null
          subscribers?: number | null
          total_videos?: number | null
          total_views?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_prompts: {
        Row: {
          created_at: string | null
          folder_id: string | null
          id: string
          prompt: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          prompt: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder_id?: string | null
          id?: string
          prompt?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_prompts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_prompts: {
        Row: {
          created_at: string
          credits_used: number
          estimated_duration: string | null
          id: string
          model_used: string | null
          scenes: Json
          script: string
          style: string | null
          title: string | null
          total_scenes: number
          total_words: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          estimated_duration?: string | null
          id?: string
          model_used?: string | null
          scenes?: Json
          script: string
          style?: string | null
          title?: string | null
          total_scenes?: number
          total_words?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          estimated_duration?: string | null
          id?: string
          model_used?: string | null
          scenes?: Json
          script?: string
          style?: string | null
          title?: string | null
          total_scenes?: number
          total_words?: number
          user_id?: string
        }
        Relationships: []
      }
      schedule_reminders_sent: {
        Row: {
          id: string
          reminder_type: string | null
          schedule_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reminder_type?: string | null
          schedule_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reminder_type?: string | null
          schedule_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_reminders_sent_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "publication_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      script_agents: {
        Row: {
          based_on_title: string | null
          created_at: string
          formula: string | null
          formula_structure: Json | null
          id: string
          mental_triggers: string[] | null
          name: string
          niche: string | null
          preferred_model: string | null
          sub_niche: string | null
          times_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          based_on_title?: string | null
          created_at?: string
          formula?: string | null
          formula_structure?: Json | null
          id?: string
          mental_triggers?: string[] | null
          name: string
          niche?: string | null
          preferred_model?: string | null
          sub_niche?: string | null
          times_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          based_on_title?: string | null
          created_at?: string
          formula?: string | null
          formula_structure?: Json | null
          id?: string
          mental_triggers?: string[] | null
          name?: string
          niche?: string | null
          preferred_model?: string | null
          sub_niche?: string | null
          times_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      srt_history: {
        Row: {
          block_count: number | null
          created_at: string
          id: string
          original_text: string
          srt_content: string
          title: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          block_count?: number | null
          created_at?: string
          id?: string
          original_text: string
          srt_content: string
          title?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          block_count?: number | null
          created_at?: string
          id?: string
          original_text?: string
          srt_content?: string
          title?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      task_completion_history: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          task_title: string
          task_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          task_title: string
          task_type?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          task_title?: string
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      title_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          title_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          title_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "title_tags_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "generated_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_settings: {
        Row: {
          claude_api_key: string | null
          claude_validated: boolean | null
          created_at: string
          elevenlabs_api_key: string | null
          elevenlabs_validated: boolean | null
          gemini_api_key: string | null
          gemini_validated: boolean | null
          id: string
          imagefx_cookies: string | null
          imagefx_validated: boolean | null
          openai_api_key: string | null
          openai_validated: boolean | null
          updated_at: string
          use_platform_credits: boolean | null
          user_id: string
          video_check_frequency: string | null
          youtube_api_key: string | null
          youtube_validated: boolean | null
        }
        Insert: {
          claude_api_key?: string | null
          claude_validated?: boolean | null
          created_at?: string
          elevenlabs_api_key?: string | null
          elevenlabs_validated?: boolean | null
          gemini_api_key?: string | null
          gemini_validated?: boolean | null
          id?: string
          imagefx_cookies?: string | null
          imagefx_validated?: boolean | null
          openai_api_key?: string | null
          openai_validated?: boolean | null
          updated_at?: string
          use_platform_credits?: boolean | null
          user_id: string
          video_check_frequency?: string | null
          youtube_api_key?: string | null
          youtube_validated?: boolean | null
        }
        Update: {
          claude_api_key?: string | null
          claude_validated?: boolean | null
          created_at?: string
          elevenlabs_api_key?: string | null
          elevenlabs_validated?: boolean | null
          gemini_api_key?: string | null
          gemini_validated?: boolean | null
          id?: string
          imagefx_cookies?: string | null
          imagefx_validated?: boolean | null
          openai_api_key?: string | null
          openai_validated?: boolean | null
          updated_at?: string
          use_platform_credits?: boolean | null
          user_id?: string
          video_check_frequency?: string | null
          youtube_api_key?: string | null
          youtube_validated?: boolean | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_file_uploads: {
        Row: {
          bucket_name: string
          created_at: string | null
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          bucket_name: string
          created_at?: string | null
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          bucket_name?: string
          created_at?: string | null
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          end_date: string
          goal_type: string
          id: string
          is_completed: boolean | null
          period_type: string
          start_date: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          end_date: string
          goal_type: string
          id?: string
          is_completed?: boolean | null
          period_type: string
          start_date: string
          target_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          end_date?: string
          goal_type?: string
          id?: string
          is_completed?: boolean | null
          period_type?: string
          start_date?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_individual_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          permission_key: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          permission_key: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          permission_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_kanban_settings: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          weekly_goal?: number
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          directive_update_hours: number | null
          id: string
          notify_new_features: boolean | null
          notify_viral_videos: boolean | null
          notify_weekly_reports: boolean | null
          sidebar_order: string[] | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          directive_update_hours?: number | null
          id?: string
          notify_new_features?: boolean | null
          notify_viral_videos?: boolean | null
          notify_weekly_reports?: boolean | null
          sidebar_order?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          directive_update_hours?: number | null
          id?: string
          notify_new_features?: boolean | null
          notify_viral_videos?: boolean | null
          notify_weekly_reports?: boolean | null
          sidebar_order?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          analysis_data: Json | null
          comments: number | null
          created_at: string | null
          ctr: number | null
          engagement_rate: number | null
          id: string
          likes: number | null
          thumbnail_url: string | null
          user_id: string
          video_title: string | null
          video_url: string
          views: number | null
        }
        Insert: {
          analysis_data?: Json | null
          comments?: number | null
          created_at?: string | null
          ctr?: number | null
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          thumbnail_url?: string | null
          user_id: string
          video_title?: string | null
          video_url: string
          views?: number | null
        }
        Update: {
          analysis_data?: Json | null
          comments?: number | null
          created_at?: string | null
          ctr?: number | null
          engagement_rate?: number | null
          id?: string
          likes?: number | null
          thumbnail_url?: string | null
          user_id?: string
          video_title?: string | null
          video_url?: string
          views?: number | null
        }
        Relationships: []
      }
      video_generation_jobs: {
        Row: {
          aspect_ratio: string
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          model: string
          n8n_task_id: string | null
          prompt: string
          status: string
          updated_at: string
          user_id: string
          video_url: string | null
          webhook_response: Json | null
        }
        Insert: {
          aspect_ratio?: string
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          model?: string
          n8n_task_id?: string | null
          prompt: string
          status?: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          webhook_response?: Json | null
        }
        Update: {
          aspect_ratio?: string
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          model?: string
          n8n_task_id?: string | null
          prompt?: string
          status?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          webhook_response?: Json | null
        }
        Relationships: []
      }
      video_notifications: {
        Row: {
          channel_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          published_at: string | null
          thumbnail_url: string | null
          user_id: string
          video_id: string
          video_title: string | null
          video_url: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          published_at?: string | null
          thumbnail_url?: string | null
          user_id: string
          video_id: string
          video_title?: string | null
          video_url: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          published_at?: string | null
          thumbnail_url?: string | null
          user_id?: string
          video_id?: string
          video_title?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_notifications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "monitored_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      video_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_tags_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "analyzed_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_detection_usage: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          updated_at: string
          usage_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      viral_library: {
        Row: {
          created_at: string | null
          duration: string | null
          id: string
          likes: string | null
          notes: string | null
          title: string | null
          user_id: string
          video_url: string
          views: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          id?: string
          likes?: string | null
          notes?: string | null
          title?: string | null
          user_id: string
          video_url: string
          views?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          id?: string
          likes?: string | null
          notes?: string | null
          title?: string | null
          user_id?: string
          video_url?: string
          views?: string | null
        }
        Relationships: []
      }
      viral_monitoring_config: {
        Row: {
          check_interval_hours: number
          country: string | null
          created_at: string
          daily_clicks_count: number | null
          daily_clicks_date: string | null
          email_template_id: string | null
          id: string
          is_active: boolean
          last_checked_at: string | null
          niches: string[]
          notify_email: boolean | null
          notify_whatsapp: boolean | null
          scheduled_time: string | null
          updated_at: string
          user_id: string
          video_types: string[] | null
          viral_threshold: number
          whatsapp_template: string | null
        }
        Insert: {
          check_interval_hours?: number
          country?: string | null
          created_at?: string
          daily_clicks_count?: number | null
          daily_clicks_date?: string | null
          email_template_id?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          niches?: string[]
          notify_email?: boolean | null
          notify_whatsapp?: boolean | null
          scheduled_time?: string | null
          updated_at?: string
          user_id: string
          video_types?: string[] | null
          viral_threshold?: number
          whatsapp_template?: string | null
        }
        Update: {
          check_interval_hours?: number
          country?: string | null
          created_at?: string
          daily_clicks_count?: number | null
          daily_clicks_date?: string | null
          email_template_id?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          niches?: string[]
          notify_email?: boolean | null
          notify_whatsapp?: boolean | null
          scheduled_time?: string | null
          updated_at?: string
          user_id?: string
          video_types?: string[] | null
          viral_threshold?: number
          whatsapp_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viral_monitoring_config_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_thumbnails: {
        Row: {
          created_at: string
          headline: string | null
          id: string
          image_url: string
          niche: string | null
          prompt: string | null
          seo_description: string | null
          seo_tags: string | null
          style: string | null
          sub_niche: string | null
          user_id: string
          video_title: string
        }
        Insert: {
          created_at?: string
          headline?: string | null
          id?: string
          image_url: string
          niche?: string | null
          prompt?: string | null
          seo_description?: string | null
          seo_tags?: string | null
          style?: string | null
          sub_niche?: string | null
          user_id: string
          video_title: string
        }
        Update: {
          created_at?: string
          headline?: string | null
          id?: string
          image_url?: string
          niche?: string | null
          prompt?: string | null
          seo_description?: string | null
          seo_tags?: string | null
          style?: string | null
          sub_niche?: string | null
          user_id?: string
          video_title?: string
        }
        Relationships: []
      }
      viral_videos: {
        Row: {
          ai_analysis: string | null
          channel_name: string | null
          channel_url: string | null
          comments: number | null
          created_at: string
          detected_at: string
          duration: string | null
          id: string
          is_read: boolean | null
          keywords: string[] | null
          likes: number | null
          niche: string | null
          published_at: string | null
          thumbnail_url: string | null
          title: string | null
          user_id: string
          video_id: string
          video_type: string | null
          video_url: string
          views: number | null
          viral_score: number | null
        }
        Insert: {
          ai_analysis?: string | null
          channel_name?: string | null
          channel_url?: string | null
          comments?: number | null
          created_at?: string
          detected_at?: string
          duration?: string | null
          id?: string
          is_read?: boolean | null
          keywords?: string[] | null
          likes?: number | null
          niche?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
          user_id: string
          video_id: string
          video_type?: string | null
          video_url: string
          views?: number | null
          viral_score?: number | null
        }
        Update: {
          ai_analysis?: string | null
          channel_name?: string | null
          channel_url?: string | null
          comments?: number | null
          created_at?: string
          detected_at?: string
          duration?: string | null
          id?: string
          is_read?: boolean | null
          keywords?: string[] | null
          likes?: number | null
          niche?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string
          video_id?: string
          video_type?: string | null
          video_url?: string
          views?: number | null
          viral_score?: number | null
        }
        Relationships: []
      }
      whatsapp_message_log: {
        Row: {
          created_at: string
          id: string
          phone_number: string
          sent_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone_number: string
          sent_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone_number?: string
          sent_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      youtube_connections: {
        Row: {
          access_token: string
          channel_id: string
          channel_name: string | null
          channel_thumbnail: string | null
          connected_at: string
          id: string
          refresh_token: string
          scopes: string[] | null
          subscribers_count: number | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          channel_id: string
          channel_name?: string | null
          channel_thumbnail?: string | null
          connected_at?: string
          id?: string
          refresh_token: string
          scopes?: string[] | null
          subscribers_count?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          channel_id?: string
          channel_name?: string | null
          channel_thumbnail?: string | null
          connected_at?: string
          id?: string
          refresh_token?: string
          scopes?: string[] | null
          subscribers_count?: number | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_upload: {
        Args: { p_file_size_bytes: number; p_user_id: string }
        Returns: boolean
      }
      cleanup_old_whatsapp_logs: { Args: never; Returns: undefined }
      get_imagefx_usage: {
        Args: { p_user_id: string }
        Returns: {
          current_count: number
          month_limit: number
          remaining: number
        }[]
      }
      get_user_storage_bytes: { Args: { p_user_id: string }; Returns: number }
      get_user_storage_limit_gb: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_viral_detection_usage: {
        Args: { p_user_id: string }
        Returns: {
          current_count: number
          daily_limit: number
          remaining: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_imagefx_usage: {
        Args: { p_count?: number; p_user_id: string }
        Returns: {
          is_limit_reached: boolean
          month_limit: number
          new_count: number
        }[]
      }
      increment_viral_detection_usage: {
        Args: { p_user_id: string }
        Returns: {
          can_use: boolean
          current_count: number
          daily_limit: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "pro" | "free"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "pro", "free"],
    },
  },
} as const
