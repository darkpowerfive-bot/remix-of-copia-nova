CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'pro',
    'free'
);


--
-- Name: can_user_upload(uuid, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_user_upload(p_user_id uuid, p_file_size_bytes bigint) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (
    public.get_user_storage_bytes(p_user_id) + p_file_size_bytes
  ) <= (public.get_user_storage_limit_gb(p_user_id) * 1073741824); -- 1 GB = 1073741824 bytes
$$;


--
-- Name: cleanup_old_whatsapp_logs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_whatsapp_logs() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM public.whatsapp_message_log
  WHERE sent_at < NOW() - INTERVAL '7 days';
END;
$$;


--
-- Name: get_imagefx_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_imagefx_usage(p_user_id uuid) RETURNS TABLE(current_count integer, month_limit integer, remaining integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_user_role TEXT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get current usage
  SELECT COALESCE(images_generated, 0)
  INTO v_current_count
  FROM imagefx_monthly_usage
  WHERE user_id = p_user_id AND month_year = v_month_year;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  -- Get user's role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Determine limit based on role
  IF v_user_role = 'admin' THEN
    -- Admin: unlimited
    v_limit := NULL;
  ELSIF v_user_role = 'pro' THEN
    -- Pro users: unlimited (all paid plans have NULL limit)
    v_limit := NULL;
  ELSE
    -- Free users: get limit from FREE plan
    SELECT imagefx_monthly_limit INTO v_limit 
    FROM plan_permissions 
    WHERE plan_name = 'FREE' AND is_annual = false
    LIMIT 1;
  END IF;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE WHEN v_limit IS NOT NULL THEN GREATEST(0, v_limit - v_current_count) ELSE NULL END;
END;
$$;


--
-- Name: get_user_storage_bytes(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_storage_bytes(p_user_id uuid) RETURNS bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(SUM(file_size), 0)::BIGINT
  FROM public.user_file_uploads
  WHERE user_id = p_user_id;
$$;


--
-- Name: get_user_storage_limit_gb(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_storage_limit_gb(p_user_id uuid) RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT pp.storage_limit_gb 
     FROM public.plan_permissions pp
     INNER JOIN public.user_roles ur ON ur.role::text = LOWER(pp.plan_name)
     WHERE ur.user_id = p_user_id
     ORDER BY pp.storage_limit_gb DESC
     LIMIT 1
    ),
    1.0
  );
$$;


--
-- Name: get_viral_detection_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_viral_detection_usage(p_user_id uuid) RETURNS TABLE(current_count integer, daily_limit integer, remaining integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_user_role TEXT;
BEGIN
  -- Get user's role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Determine limit based on role
  IF v_user_role = 'admin' THEN
    v_limit := NULL; -- Unlimited
  ELSIF v_user_role = 'pro' THEN
    v_limit := 10; -- Pro default
  ELSE
    v_limit := 1; -- Free
  END IF;
  
  -- Get current usage for today
  SELECT COALESCE(usage_count, 0)
  INTO v_current_count
  FROM viral_detection_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE WHEN v_limit IS NOT NULL THEN GREATEST(0, v_limit - v_current_count) ELSE NULL END;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, status, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'pending',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_credits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_credits() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (NEW.id, 50)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
    VALUES (NEW.id, 50, 'add', 'Créditos iniciais - Plano Free');
    
    RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: increment_imagefx_usage(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_imagefx_usage(p_user_id uuid, p_count integer DEFAULT 1) RETURNS TABLE(new_count integer, month_limit integer, is_limit_reached boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_plan_name TEXT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get user's plan and limit
  SELECT pp.plan_name, pp.imagefx_monthly_limit
  INTO v_plan_name, v_limit
  FROM plan_permissions pp
  JOIN user_roles ur ON ur.role::text = 
    CASE 
      WHEN pp.plan_name = 'FREE' THEN 'free'
      WHEN pp.plan_name IN ('START CREATOR', 'TURBO MAKER', 'MASTER PRO') THEN 'pro'
      ELSE 'free'
    END
  WHERE ur.user_id = p_user_id
  AND pp.is_annual = false
  LIMIT 1;
  
  -- If no plan found, check if admin
  IF v_limit IS NULL THEN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') THEN
      v_limit := NULL; -- Unlimited for admin
    ELSE
      -- Default to FREE plan limit
      SELECT imagefx_monthly_limit INTO v_limit 
      FROM plan_permissions 
      WHERE plan_name = 'FREE' AND is_annual = false
      LIMIT 1;
    END IF;
  END IF;
  
  -- Upsert usage record
  INSERT INTO imagefx_monthly_usage (user_id, month_year, images_generated)
  VALUES (p_user_id, v_month_year, p_count)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET 
    images_generated = imagefx_monthly_usage.images_generated + p_count,
    updated_at = now()
  RETURNING images_generated INTO v_current_count;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE WHEN v_limit IS NOT NULL AND v_current_count > v_limit THEN true ELSE false END;
END;
$$;


--
-- Name: increment_viral_detection_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_viral_detection_usage(p_user_id uuid) RETURNS TABLE(current_count integer, daily_limit integer, can_use boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_current_count INTEGER;
  v_limit INTEGER;
  v_user_role TEXT;
BEGIN
  -- Get user's role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Determine limit based on role
  -- admin/master = unlimited (NULL)
  -- pro = check plan_permissions or default to 10
  -- free = 1
  IF v_user_role = 'admin' THEN
    v_limit := NULL; -- Unlimited
  ELSIF v_user_role = 'pro' THEN
    -- Check plan_permissions for specific limit, default to 10
    v_limit := 10;
  ELSE
    v_limit := 1; -- Free users
  END IF;
  
  -- Upsert usage record for today
  INSERT INTO viral_detection_usage (user_id, usage_date, usage_count, last_used_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET 
    usage_count = viral_detection_usage.usage_count + 1,
    last_used_at = now(),
    updated_at = now()
  RETURNING usage_count INTO v_current_count;
  
  RETURN QUERY SELECT 
    v_current_count,
    v_limit,
    CASE 
      WHEN v_limit IS NULL THEN true  -- Unlimited
      WHEN v_current_count <= v_limit THEN true
      ELSE false
    END;
END;
$$;


--
-- Name: sync_storage_on_role_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_storage_on_role_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_storage_bytes BIGINT;
  v_storage_gb NUMERIC;
  v_limit_gb NUMERIC;
BEGIN
  v_storage_bytes := public.get_user_storage_bytes(NEW.user_id);
  v_limit_gb := public.get_user_storage_limit_gb(NEW.user_id);
  v_storage_gb := v_storage_bytes / 1073741824.0;
  
  UPDATE public.profiles 
  SET storage_used = v_storage_gb,
      storage_limit = v_limit_gb
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: sync_user_storage(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_user_storage() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_storage_bytes BIGINT;
  v_storage_gb NUMERIC;
  v_limit_gb NUMERIC;
BEGIN
  -- Pega o user_id correto dependendo se é INSERT/UPDATE ou DELETE
  IF TG_OP = 'DELETE' THEN
    v_storage_bytes := public.get_user_storage_bytes(OLD.user_id);
    v_limit_gb := public.get_user_storage_limit_gb(OLD.user_id);
    v_storage_gb := v_storage_bytes / 1073741824.0;
    
    UPDATE public.profiles 
    SET storage_used = v_storage_gb,
        storage_limit = v_limit_gb
    WHERE id = OLD.user_id;
    
    RETURN OLD;
  ELSE
    v_storage_bytes := public.get_user_storage_bytes(NEW.user_id);
    v_limit_gb := public.get_user_storage_limit_gb(NEW.user_id);
    v_storage_gb := v_storage_bytes / 1073741824.0;
    
    UPDATE public.profiles 
    SET storage_used = v_storage_gb,
        storage_limit = v_limit_gb
    WHERE id = NEW.user_id;
    
    RETURN NEW;
  END IF;
END;
$$;


--
-- Name: update_kanban_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_kanban_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_pomodoro_last_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pomodoro_last_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: agent_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer DEFAULT 0 NOT NULL,
    file_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analyzed_videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyzed_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    youtube_video_id text,
    video_url text NOT NULL,
    original_title text,
    translated_title text,
    original_views bigint,
    original_comments bigint,
    original_days integer,
    original_thumbnail_url text,
    detected_niche text,
    detected_subniche text,
    detected_microniche text,
    analysis_data_json jsonb,
    folder_id uuid,
    channel_id uuid,
    analyzed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: api_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    unit_type text DEFAULT 'tokens'::text NOT NULL,
    unit_size integer DEFAULT 1000 NOT NULL,
    real_cost_per_unit real DEFAULT 0.0 NOT NULL,
    credits_per_unit real DEFAULT 1.0 NOT NULL,
    markup real DEFAULT 1.0 NOT NULL,
    is_premium integer DEFAULT 0 NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    is_default integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: batch_generation_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_generation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    prompts text NOT NULL,
    style_id text,
    style_name text,
    prompt_count integer DEFAULT 0 NOT NULL,
    success_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    category text DEFAULT 'YouTube'::text NOT NULL,
    read_time text DEFAULT '5 min'::text,
    image_url text,
    meta_description text,
    meta_keywords text[],
    is_published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    view_count integer DEFAULT 0,
    seo_score integer DEFAULT 0,
    product_url text,
    product_title text,
    product_cta text DEFAULT 'Saiba Mais'::text
);


--
-- Name: blog_page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid,
    page_path text NOT NULL,
    visitor_hash text NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    user_agent text,
    referrer text,
    view_date date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: channel_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channel_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channels jsonb DEFAULT '[]'::jsonb NOT NULL,
    analysis_result jsonb,
    name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: channel_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channel_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_url text NOT NULL,
    goal_type text NOT NULL,
    target_value integer NOT NULL,
    current_value integer DEFAULT 0,
    start_value integer DEFAULT 0,
    deadline date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    is_active boolean DEFAULT true,
    period_type text DEFAULT 'all_time'::text NOT NULL,
    period_key text
);


--
-- Name: credit_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    credits integer NOT NULL,
    price numeric(10,2) NOT NULL,
    stripe_price_id text,
    label text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount real NOT NULL,
    transaction_type text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT credit_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['add'::text, 'debit'::text, 'refund'::text, 'purchase'::text, 'subscription'::text])))
);


--
-- Name: credit_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    operation_type text NOT NULL,
    credits_used real NOT NULL,
    model_used text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_type text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    variables text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    items_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: generated_audios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_audios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    text text NOT NULL,
    voice_id text,
    audio_url text,
    duration numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: generated_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    prompt text NOT NULL,
    image_url text,
    folder_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: generated_scripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_scripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    agent_id uuid,
    title text NOT NULL,
    content text NOT NULL,
    duration integer DEFAULT 5 NOT NULL,
    language text DEFAULT 'pt-BR'::text NOT NULL,
    model_used text,
    credits_used real DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: generated_titles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_titles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    video_analysis_id uuid,
    user_id uuid NOT NULL,
    title_text text NOT NULL,
    model_used text,
    pontuacao integer DEFAULT 0,
    explicacao text,
    formula text,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    folder_id uuid,
    is_used boolean DEFAULT false
);


--
-- Name: imagefx_monthly_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imagefx_monthly_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    month_year text NOT NULL,
    images_generated integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migration_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migration_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    full_name text,
    plan_name text DEFAULT 'FREE'::text NOT NULL,
    credits_amount integer DEFAULT 50 NOT NULL,
    whatsapp text,
    token text DEFAULT (gen_random_uuid())::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    completed_at timestamp with time zone,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
    CONSTRAINT migration_invites_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'completed'::text, 'expired'::text])))
);


