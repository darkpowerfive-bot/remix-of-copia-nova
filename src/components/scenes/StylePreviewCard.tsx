import { motion } from "framer-motion";
import { ThumbnailStyle } from "@/lib/thumbnailStyles";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, memo } from "react";

// Import real preview images for all styles
// 3D & Animação
import preview3DCinematic from "@/assets/style-previews/3d-cinematic-miniature.jpg";
import previewIsometric from "@/assets/style-previews/isometrico-arquitetonico.jpg";
import previewLowPoly from "@/assets/style-previews/low-poly-stylized.jpg";
import previewClaymation from "@/assets/style-previews/claymation-3d.jpg";
import previewVoxel from "@/assets/style-previews/voxel-art.jpg";
import previewAnime3D from "@/assets/style-previews/anime-3d.jpg";
import previewPixar from "@/assets/style-previews/pixar-disney.jpg";
import previewUnrealEngine from "@/assets/style-previews/unreal-engine.jpg";
import previewPaperCraft3D from "@/assets/style-previews/paper-craft-3d.jpg";
import previewNeon3D from "@/assets/style-previews/neon-3d.jpg";

// Realistas
import previewFotoRealista from "@/assets/style-previews/foto-realista.jpg";
import previewCinematografico from "@/assets/style-previews/cinematografico.jpg";
import previewDocumentario from "@/assets/style-previews/documentario.jpg";
import previewNarrativaCinematografica from "@/assets/style-previews/narrativa-cinematografica.jpg";
import previewRetratoEditorial from "@/assets/style-previews/retrato-editorial.jpg";
import previewNaturezaWildlife from "@/assets/style-previews/natureza-wildlife.jpg";
import previewArquiteturaModerna from "@/assets/style-previews/arquitetura-moderna.jpg";
import previewStreetPhotography from "@/assets/style-previews/street-photography.jpg";
import previewFotojornalismo from "@/assets/style-previews/fotojornalismo.jpg";
import previewProdutoComercial from "@/assets/style-previews/produto-comercial.jpg";
import previewMacroExtremo from "@/assets/style-previews/macro-extremo.jpg";
import previewAstrofotografia from "@/assets/style-previews/astrofotografia.jpg";

// Artísticos
import previewAnime from "@/assets/style-previews/anime.jpg";
import previewDesenhoAnimado from "@/assets/style-previews/desenho-animado.jpg";
import previewCartoonPremium from "@/assets/style-previews/cartoon-premium.jpg";
import previewFantasia from "@/assets/style-previews/fantasia.jpg";
import previewComicBook from "@/assets/style-previews/comic-book.jpg";
import previewMangaShonen from "@/assets/style-previews/manga-shonen.jpg";
import previewAquarelaDigital from "@/assets/style-previews/aquarela-digital.jpg";
import previewOleoClassico from "@/assets/style-previews/oleo-classico.jpg";
import previewPopArt from "@/assets/style-previews/pop-art.jpg";
import previewArtNouveau from "@/assets/style-previews/art-nouveau.jpg";
import previewExpressionismo from "@/assets/style-previews/expressionismo.jpg";
import previewImpressionismo from "@/assets/style-previews/impressionismo.jpg";

// Minimalistas
import previewDesenhoPalitos from "@/assets/style-previews/desenho-palitos.jpg";
import previewQuadroBranco from "@/assets/style-previews/quadro-branco.jpg";
import previewTechMinimalista from "@/assets/style-previews/tech-minimalista.jpg";
import previewEspiritualMinimalista from "@/assets/style-previews/narrativa-espiritual-minimalista.jpg";
import previewFlatDesign from "@/assets/style-previews/flat-design.jpg";
import previewLineArt from "@/assets/style-previews/line-art.jpg";
import previewSilhuetaDramatica from "@/assets/style-previews/silhueta-dramatica.jpg";
import previewGeometricoAbstrato from "@/assets/style-previews/geometrico-abstrato.jpg";
import previewMonocromatico from "@/assets/style-previews/monocromatico.jpg";
import previewNegativeSpace from "@/assets/style-previews/negative-space.jpg";
import previewTipografiaBold from "@/assets/style-previews/tipografia-bold.jpg";
import previewBauhaus from "@/assets/style-previews/bauhaus.jpg";

