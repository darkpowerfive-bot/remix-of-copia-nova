/**
 * Templates CapCut com transições e efeitos pré-configurados
 */

// Gerar ID único estilo CapCut
const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Converter segundos para microssegundos
const secondsToMicroseconds = (seconds: number): number => Math.round(seconds * 1_000_000);

export interface CapcutTemplate {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji ou ícone
  transitionType: 'fade' | 'slide' | 'zoom' | 'blur' | 'none';
  transitionDuration: number; // em segundos
  hasKenBurns: boolean; // efeito de zoom suave nas imagens
  hasVignette: boolean;
  hasColorGrading?: boolean; // correção de cor cinematográfica
  colorGradingType?: 'warm' | 'cold' | 'vintage' | 'cinematic' | 'bw';
  hasSlowMotion?: boolean; // câmera lenta
  slowMotionFactor?: number; // 0.5 = 50% velocidade
  hasBlur?: boolean; // efeito blur
  blurIntensity?: number; // 0-100
  category: 'basic' | 'cinematic' | 'creative' | 'professional';
}

export const CAPCUT_TEMPLATES: CapcutTemplate[] = [
  // === BÁSICOS ===
  {
    id: 'clean',
    name: 'Clean',
    description: 'Cortes diretos, sem efeitos. Ideal para edição manual.',
    preview: '✂️',
    transitionType: 'none',
    transitionDuration: 0,
    hasKenBurns: false,
    hasVignette: false,
    category: 'basic',
  },
  {
    id: 'fade',
    name: 'Fade Suave',
    description: 'Transições de fade elegantes e profissionais.',
    preview: '🌅',
    transitionType: 'fade',
    transitionDuration: 0.5,
    hasKenBurns: true,
    hasVignette: false,
    category: 'basic',
  },
  {
    id: 'slide',
    name: 'Slide Dinâmico',
    description: 'Transições de slide lateral. Moderno e energético.',
    preview: '➡️',
    transitionType: 'slide',
    transitionDuration: 0.4,
    hasKenBurns: false,
    hasVignette: false,
    category: 'basic',
  },
  
  // === CINEMATOGRÁFICOS ===
  {
    id: 'cinematic',
    name: 'Cinematográfico',
    description: 'Zoom + Ken Burns + Vinheta + Color Grading quente.',
    preview: '🎬',
    transitionType: 'zoom',
    transitionDuration: 0.6,
    hasKenBurns: true,
    hasVignette: true,
    hasColorGrading: true,
    colorGradingType: 'cinematic',
    category: 'cinematic',
  },
  {
    id: 'documentary',
    name: 'Documentário',
    description: 'Fade lento + Ken Burns + Tons frios. Estilo Netflix.',
    preview: '🎞️',
    transitionType: 'fade',
    transitionDuration: 0.8,
    hasKenBurns: true,
    hasVignette: true,
    hasColorGrading: true,
    colorGradingType: 'cold',
    category: 'cinematic',
  },
  {
    id: 'vintage',
    name: 'Vintage Film',
    description: 'Fade + Vinheta forte + Tons vintage sépia.',
    preview: '📽️',
    transitionType: 'fade',
    transitionDuration: 0.7,
    hasKenBurns: true,
    hasVignette: true,
    hasColorGrading: true,
    colorGradingType: 'vintage',
    category: 'cinematic',
  },
  
  // === CRIATIVOS ===
  {
    id: 'blur-dream',
    name: 'Blur Dreamy',
    description: 'Transições com blur suave. Efeito sonho/fantasia.',
    preview: '💫',
    transitionType: 'blur',
    transitionDuration: 0.6,
    hasKenBurns: true,
    hasVignette: false,
    hasBlur: true,
    blurIntensity: 15,
    category: 'creative',
  },
  {
    id: 'slowmo',
    name: 'Slow Motion Epic',
    description: 'Zoom dramático + Slow Motion 50% + Vinheta.',
    preview: '🐌',
    transitionType: 'zoom',
    transitionDuration: 1.0,
    hasKenBurns: true,
    hasVignette: true,
    hasSlowMotion: true,
    slowMotionFactor: 0.5,
    category: 'creative',
  },
  {
    id: 'bw-noir',
    name: 'Black & White Noir',
    description: 'Fade + Preto e branco + Vinheta intensa.',
    preview: '🖤',
    transitionType: 'fade',
    transitionDuration: 0.6,
    hasKenBurns: true,
    hasVignette: true,
    hasColorGrading: true,
    colorGradingType: 'bw',
    category: 'creative',
  },
  
  // === PROFISSIONAIS ===
  {
    id: 'youtube-viral',
    name: 'YouTube Viral',
    description: 'Cortes rápidos + Zoom punch + Cores vibrantes.',
    preview: '🔥',
    transitionType: 'zoom',
    transitionDuration: 0.3,
    hasKenBurns: false,
    hasVignette: false,
    hasColorGrading: true,
    colorGradingType: 'warm',
    category: 'professional',
  },
  {
    id: 'podcast-style',
    name: 'Podcast/Talking Head',
    description: 'Fade suave + Ken Burns lento. Foco no conteúdo.',
    preview: '🎙️',
    transitionType: 'fade',
    transitionDuration: 0.4,
    hasKenBurns: true,
    hasVignette: false,
    category: 'professional',
  },
  {
    id: 'news-broadcast',
    name: 'News Broadcast',
    description: 'Slide rápido + Cores frias. Estilo jornalístico.',
    preview: '📺',
    transitionType: 'slide',
    transitionDuration: 0.3,
    hasKenBurns: false,
    hasVignette: false,
    hasColorGrading: true,
    colorGradingType: 'cold',
    category: 'professional',
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'basic', name: 'Básicos', icon: '⚡' },
  { id: 'cinematic', name: 'Cinematográficos', icon: '🎬' },
  { id: 'creative', name: 'Criativos', icon: '✨' },
  { id: 'professional', name: 'Profissionais', icon: '💼' },
];