--
-- Name: monitored_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monitored_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_url text NOT NULL,
    channel_name text,
    subscribers text,
    videos_count integer DEFAULT 0,
    growth_rate text,
    last_checked timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    notify_new_videos boolean DEFAULT false,
    last_video_id text,
    niche text,
    subniche text,
    micronicho text
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    subscribed_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    source text DEFAULT 'blog'::text
);


--
-- Name: niche_best_times; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niche_best_times (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    niche text NOT NULL,
    best_days text[] DEFAULT ARRAY['tuesday'::text, 'thursday'::text, 'saturday'::text],
    best_hours text[] DEFAULT ARRAY['18:00'::text, '20:00'::text],
    reasoning text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pinned_videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pinned_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_id uuid,
    video_id text NOT NULL,
    video_url text NOT NULL,
    title text,
    thumbnail_url text,
    views text,
    likes text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: plan_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_name text NOT NULL,
    monthly_credits integer DEFAULT 0,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    stripe_price_id text,
    price_amount numeric DEFAULT 0,
    is_annual boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    storage_limit_gb numeric DEFAULT 1,
    imagefx_monthly_limit integer
);


--
-- Name: pomodoro_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pomodoro_state (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    time_left integer DEFAULT 1500 NOT NULL,
    session_type text DEFAULT 'work'::text NOT NULL,
    completed_sessions integer DEFAULT 0 NOT NULL,
    is_running boolean DEFAULT false NOT NULL,
    work_duration integer DEFAULT 25 NOT NULL,
    break_duration integer DEFAULT 5 NOT NULL,
    long_break_duration integer DEFAULT 15 NOT NULL,
    last_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid,
    product_url text NOT NULL,
    product_title text,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL,
    visitor_hash text NOT NULL,
    referrer text,
    user_agent text,
    click_date date DEFAULT CURRENT_DATE NOT NULL
);


--
-- Name: production_board_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.production_board_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    task_type text DEFAULT 'other'::text NOT NULL,
    column_id text DEFAULT 'backlog'::text NOT NULL,
    task_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    schedule_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    credits integer DEFAULT 100,
    storage_used numeric DEFAULT 0,
    storage_limit numeric DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    whatsapp text,
    status text DEFAULT 'pending'::text,
    auth_provider text DEFAULT 'email'::text
);

ALTER TABLE ONLY public.profiles REPLICA IDENTITY FULL;


--
-- Name: publication_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publication_schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    thumbnail_url text,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone,
    status text DEFAULT 'planned'::text NOT NULL,
    niche text,
    video_url text,
    notes text,
    priority text DEFAULT 'normal'::text,
    reminder_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reminder_hours integer DEFAULT 2,
    reminder_enabled boolean DEFAULT true,
    CONSTRAINT publication_schedule_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text]))),
    CONSTRAINT publication_schedule_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'recording'::text, 'editing'::text, 'ready'::text, 'published'::text])))
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reference_thumbnails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reference_thumbnails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    folder_id uuid,
    image_url text NOT NULL,
    channel_name text,
    niche text,
    sub_niche text,
    description text,
    extracted_prompt text,
    style_analysis jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: saved_analytics_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_analytics_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_url text NOT NULL,
    channel_id text NOT NULL,
    channel_name text NOT NULL,
    channel_thumbnail text,
    subscribers integer DEFAULT 0,
    total_views bigint DEFAULT 0,
    total_videos integer DEFAULT 0,
    last_fetched_at timestamp with time zone DEFAULT now(),
    cached_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    display_order integer DEFAULT 0,
    notes text,
    notes_updated_at timestamp with time zone
);


--
-- Name: saved_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    prompt text NOT NULL,
    folder_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: scene_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scene_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    script text NOT NULL,
    total_scenes integer DEFAULT 0 NOT NULL,
    total_words integer DEFAULT 0 NOT NULL,
    estimated_duration text,
    model_used text,
    style text,
    scenes jsonb DEFAULT '[]'::jsonb NOT NULL,
    credits_used integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schedule_reminders_sent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_reminders_sent (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid NOT NULL,
    user_id uuid NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    reminder_type text DEFAULT 'push'::text
);


--
-- Name: script_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.script_agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    niche text,
    sub_niche text,
    based_on_title text,
    formula text,
    formula_structure jsonb,
    mental_triggers text[],
    times_used integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    preferred_model text DEFAULT 'gpt-4o'::text
);