// Vibrantes
import previewViralVibrante from "@/assets/style-previews/viral-vibrante.jpg";
import previewDocumentarioModerno from "@/assets/style-previews/documentario-moderno.jpg";
import previewNeonCyberpunk from "@/assets/style-previews/neon-cyberpunk.jpg";
import previewVaporwave from "@/assets/style-previews/vaporwave.jpg";
import previewSynthwave from "@/assets/style-previews/synthwave.jpg";
import previewTropicalParadise from "@/assets/style-previews/tropical-paradise.jpg";
import previewGradienteAurora from "@/assets/style-previews/gradiente-aurora.jpg";
import previewNeonTokyo from "@/assets/style-previews/neon-tokyo.jpg";
import previewPsychedelic from "@/assets/style-previews/psychedelic.jpg";
import previewCandyPop from "@/assets/style-previews/candy-pop.jpg";
import previewHolografico from "@/assets/style-previews/holografico.jpg";
import previewFestivalLights from "@/assets/style-previews/festival-lights.jpg";

// Dramáticos
import previewTerrorAnalogico from "@/assets/style-previews/terror-analogico.jpg";
import previewTeatroSombrio from "@/assets/style-previews/teatro-sombrio.jpg";
import previewDramaNaturalista from "@/assets/style-previews/drama-naturalista.jpg";
import previewNoirClassico from "@/assets/style-previews/noir-classico.jpg";
import previewGoticoVitoriano from "@/assets/style-previews/gotico-vitoriano.jpg";
import previewApocaliptico from "@/assets/style-previews/apocaliptico.jpg";
import previewSuspenseThriller from "@/assets/style-previews/suspense-thriller.jpg";
import previewCorpoHorror from "@/assets/style-previews/corpo-horror.jpg";
import previewTempestadeEpica from "@/assets/style-previews/tempestade-epica.jpg";
import previewSubmundo from "@/assets/style-previews/submundo.jpg";
import previewGuerraEpica from "@/assets/style-previews/guerra-epica.jpg";
import previewLovecraftCosmico from "@/assets/style-previews/lovecraft-cosmico.jpg";

// Experimentais
import previewDiorama from "@/assets/style-previews/diorama-cinematografico.jpg";
import previewNeoRealismo from "@/assets/style-previews/neo-realismo-espiritual.jpg";
import previewSurrealismo from "@/assets/style-previews/surrealismo-psicologico.jpg";
import previewMemoriaFragmentada from "@/assets/style-previews/memoria-fragmentada.jpg";
import previewNarrativaFragmentada from "@/assets/style-previews/narrativa-fragmentada.jpg";
import previewSonhoReal from "@/assets/style-previews/sonho-real.jpg";
import previewVhsNostalgico from "@/assets/style-previews/vhs-nostalgico.jpg";
import previewGlitchArt from "@/assets/style-previews/glitch-art.jpg";
import previewDoubleExposure from "@/assets/style-previews/double-exposure.jpg";
import previewInfravermelho from "@/assets/style-previews/infravermelho.jpg";
import previewAiGenerativo from "@/assets/style-previews/ai-generativo.jpg";
import previewDataflow from "@/assets/style-previews/dataflow.jpg";

// 3D & Animação - extras
import previewDreamworksStyle from "@/assets/style-previews/dreamworks-style.jpg";
import previewCyberpunk3D from "@/assets/style-previews/cyberpunk-3d.jpg";
import preview3DViralMinimalista from "@/assets/style-previews/3d-viral-minimalista.jpg";

interface StylePreviewCardProps {
  style: ThumbnailStyle;
  isSelected: boolean;
  onClick: () => void;
}