interface SceneData {
  number: number;
  fileName: string;
  durationSeconds: number;
  startSeconds: number;
  text?: string;
}

// Criar transição baseada no template - VINCULADA AO SEGMENTO
const createTransition = (
  template: CapcutTemplate,
  transitionId: string,
  segmentId: string
): any | null => {
  if (template.transitionType === 'none') return null;

  const durationMicro = secondsToMicroseconds(template.transitionDuration);
  
  // Mapeamento de tipos de transição para resource_id do CapCut (IDs reais)
  const transitionResourceMap: Record<string, { id: string; name: string; effect_id: string }> = {
    fade: { id: '6824474498248156685', name: 'Dissolve', effect_id: '7290952890303149853' },
    slide: { id: '6824474498248156690', name: 'Slide Left', effect_id: '7290952890303149858' },
    zoom: { id: '6824474498248156695', name: 'Zoom', effect_id: '7290952890303149863' },
    blur: { id: '6824474498248156700', name: 'Blur', effect_id: '7290952890303149868' },
  };

  const transitionData = transitionResourceMap[template.transitionType] || transitionResourceMap.fade;

  return {
    id: transitionId,
    category_id: "",
    category_name: "transition",
    duration: durationMicro,
    effect_id: transitionData.effect_id,
    is_overlap: true,
    name: transitionData.name,
    path: "",
    platform: "all",
    request_id: "",
    resource_id: transitionData.id,
    segment_id: segmentId, // Vincula a transição ao segmento
    type: "transition"
  };
};

// Criar efeito Ken Burns (zoom suave)
const createKenBurnsKeyframes = (
  segmentId: string,
  durationMicro: number
): any[] => {
  return [
    {
      id: generateId(),
      keyframe_list: [
        {
          curveType: "linear",
          graphID: "",
          id: generateId(),
          left_control: { x: 0, y: 0 },
          right_control: { x: 0, y: 0 },
          time_offset: 0,
          values: [1.0] // Escala inicial
        },
        {
          curveType: "linear",
          graphID: "",
          id: generateId(),
          left_control: { x: 0, y: 0 },
          right_control: { x: 0, y: 0 },
          time_offset: durationMicro,
          values: [1.05] // Escala final (5% de zoom)
        }
      ],
      material_id: segmentId,
      property_type: "KSVideoPropertyScale"
    }
  ];
};