--
-- Name: srt_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.srt_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    original_text text NOT NULL,
    srt_content text NOT NULL,
    word_count integer DEFAULT 0,
    block_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_completion_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_completion_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_title text NOT NULL,
    task_type text DEFAULT 'other'::text NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: title_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.title_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_api_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_api_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    openai_api_key text,
    claude_api_key text,
    gemini_api_key text,
    elevenlabs_api_key text,
    youtube_api_key text,
    openai_validated boolean DEFAULT false,
    claude_validated boolean DEFAULT false,
    gemini_validated boolean DEFAULT false,
    elevenlabs_validated boolean DEFAULT false,
    youtube_validated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    use_platform_credits boolean DEFAULT true,
    imagefx_cookies text,
    imagefx_validated boolean DEFAULT false,
    video_check_frequency text DEFAULT '60'::text,
    CONSTRAINT user_api_settings_video_check_frequency_check CHECK ((video_check_frequency = ANY (ARRAY['30'::text, '60'::text, '360'::text])))
);


--
-- Name: user_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance real DEFAULT 0.0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_file_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_file_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bucket_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    file_type text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    goal_type text NOT NULL,
    period_type text NOT NULL,
    target_value integer DEFAULT 5 NOT NULL,
    current_value integer DEFAULT 0 NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_individual_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_individual_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permission_key text NOT NULL,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    notes text
);


--
-- Name: user_kanban_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_kanban_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    weekly_goal integer DEFAULT 5 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sidebar_order text[],
    theme text DEFAULT 'dark'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notify_viral_videos boolean DEFAULT true,
    notify_weekly_reports boolean DEFAULT true,
    notify_new_features boolean DEFAULT true,
    directive_update_hours integer DEFAULT 24
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'free'::public.app_role NOT NULL
);


--
-- Name: video_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_analyses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    video_url text NOT NULL,
    video_title text,
    thumbnail_url text,
    views bigint DEFAULT 0,
    likes bigint DEFAULT 0,
    comments bigint DEFAULT 0,
    engagement_rate numeric DEFAULT 0,
    ctr numeric DEFAULT 0,
    analysis_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: video_generation_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_generation_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    prompt text NOT NULL,
    model text DEFAULT 'veo31'::text NOT NULL,
    aspect_ratio text DEFAULT '16:9'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    video_url text,
    error_message text,
    n8n_task_id text,
    webhook_response jsonb,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


--
-- Name: video_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_id uuid,
    video_id text NOT NULL,
    video_url text NOT NULL,
    video_title text,
    thumbnail_url text,
    published_at timestamp with time zone,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.video_notifications REPLICA IDENTITY FULL;


--
-- Name: video_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    video_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: viral_detection_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viral_detection_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    usage_date date DEFAULT CURRENT_DATE NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: viral_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viral_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    video_url text NOT NULL,
    title text,
    views text,
    likes text,
    duration text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: viral_monitoring_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viral_monitoring_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    niches text[] DEFAULT '{}'::text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    check_interval_hours integer DEFAULT 1 NOT NULL,
    viral_threshold integer DEFAULT 1000 NOT NULL,
    last_checked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    video_types text[] DEFAULT ARRAY['long'::text, 'short'::text],
    country text DEFAULT 'BR'::text,
    scheduled_time text DEFAULT '09:00'::text,
    daily_clicks_count integer DEFAULT 0,
    daily_clicks_date date DEFAULT CURRENT_DATE,
    notify_whatsapp boolean DEFAULT false,
    notify_email boolean DEFAULT false,
    whatsapp_template text DEFAULT 'default'::text,
    email_template_id uuid,
    CONSTRAINT max_5_niches CHECK (((array_length(niches, 1) <= 5) OR (niches = '{}'::text[])))
);


--
-- Name: viral_thumbnails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viral_thumbnails (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image_url text NOT NULL,
    video_title text NOT NULL,
    headline text,
    seo_description text,
    seo_tags text,
    prompt text,
    style text,
    niche text,
    sub_niche text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: viral_videos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viral_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    video_id text NOT NULL,
    video_url text NOT NULL,
    title text,
    thumbnail_url text,
    channel_name text,
    channel_url text,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    published_at timestamp with time zone,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    viral_score numeric DEFAULT 0,
    niche text,
    keywords text[],
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    video_type text DEFAULT 'long'::text,
    ai_analysis text,
    duration text
);


--
-- Name: whatsapp_message_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.whatsapp_message_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    video_id text NOT NULL,
    phone_number text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: youtube_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.youtube_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    channel_id text NOT NULL,
    channel_name text,
    channel_thumbnail text,
    subscribers_count integer,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_expires_at timestamp with time zone,
    scopes text[],
    connected_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_key_key UNIQUE (key);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: agent_files agent_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_files
    ADD CONSTRAINT agent_files_pkey PRIMARY KEY (id);


--
-- Name: analyzed_videos analyzed_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzed_videos
    ADD CONSTRAINT analyzed_videos_pkey PRIMARY KEY (id);


--
-- Name: api_providers api_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_providers
    ADD CONSTRAINT api_providers_pkey PRIMARY KEY (id);


--
-- Name: batch_generation_history batch_generation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_generation_history
    ADD CONSTRAINT batch_generation_history_pkey PRIMARY KEY (id);


--
-- Name: blog_articles blog_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_pkey PRIMARY KEY (id);


--
-- Name: blog_articles blog_articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_slug_key UNIQUE (slug);


--
-- Name: blog_page_views blog_page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_page_views
    ADD CONSTRAINT blog_page_views_pkey PRIMARY KEY (id);


--
-- Name: channel_analyses channel_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_analyses
    ADD CONSTRAINT channel_analyses_pkey PRIMARY KEY (id);


--
-- Name: channel_goals channel_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel_goals
    ADD CONSTRAINT channel_goals_pkey PRIMARY KEY (id);


--
-- Name: credit_packages credit_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_packages
    ADD CONSTRAINT credit_packages_pkey PRIMARY KEY (id);


--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: credit_usage credit_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_usage
    ADD CONSTRAINT credit_usage_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_template_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_template_type_key UNIQUE (template_type);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: generated_audios generated_audios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_audios
    ADD CONSTRAINT generated_audios_pkey PRIMARY KEY (id);


--
-- Name: generated_images generated_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_pkey PRIMARY KEY (id);


--
-- Name: generated_scripts generated_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_scripts
    ADD CONSTRAINT generated_scripts_pkey PRIMARY KEY (id);


--
-- Name: generated_titles generated_titles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_titles
    ADD CONSTRAINT generated_titles_pkey PRIMARY KEY (id);


--
-- Name: imagefx_monthly_usage imagefx_monthly_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagefx_monthly_usage
    ADD CONSTRAINT imagefx_monthly_usage_pkey PRIMARY KEY (id);


--
-- Name: imagefx_monthly_usage imagefx_monthly_usage_user_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imagefx_monthly_usage
    ADD CONSTRAINT imagefx_monthly_usage_user_id_month_year_key UNIQUE (user_id, month_year);


--
-- Name: migration_invites migration_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_invites
    ADD CONSTRAINT migration_invites_pkey PRIMARY KEY (id);


--
-- Name: migration_invites migration_invites_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_invites
    ADD CONSTRAINT migration_invites_token_key UNIQUE (token);


--
-- Name: monitored_channels monitored_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monitored_channels
    ADD CONSTRAINT monitored_channels_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: niche_best_times niche_best_times_niche_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niche_best_times
    ADD CONSTRAINT niche_best_times_niche_key UNIQUE (niche);


--
-- Name: niche_best_times niche_best_times_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niche_best_times
    ADD CONSTRAINT niche_best_times_pkey PRIMARY KEY (id);


--
-- Name: pinned_videos pinned_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_videos
    ADD CONSTRAINT pinned_videos_pkey PRIMARY KEY (id);


--
-- Name: plan_permissions plan_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_permissions
    ADD CONSTRAINT plan_permissions_pkey PRIMARY KEY (id);


--
-- Name: pomodoro_state pomodoro_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_state
    ADD CONSTRAINT pomodoro_state_pkey PRIMARY KEY (id);


--
-- Name: pomodoro_state pomodoro_state_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pomodoro_state
    ADD CONSTRAINT pomodoro_state_user_id_key UNIQUE (user_id);