// Map style IDs to their real preview images
const styleImages: Record<string, string> = {
  // 3D & Animação
  "3d-cinematic-miniature": preview3DCinematic,
  "isometrico-arquitetonico": previewIsometric,
  "low-poly-stylized": previewLowPoly,
  "claymation-3d": previewClaymation,
  "voxel-art": previewVoxel,
  "anime-3d": previewAnime3D,
  "pixar-disney": previewPixar,
  "unreal-engine": previewUnrealEngine,
  "paper-craft": previewPaperCraft3D,
  "neon-3d": previewNeon3D,
  "dreamworks-style": previewDreamworksStyle,
  "cyberpunk-3d": previewCyberpunk3D,
  "3d-viral-minimalista": preview3DViralMinimalista,
  // Realistas
  "foto-realista": previewFotoRealista,
  "cinematografico": previewCinematografico,
  "documentario": previewDocumentario,
  "narrativa-cinematografica": previewNarrativaCinematografica,
  "retrato-editorial": previewRetratoEditorial,
  "natureza-wildlife": previewNaturezaWildlife,
  "arquitetura-moderna": previewArquiteturaModerna,
  "street-photography": previewStreetPhotography,
  "fotojornalismo": previewFotojornalismo,
  "produto-comercial": previewProdutoComercial,
  "macro-extremo": previewMacroExtremo,
  "astrofotografia": previewAstrofotografia,
  // Artísticos
  "anime": previewAnime,
  "desenho-animado": previewDesenhoAnimado,
  "cartoon-premium": previewCartoonPremium,
  "fantasia": previewFantasia,
  "comic-book": previewComicBook,
  "manga-shonen": previewMangaShonen,
  "aquarela-digital": previewAquarelaDigital,
  "oleo-classico": previewOleoClassico,
  "pop-art": previewPopArt,
  "art-nouveau": previewArtNouveau,
  "expressionismo": previewExpressionismo,
  "impressionismo": previewImpressionismo,
  // Minimalistas
  "desenho-palitos": previewDesenhoPalitos,
  "quadro-branco": previewQuadroBranco,
  "tech-minimalista": previewTechMinimalista,
  "narrativa-espiritual-minimalista": previewEspiritualMinimalista,
  "flat-design": previewFlatDesign,
  "line-art": previewLineArt,
  "silhueta-dramatica": previewSilhuetaDramatica,
  "geometrico-abstrato": previewGeometricoAbstrato,
  "monocromatico": previewMonocromatico,
  "negative-space": previewNegativeSpace,
  "tipografia-bold": previewTipografiaBold,
  "bauhaus": previewBauhaus,
  // Vibrantes
  "viral-vibrante": previewViralVibrante,
  "documentario-moderno": previewDocumentarioModerno,
  "neon-cyberpunk": previewNeonCyberpunk,
  "vaporwave": previewVaporwave,
  "synthwave": previewSynthwave,
  "tropical-paradise": previewTropicalParadise,
  "gradiente-aurora": previewGradienteAurora,
  "neon-tokyo": previewNeonTokyo,
  "psychedelic": previewPsychedelic,
  "candy-pop": previewCandyPop,
  "holografico": previewHolografico,
  "festival-lights": previewFestivalLights,
  // Dramáticos
  "terror-analogico": previewTerrorAnalogico,
  "teatro-sombrio": previewTeatroSombrio,
  "drama-naturalista": previewDramaNaturalista,
  "noir-classico": previewNoirClassico,
  "gotico-vitoriano": previewGoticoVitoriano,
  "apocaliptico": previewApocaliptico,
  "suspense-thriller": previewSuspenseThriller,
  "corpo-horror": previewCorpoHorror,
  "tempestade-epica": previewTempestadeEpica,
  "submundo": previewSubmundo,
  "guerra-epica": previewGuerraEpica,
  "lovecraft-cosmico": previewLovecraftCosmico,
  // Experimentais
  "diorama-cinematografico": previewDiorama,
  "neo-realismo-espiritual": previewNeoRealismo,
  "surrealismo-psicologico": previewSurrealismo,
  "memoria-fragmentada": previewMemoriaFragmentada,
  "narrativa-fragmentada": previewNarrativaFragmentada,
  "sonho-real": previewSonhoReal,
  "vhs-nostalgico": previewVhsNostalgico,
  "glitch-art": previewGlitchArt,
  "double-exposure": previewDoubleExposure,
  "infravermelho": previewInfravermelho,
  "ai-generativo": previewAiGenerativo,
  "dataflow": previewDataflow,
};

// Fallback visual for styles without real images
const DefaultStyleVisual = ({ style }: { style: ThumbnailStyle }) => (
  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
    <span className="text-4xl">{style.icon}</span>
  </div>
);

export const StylePreviewCard = memo(({ style, isSelected, onClick }: StylePreviewCardProps) => {
  const previewImage = styleImages[style.id];
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
        isSelected 
          ? "border-primary ring-2 ring-primary/30" 
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Preview Visual */}
      <div className="aspect-video w-full bg-muted">
        {previewImage ? (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                <span className="text-3xl">{style.icon}</span>
              </div>
            )}
            <img 
              src={previewImage} 
              alt={style.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          </>
        ) : (
          <DefaultStyleVisual style={style} />
        )}
      </div>
      
      {/* Info */}
      <div className="p-3 bg-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{style.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{style.description}</p>
          </div>
        </div>
      </div>
      
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
});
