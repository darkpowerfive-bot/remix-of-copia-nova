# 🔥 Guia de Migração: Supabase → Firebase Firestore

Este documento contém a estrutura completa das **61 tabelas** do banco de dados atual, formatadas para recriar como **Collections** no Firebase Firestore.

---

## 📋 Índice de Collections

1. [activity_logs](#1-activity_logs)
2. [admin_settings](#2-admin_settings)
3. [agent_files](#3-agent_files)
4. [analyzed_videos](#4-analyzed_videos)
5. [api_providers](#5-api_providers)
6. [batch_generation_history](#6-batch_generation_history)
7. [blog_articles](#7-blog_articles)
8. [blog_page_views](#8-blog_page_views)
9. [channel_analyses](#9-channel_analyses)
10. [channel_goals](#10-channel_goals)
11. [credit_packages](#11-credit_packages)
12. [credit_transactions](#12-credit_transactions)
13. [credit_usage](#13-credit_usage)
14. [email_templates](#14-email_templates)
15. [folders](#15-folders)
16. [generated_audios](#16-generated_audios)
17. [generated_images](#17-generated_images)
18. [generated_scripts](#18-generated_scripts)
19. [generated_titles](#19-generated_titles)
20. [imagefx_monthly_usage](#20-imagefx_monthly_usage)
21. [migration_invites](#21-migration_invites)
22. [monitored_channels](#22-monitored_channels)
23. [newsletter_subscribers](#23-newsletter_subscribers)
24. [niche_best_times](#24-niche_best_times)
25. [pinned_videos](#25-pinned_videos)
26. [plan_permissions](#26-plan_permissions)
27. [pomodoro_state](#27-pomodoro_state)
28. [product_clicks](#28-product_clicks)
29. [production_board_tasks](#29-production_board_tasks)
30. [profiles](#30-profiles)
31. [publication_schedule](#31-publication_schedule)
32. [push_subscriptions](#32-push_subscriptions)
33. [reference_thumbnails](#33-reference_thumbnails)
34. [saved_analytics_channels](#34-saved_analytics_channels)
35. [saved_prompts](#35-saved_prompts)
36. [scene_prompts](#36-scene_prompts)
37. [schedule_reminders_sent](#37-schedule_reminders_sent)
38. [script_agents](#38-script_agents)
39. [srt_history](#39-srt_history)
40. [tags](#40-tags)
41. [task_completion_history](#41-task_completion_history)
42. [title_tags](#42-title_tags)
43. [user_api_settings](#43-user_api_settings)
44. [user_credits](#44-user_credits)
45. [user_file_uploads](#45-user_file_uploads)
46. [user_goals](#46-user_goals)
47. [user_individual_permissions](#47-user_individual_permissions)
48. [user_kanban_settings](#48-user_kanban_settings)
49. [user_preferences](#49-user_preferences)
50. [user_roles](#50-user_roles)
51. [video_analyses](#51-video_analyses)
52. [video_generation_jobs](#52-video_generation_jobs)
53. [video_notifications](#53-video_notifications)
54. [video_tags](#54-video_tags)
55. [viral_detection_usage](#55-viral_detection_usage)
56. [viral_library](#56-viral_library)
57. [viral_monitoring_config](#57-viral_monitoring_config)
58. [viral_thumbnails](#58-viral_thumbnails)
59. [viral_videos](#59-viral_videos)
60. [whatsapp_message_log](#60-whatsapp_message_log)
61. [youtube_connections](#61-youtube_connections)

---

## 🔄 Mapeamento de Tipos: PostgreSQL → Firestore

| PostgreSQL | Firestore | Notas |
|------------|-----------|-------|
| `uuid` | `string` | Usar `doc.id` automático ou `crypto.randomUUID()` |
| `text` | `string` | - |
| `integer` / `int4` | `number` | - |
| `bigint` / `int8` | `number` | Firestore suporta até 2^53 |
| `real` / `float4` | `number` | - |
| `numeric` | `number` | - |
| `boolean` / `bool` | `boolean` | - |
| `timestamp with time zone` | `Timestamp` | Usar `serverTimestamp()` |
| `date` | `Timestamp` ou `string` | Formato ISO |
| `jsonb` | `map` | Objeto nativo do Firestore |
| `ARRAY` / `_text` | `array` | Array nativo do Firestore |

---

## 📦 Estrutura das Collections

### 1. activity_logs
**Descrição**: Logs de atividade do usuário

```typescript
interface ActivityLog {
  id: string;                    // auto-generated
  user_id: string;               // Reference para users
  action: string;                // required
  description?: string;          // nullable
  metadata?: Record<string, any>; // jsonb → map
  created_at: Timestamp;         // default: serverTimestamp()
}
```

**Índices recomendados**:
- `user_id` + `created_at` (desc)

---

### 2. admin_settings
**Descrição**: Configurações globais do admin

```typescript
interface AdminSetting {
  id: string;
  key: string;                   // unique
  value: Record<string, any>;    // jsonb → map (default: {})
  updated_at: Timestamp;
  updated_by?: string;           // Reference para users
}
```

**Índices recomendados**:
- `key` (unique)

---

### 3. agent_files
**Descrição**: Arquivos dos agentes de IA

```typescript
interface AgentFile {
  id: string;
  agent_id: string;              // Reference para script_agents
  user_id: string;               // Reference para users
  file_name: string;
  file_path: string;
  file_size: number;             // default: 0
  file_type?: string;
  created_at: Timestamp;
}
```

**Relacionamentos**:
- `agent_id` → `script_agents`
- `user_id` → `profiles`

---

### 4. analyzed_videos
**Descrição**: Vídeos analisados pelo usuário

```typescript
interface AnalyzedVideo {
  id: string;
  user_id: string;
  youtube_video_id?: string;
  video_url: string;
  original_title?: string;
  translated_title?: string;
  original_views?: number;       // bigint
  original_comments?: number;    // bigint
  original_days?: number;
  original_thumbnail_url?: string;
  detected_niche?: string;
  detected_subniche?: string;
  detected_microniche?: string;
  analysis_data_json?: Record<string, any>;
  folder_id?: string;            // Reference para folders
  channel_id?: string;           // Reference para monitored_channels
  analyzed_at: Timestamp;
  created_at: Timestamp;
}
```

**Índices recomendados**:
- `user_id` + `created_at` (desc)
- `user_id` + `folder_id`
- `youtube_video_id`

---

### 5. api_providers
**Descrição**: Provedores de API configurados

```typescript
interface ApiProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  unit_type: string;             // default: 'tokens'
  unit_size: number;             // default: 1000
  real_cost_per_unit: number;    // default: 0.0
  credits_per_unit: number;      // default: 1.0
  markup: number;                // default: 1.0
  is_premium: number;            // default: 0 (usar boolean no Firebase)
  is_active: number;             // default: 1
  is_default: number;            // default: 0
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 6. batch_generation_history
**Descrição**: Histórico de geração em lote

```typescript
interface BatchGenerationHistory {
  id: string;
  user_id: string;
  title?: string;
  prompts: string;               // texto com prompts
  style_id?: string;
  style_name?: string;
  prompt_count: number;          // default: 0
  success_count?: number;        // default: 0
  created_at: Timestamp;
}
```

---

### 7. blog_articles
**Descrição**: Artigos do blog

```typescript
interface BlogArticle {
  id: string;
  title: string;
  slug: string;                  // unique
  excerpt?: string;
  content: string;               // HTML
  category: string;              // default: 'YouTube'
  read_time?: string;            // default: '5 min'
  image_url?: string;
  meta_description?: string;
  meta_keywords?: string[];      // array
  is_published: boolean;         // default: false
  created_at: Timestamp;
  updated_at: Timestamp;
  published_at?: Timestamp;
  created_by?: string;
  view_count: number;            // default: 0
  seo_score: number;             // default: 0
  product_url?: string;
  product_title?: string;
  product_cta: string;           // default: 'Saiba Mais'
}
```

**Índices recomendados**:
- `slug` (unique)
- `is_published` + `created_at` (desc)
- `category` + `is_published`

---

### 8. blog_page_views
**Descrição**: Visualizações de páginas do blog

```typescript
interface BlogPageView {
  id: string;
  article_id?: string;           // Reference para blog_articles
  page_path: string;
  visitor_hash: string;
  viewed_at: Timestamp;
  user_agent?: string;
  referrer?: string;
  view_date: string;             // formato: 'YYYY-MM-DD'
}
```

---

### 9. channel_analyses
**Descrição**: Análises de canais

```typescript
interface ChannelAnalysis {
  id: string;
  user_id: string;
  channels: any[];               // array de objetos
  analysis_result?: Record<string, any>;
  name?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 10. channel_goals
**Descrição**: Metas de canal

```typescript
interface ChannelGoal {
  id: string;
  user_id: string;
  channel_url: string;
  goal_type: string;
  target_value: number;
  current_value: number;         // default: 0
  start_value: number;           // default: 0
  deadline?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
  completed_at?: Timestamp;
  is_active: boolean;            // default: true
  period_type: string;           // default: 'all_time'
  period_key?: string;
}
```

---

### 11. credit_packages
**Descrição**: Pacotes de créditos disponíveis

```typescript
interface CreditPackage {
  id: string;
  credits: number;
  price: number;                 // numeric
  stripe_price_id?: string;
  label?: string;
  is_active: boolean;            // default: true
  display_order: number;         // default: 0
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 12. credit_transactions
**Descrição**: Transações de créditos

```typescript
interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;                // pode ser negativo
  transaction_type: string;      // 'add', 'deduct', 'refund'
  description?: string;
  created_at: Timestamp;
}
```

**Índices recomendados**:
- `user_id` + `created_at` (desc)

---

### 13. credit_usage
**Descrição**: Uso de créditos por operação

```typescript
interface CreditUsage {
  id: string;
  user_id: string;
  operation_type: string;
  credits_used: number;
  model_used?: string;
  details?: Record<string, any>;
  created_at: Timestamp;
}
```

---

### 14. email_templates
**Descrição**: Templates de email

```typescript
interface EmailTemplate {
  id: string;
  template_type: string;         // unique
  subject: string;
  body: string;                  // HTML
  variables: string[];           // array de variáveis
  is_active: boolean;            // default: true
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 15. folders
**Descrição**: Pastas para organização

```typescript
interface Folder {
  id: string;
  user_id: string;
  name: string;
  items_count: number;           // default: 0
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 16. generated_audios
**Descrição**: Áudios gerados (TTS)

```typescript
interface GeneratedAudio {
  id: string;
  user_id: string;
  text: string;
  voice_id?: string;
  audio_url?: string;
  duration: number;              // default: 0
  created_at: Timestamp;
}
```

---

### 17. generated_images
**Descrição**: Imagens geradas

```typescript
interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url?: string;
  folder_id?: string;
  created_at: Timestamp;
}
```

---

### 18. generated_scripts
**Descrição**: Roteiros gerados

```typescript
interface GeneratedScript {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  niche?: string;
  duration_seconds?: number;
  model_used?: string;
  video_id?: string;             // Reference para analyzed_videos
  folder_id?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 19. generated_titles
**Descrição**: Títulos gerados

```typescript
interface GeneratedTitle {
  id: string;
  user_id: string;
  video_id?: string;
  original_title?: string;
  suggested_titles: string[];    // array
  analysis_data?: Record<string, any>;
  created_at: Timestamp;
}
```

---

### 20. imagefx_monthly_usage
**Descrição**: Uso mensal do ImageFX

```typescript
interface ImageFXMonthlyUsage {
  id: string;
  user_id: string;
  month_year: string;            // formato: 'YYYY-MM'
  images_generated: number;      // default: 0
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Índices recomendados**:
- `user_id` + `month_year` (unique)

---

### 21. migration_invites
**Descrição**: Convites de migração

```typescript
interface MigrationInvite {
  id: string;
  email: string;
  full_name?: string;
  token: string;                 // unique
  plan_name?: string;
  credits?: number;
  status: string;                // default: 'pending'
  sent_at?: Timestamp;
  accepted_at?: Timestamp;
  expires_at: Timestamp;
  created_at: Timestamp;
  created_by?: string;
}
```

---

### 22. monitored_channels
**Descrição**: Canais monitorados

```typescript
interface MonitoredChannel {
  id: string;
  user_id: string;
  channel_url: string;
  channel_name?: string;
  channel_id?: string;
  thumbnail_url?: string;
  subscriber_count?: number;
  video_count?: number;
  niche?: string;
  notes?: string;
  notify_new_videos: boolean;    // default: true
  is_active: boolean;            // default: true
  last_video_check?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 23. newsletter_subscribers
**Descrição**: Assinantes da newsletter

```typescript
interface NewsletterSubscriber {
  id: string;
  email: string;                 // unique
  status: string;                // default: 'active'
  subscribed_at: Timestamp;
  unsubscribed_at?: Timestamp;
}
```

---

### 24. niche_best_times
**Descrição**: Melhores horários por nicho

```typescript
interface NicheBestTime {
  id: string;
  niche: string;
  country: string;               // default: 'BR'
  best_days: string[];           // array
  best_hours: string[];          // array
  avg_views_boost: number;       // percentual
  sample_size: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 25. pinned_videos
**Descrição**: Vídeos fixados

```typescript
interface PinnedVideo {
  id: string;
  user_id: string;
  video_id: string;              // Reference para analyzed_videos
  pinned_at: Timestamp;
}
```

---

### 26. plan_permissions
**Descrição**: Permissões por plano

```typescript
interface PlanPermission {
  id: string;
  plan_name: string;
  credits_monthly: number;
  price_amount: number;
  stripe_price_id?: string;
  is_annual: boolean;            // default: false
  permissions: string[];         // array de features
  storage_limit_gb: number;      // default: 1
  imagefx_monthly_limit?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 27. pomodoro_state
**Descrição**: Estado do Pomodoro

```typescript
interface PomodoroState {
  id: string;
  user_id: string;               // unique
  is_running: boolean;
  is_break: boolean;
  time_remaining: number;        // segundos
  session_count: number;
  work_duration: number;
  break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
  last_updated_at: Timestamp;
}
```

---

### 28. product_clicks
**Descrição**: Cliques em produtos

```typescript
interface ProductClick {
  id: string;
  article_id?: string;
  product_url: string;
  visitor_hash: string;
  clicked_at: Timestamp;
  user_agent?: string;
  referrer?: string;
}
```

---

### 29. production_board_tasks
**Descrição**: Tarefas do board de produção

```typescript
interface ProductionBoardTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: string;                // 'idea', 'script', 'recording', 'editing', 'published'
  position: number;
  video_url?: string;
  scheduled_date?: Timestamp;
  published_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 30. profiles
**Descrição**: Perfis de usuário (principal!)

```typescript
interface Profile {
  id: string;                    // Mesmo ID do Firebase Auth
  email?: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;               // default: 0
  storage_used: number;          // em GB
  storage_limit: number;         // em GB
  whatsapp?: string;
  status: string;                // 'pending', 'active', 'suspended'
  auth_provider: string;         // 'email', 'google'
  stripe_customer_id?: string;
  subscription_id?: string;
  subscription_status?: string;
  subscription_end_date?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**⚠️ Importante**: No Firebase, use o `uid` do Firebase Auth como ID do documento.

---

### 31. publication_schedule
**Descrição**: Agenda de publicações

```typescript
interface PublicationSchedule {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  scheduled_date: string;        // 'YYYY-MM-DD'
  scheduled_time?: string;       // 'HH:mm'
  status: string;                // 'planned', 'recording', 'editing', 'ready', 'published'
  video_url?: string;
  thumbnail_url?: string;
  niche?: string;
  reminder_enabled: boolean;
  reminder_hours: number;
  reminder_sent: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 32. push_subscriptions
**Descrição**: Assinaturas de push notification

```typescript
interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;              // unique
  p256dh: string;
  auth: string;
  created_at: Timestamp;
}
```

---

### 33. reference_thumbnails
**Descrição**: Thumbnails de referência

```typescript
interface ReferenceThumbnail {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  description?: string;
  created_at: Timestamp;
}
```

---

### 34. saved_analytics_channels
**Descrição**: Canais salvos para analytics

```typescript
interface SavedAnalyticsChannel {
  id: string;
  user_id: string;
  channel_url: string;
  channel_name?: string;
  thumbnail_url?: string;
  created_at: Timestamp;
}
```

---

### 35. saved_prompts
**Descrição**: Prompts salvos

```typescript
interface SavedPrompt {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  category?: string;
  is_favorite: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 36. scene_prompts
**Descrição**: Prompts de cenas geradas

```typescript
interface ScenePrompt {
  id: string;
  user_id: string;
  script_id?: string;
  scene_number: number;
  scene_text: string;
  prompt: string;
  image_url?: string;
  duration_seconds: number;
  style_id?: string;
  created_at: Timestamp;
}
```

---

### 37. schedule_reminders_sent
**Descrição**: Lembretes de agenda enviados

```typescript
interface ScheduleReminderSent {
  id: string;
  schedule_id: string;
  user_id: string;
  sent_at: Timestamp;
}
```

---

### 38. script_agents
**Descrição**: Agentes de roteiro (IA)

```typescript
interface ScriptAgent {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  niche?: string;
  tone?: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 39. srt_history
**Descrição**: Histórico de SRTs convertidos

```typescript
interface SRTHistory {
  id: string;
  user_id: string;
  file_name: string;
  original_content: string;
  converted_content: string;
  word_count: number;
  created_at: Timestamp;
}
```

---

### 40. tags
**Descrição**: Tags para organização

```typescript
interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;                 // hex color
  created_at: Timestamp;
}
```

---

### 41. task_completion_history
**Descrição**: Histórico de tarefas completadas

```typescript
interface TaskCompletionHistory {
  id: string;
  user_id: string;
  task_id: string;
  task_title: string;
  completed_at: Timestamp;
}
```

---

### 42. title_tags
**Descrição**: Relação título-tag

```typescript
interface TitleTag {
  id: string;
  title_id: string;              // Reference para generated_titles
  tag_id: string;                // Reference para tags
  created_at: Timestamp;
}
```

---

### 43. user_api_settings
**Descrição**: Configurações de API do usuário

```typescript
interface UserApiSettings {
  id: string;
  user_id: string;               // unique
  youtube_api_key?: string;
  openai_api_key?: string;
  elevenlabs_api_key?: string;
  imagefx_cookies?: string;
  imagefx_validated: boolean;
  use_platform_credits: boolean;
  video_check_frequency: number; // minutos
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 44. user_credits
**Descrição**: Saldo de créditos do usuário

```typescript
interface UserCredits {
  id: string;
  user_id: string;               // unique
  balance: number;               // default: 0
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 45. user_file_uploads
**Descrição**: Arquivos enviados pelo usuário

```typescript
interface UserFileUpload {
  id: string;
  user_id: string;
  bucket_name: string;
  file_path: string;
  file_size: number;             // bytes
  content_type?: string;
  created_at: Timestamp;
}
```

---

### 46. user_goals
**Descrição**: Metas do usuário

```typescript
interface UserGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  deadline?: Timestamp;
  is_completed: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 47. user_individual_permissions
**Descrição**: Permissões individuais

```typescript
interface UserIndividualPermission {
  id: string;
  user_id: string;               // unique
  permissions: string[];         // array de features
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 48. user_kanban_settings
**Descrição**: Configurações do Kanban

```typescript
interface UserKanbanSettings {
  id: string;
  user_id: string;               // unique
  columns: any[];                // array de objetos
  settings?: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 49. user_preferences
**Descrição**: Preferências do usuário

```typescript
interface UserPreferences {
  id: string;
  user_id: string;               // unique
  theme: string;                 // 'light', 'dark', 'system'
  language: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  tutorial_completed: boolean;
  onboarding_step?: number;
  custom_settings?: Record<string, any>;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 50. user_roles
**Descrição**: Roles do usuário

```typescript
interface UserRole {
  id: string;
  user_id: string;               // unique
  role: 'admin' | 'pro' | 'free';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 51. video_analyses
**Descrição**: Análises de vídeo detalhadas

```typescript
interface VideoAnalysis {
  id: string;
  user_id: string;
  video_url: string;
  analysis_type: string;
  result: Record<string, any>;
  created_at: Timestamp;
}
```

---

### 52. video_generation_jobs
**Descrição**: Jobs de geração de vídeo

```typescript
interface VideoGenerationJob {
  id: string;
  user_id: string;
  script_id?: string;
  status: string;                // 'pending', 'processing', 'completed', 'failed'
  progress: number;              // 0-100
  result_url?: string;
  error_message?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 53. video_notifications
**Descrição**: Notificações de vídeos novos

```typescript
interface VideoNotification {
  id: string;
  user_id: string;
  channel_id: string;
  video_id: string;              // YouTube video ID
  title: string;
  thumbnail_url?: string;
  published_at: Timestamp;
  is_read: boolean;
  created_at: Timestamp;
}
```

---

### 54. video_tags
**Descrição**: Relação vídeo-tag

```typescript
interface VideoTag {
  id: string;
  video_id: string;
  tag_id: string;
  created_at: Timestamp;
}
```

---

### 55. viral_detection_usage
**Descrição**: Uso da detecção viral

```typescript
interface ViralDetectionUsage {
  id: string;
  user_id: string;
  usage_date: string;            // 'YYYY-MM-DD'
  usage_count: number;
  last_used_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 56. viral_library
**Descrição**: Biblioteca de vídeos virais

```typescript
interface ViralLibraryItem {
  id: string;
  user_id: string;
  video_url: string;
  title: string;
  channel_name?: string;
  thumbnail_url?: string;
  views: number;
  viral_score: number;
  niche?: string;
  notes?: string;
  folder_id?: string;
  created_at: Timestamp;
}
```

---

### 57. viral_monitoring_config
**Descrição**: Configuração de monitoramento viral

```typescript
interface ViralMonitoringConfig {
  id: string;
  user_id: string;               // unique
  is_active: boolean;
  niches: string[];              // array
  viral_threshold: number;       // default: 1000
  video_types: string[];         // ['long', 'short']
  country: string;               // default: 'BR'
  notify_whatsapp: boolean;
  notify_email: boolean;
  last_check?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### 58. viral_thumbnails
**Descrição**: Thumbnails de vídeos virais

```typescript
interface ViralThumbnail {
  id: string;
  user_id: string;
  video_id?: string;
  thumbnail_url: string;
  generated_variations?: string[]; // array de URLs
  created_at: Timestamp;
}
```

---

### 59. viral_videos
**Descrição**: Vídeos virais detectados

```typescript
interface ViralVideo {
  id: string;
  user_id: string;
  video_id: string;              // YouTube video ID
  title: string;
  channel_name: string;
  channel_id?: string;
  thumbnail_url?: string;
  views: number;
  likes?: number;
  comments?: number;
  viral_score: number;
  hours_old: number;
  niche?: string;
  video_type: string;            // 'long', 'short'
  detected_at: Timestamp;
  notified: boolean;
  created_at: Timestamp;
}
```

---

### 60. whatsapp_message_log
**Descrição**: Log de mensagens WhatsApp

```typescript
interface WhatsAppMessageLog {
  id: string;
  user_id: string;
  message_type: string;
  recipient: string;
  status: string;                // 'sent', 'failed', 'pending'
  error_message?: string;
  sent_at: Timestamp;
}
```

---

### 61. youtube_connections
**Descrição**: Conexões OAuth do YouTube

```typescript
interface YouTubeConnection {
  id: string;
  user_id: string;               // unique
  channel_id: string;
  channel_name: string;
  channel_thumbnail?: string;
  access_token: string;          // encrypted!
  refresh_token: string;         // encrypted!
  token_expires_at: Timestamp;
  scopes: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**⚠️ Segurança**: Criptografe `access_token` e `refresh_token` antes de armazenar!

---

## 🔐 Regras de Segurança (Firebase Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Funções auxiliares
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/user_roles/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Profiles - usuário pode ler/editar próprio perfil
    match /profiles/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow write: if isAuthenticated() && isOwner(userId);
    }
    
    // User roles - apenas admin pode modificar
    match /user_roles/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow write: if isAdmin();
    }
    
    // Dados do usuário - CRUD próprio
    match /analyzed_videos/{docId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.user_id == request.auth.uid;
    }
    
    // Padrão para collections do usuário
    match /{collection}/{docId} {
      allow read, write: if isAuthenticated() && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Admin settings - apenas admin
    match /admin_settings/{docId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // Blog articles - público para leitura
    match /blog_articles/{docId} {
      allow read: if resource.data.is_published == true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 📦 Storage Buckets → Firebase Storage

| Supabase Bucket | Firebase Storage Path | Público |
|-----------------|----------------------|---------|
| `reference-thumbnails` | `/reference-thumbnails/{userId}/` | ✅ |
| `agent-files` | `/agent-files/{userId}/` | ❌ |
| `avatars` | `/avatars/{userId}/` | ✅ |
| `blog-images` | `/blog-images/` | ✅ |

---

## 🔄 Próximos Passos

1. **Criar projeto Firebase**: [console.firebase.google.com](https://console.firebase.google.com)
2. **Configurar Firestore**: Modo production
3. **Importar Security Rules**: Copiar as regras acima
4. **Configurar Storage**: Criar as pastas
5. **Configurar Authentication**: Email/Password + Google
6. **Migrar Edge Functions**: Converter para Cloud Functions
7. **Atualizar código**: Substituir SDK Supabase por Firebase

---

## 📞 Suporte

Este documento foi gerado automaticamente a partir do schema atual do banco de dados.

Data de geração: 2026-01-24
Total de tabelas: 61