--
-- Name: product_clicks product_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_clicks
    ADD CONSTRAINT product_clicks_pkey PRIMARY KEY (id);


--
-- Name: production_board_tasks production_board_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_board_tasks
    ADD CONSTRAINT production_board_tasks_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: publication_schedule publication_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_schedule
    ADD CONSTRAINT publication_schedule_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: reference_thumbnails reference_thumbnails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_thumbnails
    ADD CONSTRAINT reference_thumbnails_pkey PRIMARY KEY (id);


--
-- Name: saved_analytics_channels saved_analytics_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_analytics_channels
    ADD CONSTRAINT saved_analytics_channels_pkey PRIMARY KEY (id);


--
-- Name: saved_analytics_channels saved_analytics_channels_user_id_channel_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_analytics_channels
    ADD CONSTRAINT saved_analytics_channels_user_id_channel_url_key UNIQUE (user_id, channel_url);


--
-- Name: saved_prompts saved_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_prompts
    ADD CONSTRAINT saved_prompts_pkey PRIMARY KEY (id);


--
-- Name: scene_prompts scene_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scene_prompts
    ADD CONSTRAINT scene_prompts_pkey PRIMARY KEY (id);


--
-- Name: schedule_reminders_sent schedule_reminders_sent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_reminders_sent
    ADD CONSTRAINT schedule_reminders_sent_pkey PRIMARY KEY (id);


--
-- Name: schedule_reminders_sent schedule_reminders_sent_schedule_id_reminder_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_reminders_sent
    ADD CONSTRAINT schedule_reminders_sent_schedule_id_reminder_type_key UNIQUE (schedule_id, reminder_type);


--
-- Name: script_agents script_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.script_agents
    ADD CONSTRAINT script_agents_pkey PRIMARY KEY (id);


--
-- Name: srt_history srt_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.srt_history
    ADD CONSTRAINT srt_history_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_user_id_name_key UNIQUE (user_id, name);


--
-- Name: task_completion_history task_completion_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_completion_history
    ADD CONSTRAINT task_completion_history_pkey PRIMARY KEY (id);


--
-- Name: title_tags title_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.title_tags
    ADD CONSTRAINT title_tags_pkey PRIMARY KEY (id);


--
-- Name: title_tags title_tags_title_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.title_tags
    ADD CONSTRAINT title_tags_title_id_tag_id_key UNIQUE (title_id, tag_id);


--
-- Name: user_api_settings user_api_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_api_settings
    ADD CONSTRAINT user_api_settings_pkey PRIMARY KEY (id);


--
-- Name: user_api_settings user_api_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_api_settings
    ADD CONSTRAINT user_api_settings_user_id_key UNIQUE (user_id);


--
-- Name: user_credits user_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);


--
-- Name: user_credits user_credits_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);


--
-- Name: user_file_uploads user_file_uploads_bucket_name_file_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_file_uploads
    ADD CONSTRAINT user_file_uploads_bucket_name_file_path_key UNIQUE (bucket_name, file_path);


--
-- Name: user_file_uploads user_file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_file_uploads
    ADD CONSTRAINT user_file_uploads_pkey PRIMARY KEY (id);


--
-- Name: user_goals user_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_goals
    ADD CONSTRAINT user_goals_pkey PRIMARY KEY (id);


--
-- Name: user_individual_permissions user_individual_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_individual_permissions
    ADD CONSTRAINT user_individual_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_individual_permissions user_individual_permissions_user_id_permission_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_individual_permissions
    ADD CONSTRAINT user_individual_permissions_user_id_permission_key_key UNIQUE (user_id, permission_key);


--
-- Name: user_kanban_settings user_kanban_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_kanban_settings
    ADD CONSTRAINT user_kanban_settings_pkey PRIMARY KEY (id);