// Criar segmento de vídeo/imagem com suporte a template
const createVideoSegment = (
  materialId: string,
  segmentId: string,
  durationMicro: number,
  startMicro: number,
  template: CapcutTemplate,
  isLastSegment: boolean
) => {
  const transitionDurationMicro = template.transitionType !== 'none' && !isLastSegment
    ? secondsToMicroseconds(template.transitionDuration)
    : 0;

  return {
    cartoon: false,
    clip: {
      alpha: 1.0,
      flip: { horizontal: false, vertical: false },
      rotation: 0.0,
      scale: { x: 1.0, y: 1.0 },
      transform: { x: 0.0, y: 0.0 }
    },
    common_keyframes: template.hasKenBurns ? createKenBurnsKeyframes(segmentId, durationMicro) : [],
    enable_adjust: true,
    enable_color_curves: true,
    enable_color_match_adjust: false,
    enable_color_wheels: true,
    enable_lut: true,
    enable_smart_color_adjust: false,
    extra_material_refs: [],
    group_id: "",
    hdr_settings: { intensity: 1.0, mode: 1, nits: 1000 },
    id: segmentId,
    intensifies_audio: false,
    is_placeholder: false,
    is_tone_modify: false,
    keyframe_refs: [],
    last_nonzero_volume: 1.0,
    material_id: materialId,
    render_index: 0,
    responsive_layout: {
      enable: false,
      horizontal_pos_layout: 0,
      size_layout: 0,
      target_follow: "",
      vertical_pos_layout: 0
    },
    reverse: false,
    source_timerange: { duration: durationMicro, start: 0 },
    speed: 1.0,
    target_timerange: { 
      duration: durationMicro, 
      start: startMicro 
    },
    template_id: "",
    template_scene: "default",
    track_attribute: 0,
    track_render_index: 0,
    transition_duration: transitionDurationMicro,
    uniform_scale: { on: true, value: 1.0 },
    visible: true,
    volume: 1.0
  };
};

// Criar material de vídeo/imagem com metadados para vinculação
const createVideoMaterial = (
  id: string,
  fileName: string,
  durationMicro: number,
  sceneIndex: number,
  width = 1920,
  height = 1080
) => {
  const localMaterialId = generateId();
  
  return {
    aigc_type: "none",
    audio_fade: null,
    cartoon_path: "",
    category_id: "",
    category_name: "local",
    check_flag: 63487,
    crop: {
      lower_left_x: 0.0,
      lower_left_y: 1.0,
      lower_right_x: 1.0,
      lower_right_y: 1.0,
      upper_left_x: 0.0,
      upper_left_y: 0.0,
      upper_right_x: 1.0,
      upper_right_y: 0.0
    },
    crop_ratio: "free",
    crop_scale: 1.0,
    duration: durationMicro,
    extra_type_option: 0,
    formula_id: "",
    freeze: null,
    gameplay: null,
    has_audio: false,
    height: height,
    id: id,
    intensifies_audio_path: "",
    intensifies_path: "",
    is_ai_generate_content: false,
    is_unified_beauty_mode: false,
    local_id: localMaterialId,
    local_material_id: localMaterialId,
    material_id: id,
    material_name: fileName,
    material_url: "",
    matting: {
      flag: 0,
      has_use_quick_brush: false,
      has_use_quick_eraser: false,
      interactiveTime: [],
      path: "",
      strokes: []
    },
    media_path: `Resources/${fileName}`,
    object_locked: null,
    origin_material_id: "",
    path: `Resources/${fileName}`,
    picture_from: "none",
    picture_set_category_id: "",
    picture_set_category_name: "",
    request_id: "",
    reverse_intensifies_path: "",
    reverse_path: "",
    smart_motion: null,
    source: 0,
    source_platform: 0,
    stable: {
      matrix_path: "",
      stable_level: 0,
      time_range: { duration: 0, start: 0 }
    },
    team_id: "",
    type: "photo",
    video_algorithm: {
      algorithms: [],
      deflicker: null,
      motion_blur_config: null,
      noise_reduction: null,
      path: "",
      quality_enhance: null,
      time_range: null
    },
    width: width
  };
};

