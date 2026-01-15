import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IntroNiche } from "@/lib/xmlGenerator";

interface NicheVisualPreviewProps {
  niche: IntroNiche;
  className?: string;
}

// Configurações visuais específicas para cada nicho
const NICHE_VISUALS: Record<string, {
  gradient: string;
  elements: React.ReactNode;
  overlay?: string;
}> = {
  // DOCUMENTÁRIO
  documentary: {
    gradient: "from-slate-900/80 via-gray-800/60 to-zinc-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span className="text-4xl">🎥</span>
        </motion.div>
        {/* Linhas de filme */}
        <div className="absolute left-2 top-0 bottom-0 w-4 flex flex-col justify-around">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-2 bg-gray-600/40 rounded-sm"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        <div className="absolute right-2 top-0 bottom-0 w-4 flex flex-col justify-around">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-2 bg-gray-600/40 rounded-sm"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        {/* Luz cinematográfica */}
        <motion.div
          className="absolute top-0 left-1/4 w-16 h-full bg-gradient-to-b from-white/5 to-transparent"
          animate={{ x: [0, 50, 0], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </>
    ),
  },

  // TECH/TUTORIAL
  tech_tutorial: {
    gradient: "from-blue-900/80 via-cyan-800/60 to-slate-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <span className="text-4xl">💻</span>
        </motion.div>
        {/* Código flutuante */}
        {['</', '{', '};', '( )', '[]'].map((code, i) => (
          <motion.span
            key={i}
            className="absolute text-xs font-mono text-cyan-400/50"
            style={{ left: `${10 + i * 20}%`, top: `${15 + (i % 3) * 25}%` }}
            animate={{ opacity: [0.2, 0.7, 0.2], y: [0, -5, 0] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          >
            {code}
          </motion.span>
        ))}
        {/* Cursor piscando */}
        <motion.div
          className="absolute bottom-4 right-6 w-2 h-4 bg-cyan-400/60"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </>
    ),
  },

  // GAMING
  gaming: {
    gradient: "from-purple-900/80 via-pink-800/60 to-indigo-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-4xl">🎮</span>
        </motion.div>
        {/* Partículas neon */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-pink-500/60' : 'bg-purple-500/60'}`}
            style={{ left: `${10 + i * 9}%`, top: `${20 + (i % 4) * 20}%` }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
        {/* Efeito glitch */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-transparent to-cyan-500/10"
          animate={{ x: [-2, 2, -2] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />
      </>
    ),
  },

  // LIFESTYLE/VLOG
  lifestyle_vlog: {
    gradient: "from-orange-800/70 via-pink-700/50 to-rose-800/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl">✨</span>
        </motion.div>
        {/* Sparkles */}
        {['✨', '💫', '⭐', '🌟'].map((star, i) => (
          <motion.span
            key={i}
            className="absolute text-lg"
            style={{ left: `${15 + i * 22}%`, top: `${20 + (i % 2) * 45}%` }}
            animate={{ scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
            transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
          >
            {star}
          </motion.span>
        ))}
        {/* Bokeh suave */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-orange-300/20 blur-md"
            style={{ width: 12 + i * 6, height: 12 + i * 6, left: `${10 + i * 20}%`, top: `${30 + (i % 2) * 30}%` }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
      </>
    ),
  },

  // BUSINESS/FINANÇAS
  business_finance: {
    gradient: "from-emerald-900/80 via-green-800/60 to-teal-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl">💰</span>
        </motion.div>
        {/* Gráfico subindo */}
        <motion.svg className="absolute bottom-3 left-4 w-20 h-10" viewBox="0 0 80 40">
          <motion.path
            d="M0,35 L15,28 L30,32 L45,20 L60,15 L75,5"
            fill="none"
            stroke="rgba(74, 222, 128, 0.6)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.svg>
        {/* Moedas */}
        {['💵', '📈', '💎'].map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-sm"
            style={{ right: `${10 + i * 15}%`, top: `${25 + i * 15}%` }}
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          >
            {icon}
          </motion.span>
        ))}
      </>
    ),
  },

  // HORROR/SUSPENSE
  horror_suspense: {
    gradient: "from-gray-950/90 via-red-950/70 to-black/90",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">👻</span>
        </motion.div>
        {/* Névoa */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-800/50 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        {/* Olhos no escuro */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute flex gap-1"
            style={{ left: `${15 + i * 35}%`, top: `${20 + i * 20}%` }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 3, delay: i * 1, repeat: Infinity }}
          >
            <div className="w-1.5 h-1 rounded-full bg-red-500/80" />
            <div className="w-1.5 h-1 rounded-full bg-red-500/80" />
          </motion.div>
        ))}
        {/* Flash de relâmpago */}
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{ opacity: [0, 0.3, 0, 0, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.05, 0.1, 0.5, 1] }}
        />
      </>
    ),
  },

  // COMÉDIA
  comedy: {
    gradient: "from-yellow-700/80 via-orange-600/60 to-amber-700/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: [-5, 5, -5], scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-4xl">😂</span>
        </motion.div>
        {/* Emojis de risada */}
        {['🤣', '😆', '😜', '🎉'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-lg"
            style={{ left: `${10 + i * 25}%`, top: `${15 + (i % 2) * 55}%` }}
            animate={{ rotate: [0, 20, -20, 0], y: [0, -10, 0] }}
            transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
          >
            {emoji}
          </motion.span>
        ))}
        {/* Confetes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 ${['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400'][i % 4]}/60 rounded-sm`}
            style={{ left: `${10 + i * 12}%`, top: '10%' }}
            animate={{ y: [0, 70], rotate: [0, 360], opacity: [1, 0] }}
            transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </>
    ),
  },

  // MOTIVACIONAL
  motivational: {
    gradient: "from-amber-800/80 via-orange-700/60 to-red-800/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.2, 1], y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl">🚀</span>
        </motion.div>
        {/* Chamas de energia */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-2 bg-gradient-to-t from-orange-500/50 to-transparent rounded-full"
            style={{ left: `${20 + i * 15}%`, width: 8, height: 20 }}
            animate={{ height: [15, 25, 15], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
        {/* Estrelas subindo */}
        {['⭐', '💪', '🔥'].map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-sm"
            style={{ left: `${25 + i * 25}%`, bottom: '20%' }}
            animate={{ y: [0, -30], opacity: [1, 0] }}
            transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
          >
            {icon}
          </motion.span>
        ))}
      </>
    ),
  },

  // NOTÍCIAS
  news: {
    gradient: "from-red-900/80 via-red-800/60 to-slate-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl">📰</span>
        </motion.div>
        {/* Breaking news bar */}
        <motion.div
          className="absolute bottom-2 left-0 right-0 h-4 bg-red-600/60 flex items-center overflow-hidden"
        >
          <motion.p
            className="text-[8px] text-white font-bold whitespace-nowrap"
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            BREAKING NEWS • ÚLTIMA HORA • NOTÍCIA URGENTE • BREAKING NEWS •
          </motion.p>
        </motion.div>
        {/* Indicador ao vivo */}
        <motion.div
          className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/80 px-1.5 py-0.5 rounded"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-[8px] text-white font-bold">AO VIVO</span>
        </motion.div>
      </>
    ),
  },

  // EDUCACIONAL
  educational: {
    gradient: "from-blue-800/80 via-indigo-700/60 to-purple-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-4xl">📚</span>
        </motion.div>
        {/* Fórmulas matemáticas */}
        {['E=mc²', 'π', '∑', '∞', '√'].map((formula, i) => (
          <motion.span
            key={i}
            className="absolute text-xs font-serif text-blue-300/50"
            style={{ left: `${10 + i * 18}%`, top: `${20 + (i % 3) * 20}%` }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
          >
            {formula}
          </motion.span>
        ))}
        {/* Lâmpada de ideia */}
        <motion.span
          className="absolute top-3 right-4 text-xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          💡
        </motion.span>
      </>
    ),
  },

  // VIAGEM
  travel: {
    gradient: "from-sky-800/80 via-cyan-700/60 to-blue-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ x: [-20, 20], y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span className="text-4xl">✈️</span>
        </motion.div>
        {/* Nuvens */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full blur-sm"
            style={{ width: 20 + i * 8, height: 10 + i * 4, left: `${5 + i * 25}%`, top: `${20 + (i % 2) * 40}%` }}
            animate={{ x: [0, 15, 0] }}
            transition={{ duration: 5, delay: i * 0.5, repeat: Infinity }}
          />
        ))}
        {/* Ícones de viagem */}
        {['🗺️', '🌍', '🏝️'].map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-sm"
            style={{ left: `${20 + i * 30}%`, bottom: '15%' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          >
            {icon}
          </motion.span>
        ))}
      </>
    ),
  },

  // FITNESS
  fitness: {
    gradient: "from-red-800/80 via-orange-700/60 to-yellow-800/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-4xl">💪</span>
        </motion.div>
        {/* Batimentos cardíacos */}
        <motion.svg className="absolute top-3 left-3 w-12 h-6" viewBox="0 0 50 25">
          <motion.path
            d="M0,12 L8,12 L12,5 L16,20 L20,8 L24,15 L28,12 L50,12"
            fill="none"
            stroke="rgba(239, 68, 68, 0.7)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.svg>
        {/* Gotas de suor */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-2 bg-blue-400/50 rounded-full"
            style={{ right: `${10 + i * 8}%`, top: '30%' }}
            animate={{ y: [0, 40], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
        {/* Ícones fitness */}
        {['🏋️', '🔥', '⚡'].map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-sm"
            style={{ left: `${15 + i * 30}%`, bottom: '10%' }}
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
          >
            {icon}
          </motion.span>
        ))}
      </>
    ),
  },

  // CULINÁRIA
  cooking: {
    gradient: "from-orange-800/80 via-red-700/60 to-amber-800/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl">👨‍🍳</span>
        </motion.div>
        {/* Vapor subindo */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 rounded-full bg-white/30"
            style={{ left: `${35 + i * 8}%`, bottom: '25%', height: 8 }}
            animate={{ y: [0, -20], opacity: [0.5, 0], scale: [1, 1.5] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
        {/* Ingredientes */}
        {['🍳', '🥘', '🍕', '🍰'].map((food, i) => (
          <motion.span
            key={i}
            className="absolute text-sm"
            style={{ left: `${10 + i * 23}%`, top: `${20 + (i % 2) * 50}%` }}
            animate={{ rotate: [0, 15, -15, 0], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2, delay: i * 0.25, repeat: Infinity }}
          >
            {food}
          </motion.span>
        ))}
      </>
    ),
  },

  // MÚSICA
  music: {
    gradient: "from-violet-900/80 via-purple-800/60 to-fuchsia-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-4xl">🎵</span>
        </motion.div>
        {/* Ondas sonoras */}
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-4 bg-purple-400/50 rounded-full"
            style={{ left: `${15 + i * 12}%`, width: 4 }}
            animate={{ height: [10, 25 + (i % 3) * 10, 10] }}
            transition={{ duration: 0.8, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
        {/* Notas musicais */}
        {['♪', '♫', '♬'].map((note, i) => (
          <motion.span
            key={i}
            className="absolute text-lg text-fuchsia-400/60"
            style={{ left: `${20 + i * 30}%`, top: '15%' }}
            animate={{ y: [0, -15, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
          >
            {note}
          </motion.span>
        ))}
      </>
    ),
  },

  // STORYTIME
  storytime: {
    gradient: "from-indigo-900/80 via-blue-800/60 to-slate-900/80",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-4xl">📖</span>
        </motion.div>
        {/* Páginas virando */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/10 rounded"
            style={{ left: '45%', top: '35%', width: 20, height: 25 }}
            animate={{ rotateY: [0, -180], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, delay: i * 0.5, repeat: Infinity }}
          />
        ))}
        {/* Estrelas de mistério */}
        {['✨', '🌙', '💫'].map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-sm"
            style={{ left: `${15 + i * 35}%`, top: `${20 + (i % 2) * 50}%` }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
          >
            {icon}
          </motion.span>
        ))}
      </>
    ),
  },

  // BÍBLICO
  biblical: {
    gradient: "from-amber-700/70 via-yellow-600/50 to-orange-800/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-4xl">✝️</span>
        </motion.div>
        {/* Raios de luz */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-0.5 h-16 bg-gradient-to-b from-yellow-400/50 to-transparent origin-top"
            style={{ rotate: `${i * 45}deg` }}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
        {/* Pomba */}
        <motion.span
          className="absolute top-3 right-4 text-lg"
          animate={{ y: [0, -5, 0], x: [0, 3, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🕊️
        </motion.span>
      </>
    ),
  },

  // PSICOLOGIA
  psychology: {
    gradient: "from-indigo-800/70 via-purple-700/50 to-blue-900/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <span className="text-4xl">🧠</span>
        </motion.div>
        {/* Sinapses conectando */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/60"
            style={{ left: `${15 + (i % 4) * 22}%`, top: `${20 + Math.floor(i / 4) * 25}%` }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
        {/* Ondas cerebrais */}
        <motion.svg className="absolute bottom-2 left-4 w-24 h-6" viewBox="0 0 100 25">
          <motion.path
            d="M0,12 Q25,0 50,12 T100,12"
            fill="none"
            stroke="rgba(167, 139, 250, 0.5)"
            strokeWidth="2"
            animate={{ d: ["M0,12 Q25,0 50,12 T100,12", "M0,12 Q25,24 50,12 T100,12", "M0,12 Q25,0 50,12 T100,12"] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.svg>
      </>
    ),
  },

  // CURIOSIDADES
  curiosities: {
    gradient: "from-cyan-800/70 via-teal-600/50 to-blue-800/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl">🤯</span>
        </motion.div>
        {/* Partículas de explosão mental */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-cyan-400/50"
            style={{ left: '50%', top: '50%' }}
            animate={{
              x: [0, (Math.random() - 0.5) * 80],
              y: [0, (Math.random() - 0.5) * 60],
              opacity: [1, 0],
              scale: [0, 1.5],
            }}
            transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
        {/* Ícones de surpresa */}
        {['❓', '❗', '💡', '🔍'].map((symbol, i) => (
          <motion.span
            key={i}
            className="absolute text-lg"
            style={{ left: `${10 + i * 25}%`, top: '15%' }}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, delay: i * 0.25, repeat: Infinity }}
          >
            {symbol}
          </motion.span>
        ))}
      </>
    ),
  },

  // CIVILIZAÇÕES ANTIGAS
  ancient_civilizations: {
    gradient: "from-amber-900/80 via-yellow-800/60 to-stone-900/80",
    overlay: "bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M30 0L60 30L30 60L0 30z\" fill=\"none\" stroke=\"%23d4a574\" stroke-opacity=\"0.1\"/%3E%3C/svg%3E')]",
    elements: (
      <>
        {/* Pirâmide */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[45px] border-l-transparent border-r-transparent border-b-amber-600/60" />
          <div className="absolute inset-0 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[45px] border-l-transparent border-r-transparent border-b-yellow-500/20 animate-pulse" />
        </motion.div>
        {/* Hieróglifos flutuantes */}
        {['𓂀', '𓃀', '𓆣', '𓇳', '𓊪'].map((symbol, i) => (
          <motion.span
            key={i}
            className="absolute text-amber-500/40 text-lg font-bold"
            style={{ left: `${15 + i * 18}%`, top: `${20 + (i % 3) * 15}%` }}
            animate={{ opacity: [0.2, 0.6, 0.2], y: [0, -5, 0] }}
            transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
          >
            {symbol}
          </motion.span>
        ))}
        {/* Sol dourado */}
        <motion.div
          className="absolute top-2 right-4 w-8 h-8 rounded-full bg-gradient-radial from-yellow-400/60 to-transparent"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </>
    ),
  },

  // SAÚDE
  health: {
    gradient: "from-emerald-800/70 via-green-600/50 to-teal-700/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <span className="text-4xl">💚</span>
        </motion.div>
        {/* Ondas de energia */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-400/30"
            initial={{ width: 40, height: 40, opacity: 0 }}
            animate={{ width: [40, 80 + ring * 20], height: [40, 80 + ring * 20], opacity: [0.6, 0] }}
            transition={{ duration: 2, delay: ring * 0.4, repeat: Infinity }}
          />
        ))}
        {/* Folhas */}
        {['🍃', '🌿', '🌱'].map((leaf, i) => (
          <motion.span
            key={i}
            className="absolute text-xl"
            style={{ left: `${20 + i * 30}%`, bottom: '15%' }}
            animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
          >
            {leaf}
          </motion.span>
        ))}
        {/* ECG */}
        <motion.svg className="absolute bottom-2 left-2 w-16 h-8" viewBox="0 0 60 30">
          <motion.path
            d="M0,15 L10,15 L15,5 L20,25 L25,10 L30,20 L35,15 L60,15"
            fill="none"
            stroke="rgba(74, 222, 128, 0.5)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.svg>
      </>
    ),
  },

  // HISTÓRIAS EMOCIONANTES
  emotional_stories: {
    gradient: "from-rose-900/70 via-pink-800/50 to-purple-900/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl filter drop-shadow-lg">💔</span>
        </motion.div>
        {/* Lágrimas */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-3 rounded-full bg-gradient-to-b from-blue-300/60 to-transparent"
            style={{ left: `${20 + i * 15}%`, top: '20%' }}
            animate={{ y: [0, 60], opacity: [0.8, 0] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
        {/* Bokeh */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-pink-400/20 blur-sm"
            style={{ width: 8 + i * 4, height: 8 + i * 4, left: `${10 + i * 25}%`, top: `${15 + (i % 2) * 50}%` }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
          />
        ))}
        {/* Texto */}
        <motion.p
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-rose-300/60 italic font-serif whitespace-nowrap"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          "histórias que tocam a alma..."
        </motion.p>
        <div className="absolute inset-2 border border-rose-400/20 rounded-lg pointer-events-none" />
      </>
    ),
  },
};

export const NicheVisualPreview = ({ niche, className }: NicheVisualPreviewProps) => {
  const visual = NICHE_VISUALS[niche];
  
  if (!visual) return null;
  
  return (
    <motion.div
      className={cn(
        "relative w-full h-24 rounded-lg overflow-hidden",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradiente de fundo */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        visual.gradient
      )} />
      
      {/* Overlay pattern */}
      {visual.overlay && (
        <div className={cn("absolute inset-0 opacity-30", visual.overlay)} />
      )}
      
      {/* Vinheta */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
      
      {/* Elementos animados */}
      {visual.elements}
      
      {/* Borda sutil */}
      <div className="absolute inset-0 border border-white/10 rounded-lg pointer-events-none" />
    </motion.div>
  );
};