--
-- Name: user_kanban_settings user_kanban_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_kanban_settings
    ADD CONSTRAINT user_kanban_settings_user_id_key UNIQUE (user_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: video_analyses video_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analyses
    ADD CONSTRAINT video_analyses_pkey PRIMARY KEY (id);


--
-- Name: video_generation_jobs video_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_generation_jobs
    ADD CONSTRAINT video_generation_jobs_pkey PRIMARY KEY (id);


--
-- Name: video_notifications video_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_notifications
    ADD CONSTRAINT video_notifications_pkey PRIMARY KEY (id);


--
-- Name: video_tags video_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_tags
    ADD CONSTRAINT video_tags_pkey PRIMARY KEY (id);


--
-- Name: video_tags video_tags_video_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_tags
    ADD CONSTRAINT video_tags_video_id_tag_id_key UNIQUE (video_id, tag_id);


--
-- Name: viral_detection_usage viral_detection_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_detection_usage
    ADD CONSTRAINT viral_detection_usage_pkey PRIMARY KEY (id);


--
-- Name: viral_detection_usage viral_detection_usage_user_id_usage_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_detection_usage
    ADD CONSTRAINT viral_detection_usage_user_id_usage_date_key UNIQUE (user_id, usage_date);


--
-- Name: viral_library viral_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_library
    ADD CONSTRAINT viral_library_pkey PRIMARY KEY (id);


--
-- Name: viral_monitoring_config viral_monitoring_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_monitoring_config
    ADD CONSTRAINT viral_monitoring_config_pkey PRIMARY KEY (id);


--
-- Name: viral_thumbnails viral_thumbnails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_thumbnails
    ADD CONSTRAINT viral_thumbnails_pkey PRIMARY KEY (id);


--
-- Name: viral_videos viral_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_videos
    ADD CONSTRAINT viral_videos_pkey PRIMARY KEY (id);


--
-- Name: viral_videos viral_videos_user_id_video_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_videos
    ADD CONSTRAINT viral_videos_user_id_video_id_key UNIQUE (user_id, video_id);


--
-- Name: whatsapp_message_log whatsapp_message_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.whatsapp_message_log
    ADD CONSTRAINT whatsapp_message_log_pkey PRIMARY KEY (id);


--
-- Name: youtube_connections youtube_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtube_connections
    ADD CONSTRAINT youtube_connections_pkey PRIMARY KEY (id);


--
-- Name: youtube_connections youtube_connections_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.youtube_connections
    ADD CONSTRAINT youtube_connections_user_id_key UNIQUE (user_id);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: idx_analyzed_videos_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analyzed_videos_user_id ON public.analyzed_videos USING btree (user_id);


--
-- Name: idx_analyzed_videos_youtube_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analyzed_videos_youtube_id ON public.analyzed_videos USING btree (youtube_video_id);


--
-- Name: idx_batch_generation_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_generation_history_created_at ON public.batch_generation_history USING btree (created_at DESC);


--
-- Name: idx_batch_generation_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_generation_history_user_id ON public.batch_generation_history USING btree (user_id);


--
-- Name: idx_blog_articles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_articles_category ON public.blog_articles USING btree (category);


--
-- Name: idx_blog_articles_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_articles_published ON public.blog_articles USING btree (is_published);


--
-- Name: idx_blog_articles_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_articles_slug ON public.blog_articles USING btree (slug);


--
-- Name: idx_blog_page_views_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_page_views_article_id ON public.blog_page_views USING btree (article_id);


--
-- Name: idx_blog_page_views_page_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_page_views_page_path ON public.blog_page_views USING btree (page_path);


--
-- Name: idx_blog_page_views_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_blog_page_views_unique ON public.blog_page_views USING btree (article_id, visitor_hash, view_date);


--
-- Name: idx_blog_page_views_view_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_page_views_view_date ON public.blog_page_views USING btree (view_date);


--
-- Name: idx_blog_page_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_page_views_viewed_at ON public.blog_page_views USING btree (viewed_at);


--
-- Name: idx_channel_goals_user_channel_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channel_goals_user_channel_period ON public.channel_goals USING btree (user_id, channel_url, period_type, period_key);


--
-- Name: idx_channel_goals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channel_goals_user_id ON public.channel_goals USING btree (user_id);


--
-- Name: idx_credit_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions USING btree (created_at DESC);


--
-- Name: idx_credit_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions USING btree (user_id);


--
-- Name: idx_credit_usage_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_usage_created_at ON public.credit_usage USING btree (created_at DESC);


--
-- Name: idx_credit_usage_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_usage_user_id ON public.credit_usage USING btree (user_id);


--
-- Name: idx_folders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_folders_user_id ON public.folders USING btree (user_id);


--
-- Name: idx_generated_audios_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_audios_created_at ON public.generated_audios USING btree (created_at DESC);


--
-- Name: idx_generated_audios_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_audios_user_id ON public.generated_audios USING btree (user_id);


--
-- Name: idx_generated_images_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_images_created_at ON public.generated_images USING btree (created_at DESC);


--
-- Name: idx_generated_images_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_images_user_id ON public.generated_images USING btree (user_id);


--
-- Name: idx_generated_scripts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_scripts_created_at ON public.generated_scripts USING btree (created_at DESC);


--
-- Name: idx_generated_scripts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_scripts_user_id ON public.generated_scripts USING btree (user_id);


--
-- Name: idx_generated_titles_analysis_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_titles_analysis_id ON public.generated_titles USING btree (video_analysis_id);


--
-- Name: idx_generated_titles_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_titles_folder_id ON public.generated_titles USING btree (folder_id);


--
-- Name: idx_generated_titles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generated_titles_user_id ON public.generated_titles USING btree (user_id);


--
-- Name: idx_imagefx_usage_user_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imagefx_usage_user_month ON public.imagefx_monthly_usage USING btree (user_id, month_year);


--
-- Name: idx_migration_invites_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_migration_invites_email ON public.migration_invites USING btree (email);


--
-- Name: idx_migration_invites_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_migration_invites_status ON public.migration_invites USING btree (status);


--
-- Name: idx_migration_invites_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_migration_invites_token ON public.migration_invites USING btree (token);


--
-- Name: idx_monitored_channels_last_checked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monitored_channels_last_checked ON public.monitored_channels USING btree (last_checked DESC);


--
-- Name: idx_monitored_channels_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monitored_channels_user_id ON public.monitored_channels USING btree (user_id);


--
-- Name: idx_newsletter_subscribers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers USING btree (email);


--
-- Name: idx_pinned_videos_user_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pinned_videos_user_channel ON public.pinned_videos USING btree (user_id, channel_id);


--
-- Name: idx_plan_permissions_plan_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_permissions_plan_name ON public.plan_permissions USING btree (plan_name);


--
-- Name: idx_pomodoro_state_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pomodoro_state_user_id ON public.pomodoro_state USING btree (user_id);


--
-- Name: idx_product_clicks_article_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_clicks_article_id ON public.product_clicks USING btree (article_id);


--
-- Name: idx_product_clicks_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_clicks_date ON public.product_clicks USING btree (click_date);


--
-- Name: idx_product_clicks_product_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_clicks_product_url ON public.product_clicks USING btree (product_url);


--
-- Name: idx_production_board_tasks_schedule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_production_board_tasks_schedule_id ON public.production_board_tasks USING btree (schedule_id);


--
-- Name: idx_production_board_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_production_board_tasks_user_id ON public.production_board_tasks USING btree (user_id);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_status ON public.profiles USING btree (status);


--
-- Name: idx_publication_schedule_reminder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_publication_schedule_reminder ON public.publication_schedule USING btree (scheduled_date, scheduled_time, reminder_enabled, reminder_sent);


--
-- Name: idx_publication_schedule_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_publication_schedule_status ON public.publication_schedule USING btree (status);


--
-- Name: idx_publication_schedule_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_publication_schedule_user_date ON public.publication_schedule USING btree (user_id, scheduled_date);


--
-- Name: idx_push_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions USING btree (user_id);


--
-- Name: idx_reference_thumbnails_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reference_thumbnails_folder_id ON public.reference_thumbnails USING btree (folder_id);


--
-- Name: idx_reference_thumbnails_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reference_thumbnails_user_id ON public.reference_thumbnails USING btree (user_id);


--
-- Name: idx_saved_analytics_channels_channel_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_analytics_channels_channel_id ON public.saved_analytics_channels USING btree (channel_id);


--
-- Name: idx_saved_analytics_channels_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_analytics_channels_user_id ON public.saved_analytics_channels USING btree (user_id);


--
-- Name: idx_saved_prompts_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_prompts_folder_id ON public.saved_prompts USING btree (folder_id);


--
-- Name: idx_saved_prompts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_prompts_user_id ON public.saved_prompts USING btree (user_id);


--
-- Name: idx_scene_prompts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scene_prompts_created_at ON public.scene_prompts USING btree (created_at DESC);


--
-- Name: idx_scene_prompts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scene_prompts_user_id ON public.scene_prompts USING btree (user_id);


--
-- Name: idx_script_agents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_script_agents_user_id ON public.script_agents USING btree (user_id);


--
-- Name: idx_srt_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_srt_history_created_at ON public.srt_history USING btree (created_at DESC);


--
-- Name: idx_srt_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_srt_history_user_id ON public.srt_history USING btree (user_id);


--
-- Name: idx_task_completion_history_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_completion_history_user_date ON public.task_completion_history USING btree (user_id, completed_at DESC);


--
-- Name: idx_user_api_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_api_settings_user_id ON public.user_api_settings USING btree (user_id);


--
-- Name: idx_user_credits_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_credits_user_id ON public.user_credits USING btree (user_id);


--
-- Name: idx_user_goals_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_goals_period ON public.user_goals USING btree (user_id, period_type, start_date, end_date);


--
-- Name: idx_user_goals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_goals_user_id ON public.user_goals USING btree (user_id);


--
-- Name: idx_user_individual_permissions_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_individual_permissions_key ON public.user_individual_permissions USING btree (permission_key);


--
-- Name: idx_user_individual_permissions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_individual_permissions_user_id ON public.user_individual_permissions USING btree (user_id);


--
-- Name: idx_user_roles_user_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_role ON public.user_roles USING btree (user_id, role);


--
-- Name: idx_video_analyses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_analyses_user_id ON public.video_analyses USING btree (user_id);


--
-- Name: idx_video_jobs_n8n_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_jobs_n8n_task ON public.video_generation_jobs USING btree (n8n_task_id);


--
-- Name: idx_video_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_jobs_status ON public.video_generation_jobs USING btree (status);


--
-- Name: idx_video_jobs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_jobs_user_id ON public.video_generation_jobs USING btree (user_id);


--
-- Name: idx_video_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_notifications_is_read ON public.video_notifications USING btree (is_read);


--
-- Name: idx_video_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_notifications_user_id ON public.video_notifications USING btree (user_id);


--
-- Name: idx_viral_videos_detected_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viral_videos_detected_at ON public.viral_videos USING btree (detected_at DESC);


--
-- Name: idx_viral_videos_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viral_videos_user_id ON public.viral_videos USING btree (user_id);


--
-- Name: idx_viral_videos_viral_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viral_videos_viral_score ON public.viral_videos USING btree (viral_score DESC);


--
-- Name: idx_whatsapp_log_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_log_sent_at ON public.whatsapp_message_log USING btree (sent_at);


--
-- Name: idx_whatsapp_log_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_whatsapp_log_user_date ON public.whatsapp_message_log USING btree (user_id, sent_at);


--
-- Name: viral_monitoring_config_user_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX viral_monitoring_config_user_unique ON public.viral_monitoring_config USING btree (user_id);


--
-- Name: user_roles trigger_sync_storage_on_role_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_storage_on_role_change AFTER INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.sync_storage_on_role_change();


--
-- Name: user_file_uploads trigger_sync_user_storage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_user_storage AFTER INSERT OR DELETE ON public.user_file_uploads FOR EACH ROW EXECUTE FUNCTION public.sync_user_storage();


--
-- Name: blog_articles update_blog_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_blog_articles_updated_at BEFORE UPDATE ON public.blog_articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: channel_analyses update_channel_analyses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_channel_analyses_updated_at BEFORE UPDATE ON public.channel_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: channel_goals update_channel_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_channel_goals_updated_at BEFORE UPDATE ON public.channel_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: credit_packages update_credit_packages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_credit_packages_updated_at BEFORE UPDATE ON public.credit_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: folders update_folders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_kanban_settings update_kanban_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_kanban_settings_updated_at BEFORE UPDATE ON public.user_kanban_settings FOR EACH ROW EXECUTE FUNCTION public.update_kanban_settings_updated_at();


--
-- Name: pomodoro_state update_pomodoro_last_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pomodoro_last_updated_at BEFORE UPDATE ON public.pomodoro_state FOR EACH ROW EXECUTE FUNCTION public.update_pomodoro_last_updated_at();


--
-- Name: production_board_tasks update_production_board_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_production_board_tasks_updated_at BEFORE UPDATE ON public.production_board_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: publication_schedule update_publication_schedule_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_publication_schedule_updated_at BEFORE UPDATE ON public.publication_schedule FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reference_thumbnails update_reference_thumbnails_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reference_thumbnails_updated_at BEFORE UPDATE ON public.reference_thumbnails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: saved_analytics_channels update_saved_analytics_channels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_saved_analytics_channels_updated_at BEFORE UPDATE ON public.saved_analytics_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: script_agents update_script_agents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_script_agents_updated_at BEFORE UPDATE ON public.script_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_api_settings update_user_api_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_api_settings_updated_at BEFORE UPDATE ON public.user_api_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_goals update_user_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON public.user_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_preferences update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: video_generation_jobs update_video_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_jobs_updated_at BEFORE UPDATE ON public.video_generation_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: viral_detection_usage update_viral_detection_usage_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_viral_detection_usage_updated_at BEFORE UPDATE ON public.viral_detection_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: viral_monitoring_config update_viral_monitoring_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_viral_monitoring_config_updated_at BEFORE UPDATE ON public.viral_monitoring_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: youtube_connections update_youtube_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_youtube_connections_updated_at BEFORE UPDATE ON public.youtube_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_settings admin_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: agent_files agent_files_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_files
    ADD CONSTRAINT agent_files_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.script_agents(id) ON DELETE CASCADE;


--
-- Name: analyzed_videos analyzed_videos_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyzed_videos
    ADD CONSTRAINT analyzed_videos_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- Name: blog_articles blog_articles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: blog_page_views blog_page_views_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_page_views
    ADD CONSTRAINT blog_page_views_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE;


--
-- Name: credit_transactions credit_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: credit_usage credit_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_usage
    ADD CONSTRAINT credit_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: folders folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: generated_audios generated_audios_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_audios
    ADD CONSTRAINT generated_audios_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: generated_images generated_images_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- Name: generated_images generated_images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_images
    ADD CONSTRAINT generated_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: generated_scripts generated_scripts_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_scripts
    ADD CONSTRAINT generated_scripts_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.script_agents(id) ON DELETE SET NULL;


--
-- Name: generated_scripts generated_scripts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_scripts
    ADD CONSTRAINT generated_scripts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: generated_titles generated_titles_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_titles
    ADD CONSTRAINT generated_titles_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- Name: generated_titles generated_titles_video_analysis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_titles
    ADD CONSTRAINT generated_titles_video_analysis_id_fkey FOREIGN KEY (video_analysis_id) REFERENCES public.analyzed_videos(id) ON DELETE CASCADE;


--
-- Name: migration_invites migration_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_invites
    ADD CONSTRAINT migration_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);