// Criar track de vídeo
const createVideoTrack = (trackId: string, segments: any[]) => ({
  attribute: 0,
  flag: 0,
  id: trackId,
  is_default_name: true,
  name: "",
  segments: segments,
  type: "video"
});

// Criar canvas
const createCanvas = (id: string, hasVignette: boolean) => ({
  album_image: "",
  blur: hasVignette ? 5.0 : 0.0,
  color: "",
  id: id,
  image: "",
  image_id: "",
  image_name: "",
  source_platform: 0,
  team_id: "",
  type: "canvas_color"
});

// Criar speed material
const createSpeed = (id: string) => ({
  curve_speed: null,
  id: id,
  mode: 0,
  speed: 1.0,
  type: "speed"
});

/**
 * Gerar o draft_content.json com template selecionado
 * Inclui timeline com durações corretas - requer relink manual das imagens no CapCut
 */
export const generateCapcutDraftContentWithTemplate = (
  scenes: SceneData[],
  template: CapcutTemplate,
  projectName = "Projeto Gerado"
): string => {
  const trackId = generateId();
  
  const videoMaterials: any[] = [];
  const segments: any[] = [];
  const speeds: any[] = [];
  const transitions: any[] = [];
  
  let currentStartMicro = 0;
  
  scenes.forEach((scene, index) => {
    const materialId = generateId();
    const segmentId = generateId();
    const speedId = generateId();
    const durationMicro = secondsToMicroseconds(scene.durationSeconds);
    const isLastSegment = index === scenes.length - 1;
    
    // Material com path para Resources/
    videoMaterials.push(createVideoMaterial(materialId, scene.fileName, durationMicro, index));
    
    // Segment com duração correta
    segments.push(createVideoSegment(
      materialId,
      segmentId,
      durationMicro,
      currentStartMicro,
      template,
      isLastSegment
    ));
    
    // Speed
    speeds.push(createSpeed(speedId));
    
    // Transição - vinculada ao segmento atual
    if (!isLastSegment && template.transitionType !== 'none') {
      const transitionId = generateId();
      const transition = createTransition(template, transitionId, segmentId);
      if (transition) {
        transitions.push(transition);
        // Atualizar o segmento com referência à transição
        segments[segments.length - 1].extra_material_refs = [transitionId];
      }
    }
    
    currentStartMicro += durationMicro;
  });

  const totalDurationMicro = currentStartMicro;

  const draftContent = {
    canvas_config: {
      background: null,
      height: 1080,
      ratio: "original",
      width: 1920
    },
    color_space: -1,
    config: {
      adjust_max_index: 1,
      attachment_info: [],
      combination_max_index: 1,
      export_range: null,
      extract_audio_last_index: 1,
      lyrics_recognition_id: "",
      lyrics_sync: true,
      lyrics_taskinfo: [],
      maintrack_adsorb: true,
      material_save_mode: 0,
      multi_language_current: "none",
      multi_language_list: [],
      multi_language_main: "none",
      multi_language_mode: "none",
      original_sound_last_index: 1,
      record_audio_last_index: 1,
      sticker_max_index: 1,
      subtitle_keywords_config: null,
      subtitle_recognition_id: "",
      subtitle_sync: true,
      subtitle_taskinfo: [],
      system_font_list: [],
      use_float_render: false,
      video_mute: false,
      zoom_info_params: null
    },
    cover: null,
    create_time: 0,
    draft_type: "video",
    duration: totalDurationMicro,
    extra_info: null,
    fps: 30.0,
    free_render_index_mode_on: false,
    function_assistant_info: {
      audio_noise_segid_list: [],
      auto_adjust: false,
      auto_adjust_fixed: false,
      auto_adjust_fixed_value: 50.0,
      auto_adjust_segid_list: [],
      auto_caption: false,
      auto_caption_segid_list: [],
      auto_caption_template_id: "",
      caption_opt: false,
      caption_opt_segid_list: [],
      color_correction: false,
      color_correction_fixed: false,
      color_correction_fixed_value: 50.0,
      color_correction_segid_list: [],
      deflicker_segid_list: [],
      enhance_quality: false,
      enhance_quality_fixed: false,
      enhance_quality_segid_list: [],
      enhance_voice_segid_list: [],
      enhande_voice: false,
      enhande_voice_fixed: false,
      eye_correction: false,
      eye_correction_segid_list: [],
      fixed_rec_applied: false,
      fps: { den: 1, num: 0 },
      normalize_loudness: false,
      normalize_loudness_audio_denoise_segid_list: [],
      normalize_loudness_fixed: false,
      normalize_loudness_segid_list: [],
      retouch: false,
      retouch_fixed: false,
      retouch_segid_list: [],
      smart_rec_applied: false,
      smart_segid_list: [],
      smooth_slow_motion: false,
      smooth_slow_motion_fixed: false,
      video_noise_segid_list: []
    },
    group_container: null,
    id: generateId(),
    is_drop_frame_timecode: false,
    keyframe_graph_list: [],
    keyframes: {
      adjusts: [],
      audios: [],
      effects: [],
      filters: [],
      handwrites: [],
      stickers: [],
      texts: [],
      videos: []
    },
    last_modified_platform: {
      app_id: 359289,
      app_source: "cc",
      app_version: "7.7.0",
      device_id: generateId().toLowerCase(),
      hard_disk_id: "",
      mac_address: generateId().toLowerCase(),
      os: "windows",
      os_version: "10.0.19045"
    },
    lyrics_effects: [],
    materials: {
      ai_translates: [],
      audio_balances: [],
      audio_effects: [],
      audio_fades: [],
      audio_pannings: [],
      audio_pitch_shifts: [],
      audio_track_indexes: [],
      audios: [],
      beats: [],
      canvases: [],
      chromas: [],
      color_curves: [],
      common_mask: [],
      digital_human_model_dressing: [],
      digital_humans: [],
      drafts: [],
      effects: [],
      flowers: [],
      green_screens: [],
      handwrites: [],
      hsl: [],
      hsl_curves: [],
      images: [],
      log_color_wheels: [],
      loudnesses: [],
      manual_beautys: [],
      manual_deformations: [],
      material_animations: [],
      material_colors: [],
      multi_language_refs: [],
      placeholder_infos: [],
      placeholders: [],
      plugin_effects: [],
      primary_color_wheels: [],
      realtime_denoises: [],
      shapes: [],
      smart_crops: [],
      smart_relights: [],
      sound_channel_mappings: [],
      speeds: speeds,
      stickers: [],
      tail_leaders: [],
      text_templates: [],
      texts: [],
      time_marks: [],
      transitions: transitions,
      video_effects: [],
      video_radius: [],
      video_shadows: [],
      video_strokes: [],
      video_trackings: [],
      videos: videoMaterials,
      vocal_beautifys: [],
      vocal_separations: []
    },
    mutable_config: null,
    name: projectName,
    new_version: "151.0.0",
    path: "",
    platform: {
      app_id: 359289,
      app_source: "cc",
      app_version: "7.7.0",
      device_id: generateId().toLowerCase(),
      hard_disk_id: "",
      mac_address: generateId().toLowerCase(),
      os: "windows",
      os_version: "10.0.19045"
    },
    relationships: [],
    render_index_track_mode_on: true,
    retouch_cover: null,
    smart_ads_info: {
      draft_url: "",
      page_from: "",
      routine: ""
    },
    source: "default",
    static_cover_image_path: "",
    time_marks: null,
    tracks: segments.length > 0 ? [createVideoTrack(trackId, segments)] : [],
    uneven_animation_template_info: {
      composition: "",
      content: "",
      order: "",
      sub_template_info_list: []
    },
    update_time: 0,
    version: 360000
  };

  return JSON.stringify(draftContent, null, 2);
};