--
-- Name: monitored_channels monitored_channels_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monitored_channels
    ADD CONSTRAINT monitored_channels_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pinned_videos pinned_videos_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pinned_videos
    ADD CONSTRAINT pinned_videos_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.monitored_channels(id) ON DELETE CASCADE;


--
-- Name: product_clicks product_clicks_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_clicks
    ADD CONSTRAINT product_clicks_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE;


--
-- Name: production_board_tasks production_board_tasks_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.production_board_tasks
    ADD CONSTRAINT production_board_tasks_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.publication_schedule(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: publication_schedule publication_schedule_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publication_schedule
    ADD CONSTRAINT publication_schedule_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reference_thumbnails reference_thumbnails_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reference_thumbnails
    ADD CONSTRAINT reference_thumbnails_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- Name: saved_prompts saved_prompts_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_prompts
    ADD CONSTRAINT saved_prompts_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;


--
-- Name: saved_prompts saved_prompts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_prompts
    ADD CONSTRAINT saved_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: schedule_reminders_sent schedule_reminders_sent_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_reminders_sent
    ADD CONSTRAINT schedule_reminders_sent_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.publication_schedule(id) ON DELETE CASCADE;


--
-- Name: title_tags title_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.title_tags
    ADD CONSTRAINT title_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: title_tags title_tags_title_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.title_tags
    ADD CONSTRAINT title_tags_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.generated_titles(id) ON DELETE CASCADE;


--
-- Name: user_credits user_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credits
    ADD CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_file_uploads user_file_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_file_uploads
    ADD CONSTRAINT user_file_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_individual_permissions user_individual_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_individual_permissions
    ADD CONSTRAINT user_individual_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id);


--
-- Name: user_individual_permissions user_individual_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_individual_permissions
    ADD CONSTRAINT user_individual_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_analyses video_analyses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analyses
    ADD CONSTRAINT video_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_notifications video_notifications_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_notifications
    ADD CONSTRAINT video_notifications_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.monitored_channels(id) ON DELETE CASCADE;


--
-- Name: video_tags video_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_tags
    ADD CONSTRAINT video_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: video_tags video_tags_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_tags
    ADD CONSTRAINT video_tags_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.analyzed_videos(id) ON DELETE CASCADE;


--
-- Name: viral_library viral_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_library
    ADD CONSTRAINT viral_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: viral_monitoring_config viral_monitoring_config_email_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viral_monitoring_config
    ADD CONSTRAINT viral_monitoring_config_email_template_id_fkey FOREIGN KEY (email_template_id) REFERENCES public.email_templates(id);


--
-- Name: newsletter_subscribers Admins can delete newsletter subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete newsletter subscribers" ON public.newsletter_subscribers FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: api_providers Admins can delete providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete providers" ON public.api_providers FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete user_roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: credit_transactions Admins can insert credit transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert credit transactions" ON public.credit_transactions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_credits Admins can insert credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert credits" ON public.user_credits FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: api_providers Admins can insert providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert providers" ON public.api_providers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Admins can insert settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert settings" ON public.admin_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_articles Admins can manage blog articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage blog articles" ON public.blog_articles USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: credit_packages Admins can manage credit packages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage credit packages" ON public.credit_packages USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_individual_permissions Admins can manage individual permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage individual permissions" ON public.user_individual_permissions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: migration_invites Admins can manage migration invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage migration invites" ON public.migration_invites USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: plan_permissions Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.plan_permissions TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_templates Admins can manage templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage templates" ON public.email_templates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_clicks Admins can read clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read clicks" ON public.product_clicks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: newsletter_subscribers Admins can read newsletter subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read newsletter subscribers" ON public.newsletter_subscribers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_page_views Admins can read views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read views" ON public.blog_page_views FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.app_role)))));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_credits Admins can update credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update credits" ON public.user_credits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: newsletter_subscribers Admins can update newsletter subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update newsletter subscribers" ON public.newsletter_subscribers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: api_providers Admins can update providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update providers" ON public.api_providers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Admins can update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update settings" ON public.admin_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update user_roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: credit_transactions Admins can view all credit transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all credit transactions" ON public.credit_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: credit_usage Admins can view all credit usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all credit usage" ON public.credit_usage FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_credits Admins can view all credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all credits" ON public.user_credits FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all user_roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_settings Admins can view settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view settings" ON public.admin_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_clicks Anyone can insert clicks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert clicks" ON public.product_clicks FOR INSERT WITH CHECK (true);


--
-- Name: migration_invites Anyone can read by token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read by token" ON public.migration_invites FOR SELECT USING (true);


--
-- Name: niche_best_times Anyone can read niche times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read niche times" ON public.niche_best_times FOR SELECT USING (true);


--
-- Name: blog_articles Anyone can read published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read published articles" ON public.blog_articles FOR SELECT USING ((is_published = true));


--
-- Name: newsletter_subscribers Anyone can subscribe to newsletter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);


--
-- Name: api_providers Anyone can view active providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active providers" ON public.api_providers FOR SELECT USING ((is_active = 1));


--
-- Name: admin_settings Anyone can view landing settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view landing settings" ON public.admin_settings FOR SELECT USING ((key = 'landing_settings'::text));


--
-- Name: admin_settings Anyone can view landing video setting; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view landing video setting" ON public.admin_settings FOR SELECT USING ((key = 'landing_video_url'::text));


--
-- Name: plan_permissions Anyone can view plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view plans" ON public.plan_permissions FOR SELECT TO authenticated USING (true);


--
-- Name: credit_packages Credit packages are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Credit packages are viewable by everyone" ON public.credit_packages FOR SELECT USING (true);


--
-- Name: plan_permissions Plan permissions are readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Plan permissions are readable" ON public.plan_permissions FOR SELECT TO authenticated, anon USING (true);


--
-- Name: video_notifications Service role can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert notifications" ON public.video_notifications FOR INSERT WITH CHECK (true);


--
-- Name: blog_page_views Service role can insert views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert views" ON public.blog_page_views FOR INSERT WITH CHECK (true);


--
-- Name: whatsapp_message_log Service role can manage whatsapp logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage whatsapp logs" ON public.whatsapp_message_log USING (true) WITH CHECK (true);


--
-- Name: viral_monitoring_config Service role can read all configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can read all configs" ON public.viral_monitoring_config FOR SELECT USING (true);


--
-- Name: schedule_reminders_sent System can insert reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert reminders" ON public.schedule_reminders_sent FOR INSERT WITH CHECK (true);


--
-- Name: title_tags Users can add tags to their titles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add tags to their titles" ON public.title_tags FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.generated_titles
  WHERE ((generated_titles.id = title_tags.title_id) AND (generated_titles.user_id = auth.uid())))));


--
-- Name: video_tags Users can add tags to their videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add tags to their videos" ON public.video_tags FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.analyzed_videos
  WHERE ((analyzed_videos.id = video_tags.video_id) AND (analyzed_videos.user_id = auth.uid())))));


--
-- Name: publication_schedule Users can create own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own schedule" ON public.publication_schedule FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: srt_history Users can create their own SRT history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own SRT history" ON public.srt_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: youtube_connections Users can create their own YouTube connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own YouTube connection" ON public.youtube_connections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: script_agents Users can create their own agents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own agents" ON public.script_agents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: batch_generation_history Users can create their own batch history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own batch history" ON public.batch_generation_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: channel_analyses Users can create their own channel analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own channel analyses" ON public.channel_analyses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_goals Users can create their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own goals" ON public.user_goals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scene_prompts Users can create their own scene prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own scene prompts" ON public.scene_prompts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tags Users can create their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tags" ON public.tags FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: production_board_tasks Users can create their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tasks" ON public.production_board_tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: video_generation_jobs Users can create their own video jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own video jobs" ON public.video_generation_jobs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: viral_library Users can delete from their library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their library" ON public.viral_library FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: publication_schedule Users can delete own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own schedule" ON public.publication_schedule FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: srt_history Users can delete their own SRT history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own SRT history" ON public.srt_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: youtube_connections Users can delete their own YouTube connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own YouTube connection" ON public.youtube_connections FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: agent_files Users can delete their own agent files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own agent files" ON public.agent_files FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: script_agents Users can delete their own agents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own agents" ON public.script_agents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: video_analyses Users can delete their own analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own analyses" ON public.video_analyses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_audios Users can delete their own audios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own audios" ON public.generated_audios FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: batch_generation_history Users can delete their own batch history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own batch history" ON public.batch_generation_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: channel_analyses Users can delete their own channel analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own channel analyses" ON public.channel_analyses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: monitored_channels Users can delete their own channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own channels" ON public.monitored_channels FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: task_completion_history Users can delete their own completion history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own completion history" ON public.task_completion_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: folders Users can delete their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own folders" ON public.folders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_titles Users can delete their own generated titles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own generated titles" ON public.generated_titles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: channel_goals Users can delete their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own goals" ON public.channel_goals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_goals Users can delete their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own goals" ON public.user_goals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can delete their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own images" ON public.generated_images FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: video_notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notifications" ON public.video_notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: pinned_videos Users can delete their own pinned videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own pinned videos" ON public.pinned_videos FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_prompts Users can delete their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own prompts" ON public.saved_prompts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_analytics_channels Users can delete their own saved channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own saved channels" ON public.saved_analytics_channels FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scene_prompts Users can delete their own scene prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scene prompts" ON public.scene_prompts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: generated_scripts Users can delete their own scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own scripts" ON public.generated_scripts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can delete their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tags Users can delete their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tags" ON public.tags FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: production_board_tasks Users can delete their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tasks" ON public.production_board_tasks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reference_thumbnails Users can delete their own thumbnails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own thumbnails" ON public.reference_thumbnails FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_file_uploads Users can delete their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own uploads" ON public.user_file_uploads FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: analyzed_videos Users can delete their own video analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own video analyses" ON public.analyzed_videos FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: viral_thumbnails Users can delete their own viral thumbnails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own viral thumbnails" ON public.viral_thumbnails FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: viral_videos Users can delete their own viral videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own viral videos" ON public.viral_videos FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: viral_library Users can insert into their library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert into their library" ON public.viral_library FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_api_settings Users can insert their own API settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own API settings" ON public.user_api_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: imagefx_monthly_usage Users can insert their own ImageFX usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own ImageFX usage" ON public.imagefx_monthly_usage FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: agent_files Users can insert their own agent files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own agent files" ON public.agent_files FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: video_analyses Users can insert their own analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own analyses" ON public.video_analyses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_audios Users can insert their own audios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own audios" ON public.generated_audios FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: monitored_channels Users can insert their own channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own channels" ON public.monitored_channels FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: task_completion_history Users can insert their own completion history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own completion history" ON public.task_completion_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: viral_monitoring_config Users can insert their own config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own config" ON public.viral_monitoring_config FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_credits Users can insert their own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own credits" ON public.user_credits FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: folders Users can insert their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own folders" ON public.folders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_titles Users can insert their own generated titles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own generated titles" ON public.generated_titles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: channel_goals Users can insert their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own goals" ON public.channel_goals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_images Users can insert their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own images" ON public.generated_images FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_kanban_settings Users can insert their own kanban settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own kanban settings" ON public.user_kanban_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: activity_logs Users can insert their own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own logs" ON public.activity_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pinned_videos Users can insert their own pinned videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own pinned videos" ON public.pinned_videos FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: pomodoro_state Users can insert their own pomodoro state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own pomodoro state" ON public.pomodoro_state FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_preferences Users can insert their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: saved_prompts Users can insert their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own prompts" ON public.saved_prompts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_analytics_channels Users can insert their own saved channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own saved channels" ON public.saved_analytics_channels FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: generated_scripts Users can insert their own scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own scripts" ON public.generated_scripts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can insert their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reference_thumbnails Users can insert their own thumbnails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own thumbnails" ON public.reference_thumbnails FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: credit_transactions Users can insert their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own transactions" ON public.credit_transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_file_uploads Users can insert their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own uploads" ON public.user_file_uploads FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: credit_usage Users can insert their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own usage" ON public.credit_usage FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: viral_detection_usage Users can insert their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own usage" ON public.viral_detection_usage FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: analyzed_videos Users can insert their own video analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own video analyses" ON public.analyzed_videos FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: viral_thumbnails Users can insert their own viral thumbnails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own viral thumbnails" ON public.viral_thumbnails FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: viral_videos Users can insert their own viral videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own viral videos" ON public.viral_videos FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_roles Users can read own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: title_tags Users can remove tags from their titles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove tags from their titles" ON public.title_tags FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.generated_titles
  WHERE ((generated_titles.id = title_tags.title_id) AND (generated_titles.user_id = auth.uid())))));