/**
 * Gerar o draft_meta_info.json
 */
export const generateCapcutDraftMetaInfoWithTemplate = (
  scenes: SceneData[],
  projectName = "Projeto Gerado"
): string => {
  const now = Date.now();
  const nowMicro = now * 1000; // Microsegundos
  
  const totalDurationMicro = scenes.reduce(
    (acc, scene) => acc + secondsToMicroseconds(scene.durationSeconds),
    0
  );

// Materiais importados para cada cena (type 0 = foto/vídeo)
  const importedMaterials = scenes.map((scene) => ({
    create_time: Math.floor(now / 1000),
    duration: secondsToMicroseconds(scene.durationSeconds),
    extra_info: "",
    file_Path: `Resources/${scene.fileName}`,
    height: 1080,
    id: generateId(),
    import_time: Math.floor(now / 1000),
    import_time_ms: now,
    item_source: 1,
    md5: "",
    metetype: "photo",
    roughcut_time_range: { duration: -1, start: -1 },
    sub_time_range: { duration: -1, start: -1 },
    type: 0,
    width: 1920
  }));
  
  const draftMaterials = [
    { type: 0, value: importedMaterials },
    { type: 1, value: [] },
    { type: 2, value: [] },
    { type: 3, value: [] },
    { type: 6, value: [] },
    { type: 7, value: [] },
    { type: 8, value: [] }
  ];

  const metaInfo = {
    cloud_draft_cover: true,
    cloud_draft_sync: true,
    cloud_package_completed_time: "",
    draft_cloud_capcut_purchase_info: "",
    draft_cloud_last_action_download: false,
    draft_cloud_package_type: "",
    draft_cloud_purchase_info: "",
    draft_cloud_template_id: "",
    draft_cloud_tutorial_info: "",
    draft_cloud_videocut_purchase_info: "",
    draft_cover: "draft_cover.jpg",
    draft_deeplink_url: "",
    draft_enterprise_info: {
      draft_enterprise_extra: "",
      draft_enterprise_id: "",
      draft_enterprise_name: "",
      enterprise_material: []
    },
    draft_fold_path: "",
    draft_id: generateId(),
    draft_is_ae_produce: false,
    draft_is_ai_packaging_used: false,
    draft_is_ai_shorts: false,
    draft_is_ai_translate: false,
    draft_is_article_video_draft: false,
    draft_is_cloud_temp_draft: false,
    draft_is_from_deeplink: "false",
    draft_is_invisible: false,
    draft_is_web_article_video: false,
    draft_materials: draftMaterials,
    draft_materials_copied_info: [],
    draft_name: projectName,
    draft_need_rename_folder: false,
    draft_new_version: "",
    draft_removable_storage_device: "",
    draft_root_path: "",
    draft_segment_extra_info: [],
    draft_timeline_materials_size_: 0,
    draft_type: "",
    draft_web_article_video_enter_from: "",
    tm_draft_cloud_completed: "",
    tm_draft_cloud_entry_id: -1,
    tm_draft_cloud_modified: 0,
    tm_draft_cloud_parent_entry_id: -1,
    tm_draft_cloud_space_id: -1,
    tm_draft_cloud_user_id: -1,
    tm_draft_create: nowMicro,
    tm_draft_modified: nowMicro,
    tm_draft_removed: 0,
    tm_duration: totalDurationMicro
  };

  return JSON.stringify(metaInfo, null, 2);
};

/**
 * Gerar o draft_info.json (arquivo de índice obrigatório para CapCut)
 */
export const generateCapcutDraftInfoWithTemplate = (
  projectName = "Projeto Gerado"
): string => {
  const now = Date.now();
  const nowSeconds = Math.floor(now / 1000);
  
  const draftInfo = {
    draft_cloud_last_action_download: false,
    draft_cloud_materials: [],
    draft_cloud_purchase_info: null,
    draft_cloud_template_id: "",
    draft_cloud_tutorial_info: null,
    draft_cloud_videocut_purchase_info: null,
    draft_enterprise_info: null,
    draft_id: generateId(),
    draft_is_ai_packaging_used: false,
    draft_is_ai_shorts: false,
    draft_is_ai_translate: false,
    draft_is_article_video_draft: false,
    draft_is_invisible: false,
    draft_name: projectName,
    draft_new_version: "",
    draft_timeline_materials_size: 0,
    tm_draft_create: nowSeconds,
    tm_draft_modified: nowSeconds
  };

  return JSON.stringify(draftInfo, null, 2);
};