--
-- Name: video_tags Users can remove tags from their videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove tags from their videos" ON public.video_tags FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.analyzed_videos
  WHERE ((analyzed_videos.id = video_tags.video_id) AND (analyzed_videos.user_id = auth.uid())))));


--
-- Name: publication_schedule Users can update own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own schedule" ON public.publication_schedule FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_api_settings Users can update their own API settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own API settings" ON public.user_api_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: imagefx_monthly_usage Users can update their own ImageFX usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own ImageFX usage" ON public.imagefx_monthly_usage FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: youtube_connections Users can update their own YouTube connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own YouTube connection" ON public.youtube_connections FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: script_agents Users can update their own agents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own agents" ON public.script_agents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: channel_analyses Users can update their own channel analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own channel analyses" ON public.channel_analyses FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: monitored_channels Users can update their own channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own channels" ON public.monitored_channels FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: viral_monitoring_config Users can update their own config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own config" ON public.viral_monitoring_config FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_credits Users can update their own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own credits" ON public.user_credits FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: folders Users can update their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own folders" ON public.folders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: generated_titles Users can update their own generated titles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own generated titles" ON public.generated_titles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: channel_goals Users can update their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own goals" ON public.channel_goals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_goals Users can update their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own goals" ON public.user_goals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_kanban_settings Users can update their own kanban settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own kanban settings" ON public.user_kanban_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: video_notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.video_notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: pomodoro_state Users can update their own pomodoro state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own pomodoro state" ON public.pomodoro_state FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can update their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: saved_prompts Users can update their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own prompts" ON public.saved_prompts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: saved_analytics_channels Users can update their own saved channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own saved channels" ON public.saved_analytics_channels FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: tags Users can update their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tags" ON public.tags FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: production_board_tasks Users can update their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tasks" ON public.production_board_tasks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: reference_thumbnails Users can update their own thumbnails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own thumbnails" ON public.reference_thumbnails FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: viral_detection_usage Users can update their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own usage" ON public.viral_detection_usage FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: analyzed_videos Users can update their own video analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own video analyses" ON public.analyzed_videos FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: video_generation_jobs Users can update their own video jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own video jobs" ON public.video_generation_jobs FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: viral_videos Users can update their own viral videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own viral videos" ON public.viral_videos FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: publication_schedule Users can view own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own schedule" ON public.publication_schedule FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_api_settings Users can view their own API settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own API settings" ON public.user_api_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: imagefx_monthly_usage Users can view their own ImageFX usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own ImageFX usage" ON public.imagefx_monthly_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: srt_history Users can view their own SRT history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own SRT history" ON public.srt_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: youtube_connections Users can view their own YouTube connection; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own YouTube connection" ON public.youtube_connections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: agent_files Users can view their own agent files; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own agent files" ON public.agent_files FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: script_agents Users can view their own agents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own agents" ON public.script_agents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: video_analyses Users can view their own analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own analyses" ON public.video_analyses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_audios Users can view their own audios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own audios" ON public.generated_audios FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: batch_generation_history Users can view their own batch history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own batch history" ON public.batch_generation_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: channel_analyses Users can view their own channel analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own channel analyses" ON public.channel_analyses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: monitored_channels Users can view their own channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own channels" ON public.monitored_channels FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: task_completion_history Users can view their own completion history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own completion history" ON public.task_completion_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: viral_monitoring_config Users can view their own config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own config" ON public.viral_monitoring_config FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_credits Users can view their own credits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own credits" ON public.user_credits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: folders Users can view their own folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own folders" ON public.folders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_titles Users can view their own generated titles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own generated titles" ON public.generated_titles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: channel_goals Users can view their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own goals" ON public.channel_goals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_goals Users can view their own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own goals" ON public.user_goals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_images Users can view their own images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own images" ON public.generated_images FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_kanban_settings Users can view their own kanban settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own kanban settings" ON public.user_kanban_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: viral_library Users can view their own library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own library" ON public.viral_library FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_logs Users can view their own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own logs" ON public.activity_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: video_notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.video_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_individual_permissions Users can view their own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own permissions" ON public.user_individual_permissions FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: pinned_videos Users can view their own pinned videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own pinned videos" ON public.pinned_videos FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pomodoro_state Users can view their own pomodoro state; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own pomodoro state" ON public.pomodoro_state FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can view their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: saved_prompts Users can view their own prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own prompts" ON public.saved_prompts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: schedule_reminders_sent Users can view their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reminders" ON public.schedule_reminders_sent FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_analytics_channels Users can view their own saved channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own saved channels" ON public.saved_analytics_channels FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: scene_prompts Users can view their own scene prompts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scene prompts" ON public.scene_prompts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: generated_scripts Users can view their own scripts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own scripts" ON public.generated_scripts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can view their own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tags Users can view their own tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tags" ON public.tags FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: production_board_tasks Users can view their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tasks" ON public.production_board_tasks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: reference_thumbnails Users can view their own thumbnails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own thumbnails" ON public.reference_thumbnails FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: credit_transactions Users can view their own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own transactions" ON public.credit_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_file_uploads Users can view their own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own uploads" ON public.user_file_uploads FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: credit_usage Users can view their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own usage" ON public.credit_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: viral_detection_usage Users can view their own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own usage" ON public.viral_detection_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analyzed_videos Users can view their own video analyses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own video analyses" ON public.analyzed_videos FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: video_generation_jobs Users can view their own video jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own video jobs" ON public.video_generation_jobs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: viral_thumbnails Users can view their own viral thumbnails; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own viral thumbnails" ON public.viral_thumbnails FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: viral_videos Users can view their own viral videos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own viral videos" ON public.viral_videos FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: title_tags Users can view their title tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their title tags" ON public.title_tags FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.generated_titles
  WHERE ((generated_titles.id = title_tags.title_id) AND (generated_titles.user_id = auth.uid())))));


--
-- Name: video_tags Users can view their video tags; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their video tags" ON public.video_tags FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.analyzed_videos
  WHERE ((analyzed_videos.id = video_tags.video_id) AND (analyzed_videos.user_id = auth.uid())))));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: agent_files; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;

--
-- Name: analyzed_videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analyzed_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: api_providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: batch_generation_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.batch_generation_history ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: channel_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.channel_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: channel_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.channel_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_packages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: credit_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_audios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_audios ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_scripts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_scripts ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_titles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_titles ENABLE ROW LEVEL SECURITY;

--
-- Name: imagefx_monthly_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.imagefx_monthly_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: migration_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.migration_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: monitored_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.monitored_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: niche_best_times; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.niche_best_times ENABLE ROW LEVEL SECURITY;

--
-- Name: pinned_videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pinned_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: pomodoro_state; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pomodoro_state ENABLE ROW LEVEL SECURITY;

--
-- Name: product_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: production_board_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.production_board_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: publication_schedule; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.publication_schedule ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: reference_thumbnails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reference_thumbnails ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_analytics_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_analytics_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: scene_prompts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scene_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_reminders_sent; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schedule_reminders_sent ENABLE ROW LEVEL SECURITY;

--
-- Name: script_agents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.script_agents ENABLE ROW LEVEL SECURITY;

--
-- Name: srt_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.srt_history ENABLE ROW LEVEL SECURITY;

--
-- Name: tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

--
-- Name: task_completion_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_completion_history ENABLE ROW LEVEL SECURITY;

--
-- Name: title_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.title_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: user_api_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_api_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

--
-- Name: user_file_uploads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_file_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: user_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: user_individual_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_individual_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_kanban_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_kanban_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: video_analyses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_analyses ENABLE ROW LEVEL SECURITY;

--
-- Name: video_generation_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_generation_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: video_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: video_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: viral_detection_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viral_detection_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: viral_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viral_library ENABLE ROW LEVEL SECURITY;

--
-- Name: viral_monitoring_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viral_monitoring_config ENABLE ROW LEVEL SECURITY;

--
-- Name: viral_thumbnails; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viral_thumbnails ENABLE ROW LEVEL SECURITY;

--
-- Name: viral_videos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viral_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: whatsapp_message_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;

--
-- Name: youtube_connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.youtube_connections ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;