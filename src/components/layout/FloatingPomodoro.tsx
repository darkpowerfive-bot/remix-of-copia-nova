import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, RotateCcw, Coffee, Zap, X, Minimize2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type SessionType = 'work' | 'break' | 'longBreak';

const DEFAULT_TIMES = {
  work: 25,
  break: 5,
  longBreak: 15,
};

const STORAGE_KEY = 'pomodoro_position';
const VISIBILITY_KEY = 'pomodoro_visible';

export function FloatingPomodoro() {
  const { user } = useAuth();
  const [times, setTimes] = useState(DEFAULT_TIMES);
  const [timeLeft, setTimeLeft] = useState(times.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem(VISIBILITY_KEY);
    return saved !== 'false';
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { x: 0, y: 0 };
      }
    }
    return { x: 0, y: 0 };
  });
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Listen for visibility changes from settings
  useEffect(() => {
    const handleVisibilityChange = () => {
      const saved = localStorage.getItem(VISIBILITY_KEY);
      setIsVisible(saved !== 'false');
    };

    window.addEventListener('pomodoro-visibility-changed', handleVisibilityChange);
    return () => {
      window.removeEventListener('pomodoro-visibility-changed', handleVisibilityChange);
    };
  }, []);

  // Save position to localStorage
  const handleDragEnd = (_: any, info: any) => {
    const newPosition = { x: position.x + info.offset.x, y: position.y + info.offset.y };
    setPosition(newPosition);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosition));
  };

  // Load state from database
  useEffect(() => {
    if (!user) return;

    const loadState = async () => {
      const { data, error } = await supabase
        .from('pomodoro_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading pomodoro state:', error);
        setIsLoaded(true);
        return;
      }

      if (data) {
        setTimeLeft(data.time_left);
        setSessionType(data.session_type as SessionType);
        setCompletedSessions(data.completed_sessions);
        setTimes({
          work: data.work_duration,
          break: data.break_duration,
          longBreak: data.long_break_duration,
        });
      }
      setIsLoaded(true);
    };

    loadState();
  }, [user]);

  // Save state to database with debounce
  const saveState = useCallback(async () => {
    if (!user || !isLoaded) return;

    const stateData = {
      user_id: user.id,
      time_left: timeLeft,
      session_type: sessionType,
      completed_sessions: completedSessions,
      is_running: isRunning,
      work_duration: times.work,
      break_duration: times.break,
      long_break_duration: times.longBreak,
      last_updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('pomodoro_state')
      .upsert(stateData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving pomodoro state:', error);
    }
  }, [user, timeLeft, sessionType, completedSessions, isRunning, times, isLoaded]);

  // Debounced save
  useEffect(() => {
    if (!isLoaded) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveState();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [timeLeft, sessionType, completedSessions, isRunning, times, saveState, isLoaded]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    const totalTime = sessionType === 'work' 
      ? times.work * 60 
      : sessionType === 'break' 
        ? times.break * 60 
        : times.longBreak * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Play notification sound - Work session complete (triumphant melody)
  const playWorkCompleteSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      
      // Triumphant ascending melody
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const durations = [0.15, 0.15, 0.15, 0.4];
      
      let time = audioContext.currentTime;
      notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        osc.connect(noteGain);
        noteGain.connect(gainNode);
        osc.frequency.setValueAtTime(freq, time);
        osc.type = 'sine';
        noteGain.gain.setValueAtTime(0.3, time);
        noteGain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
        osc.start(time);
        osc.stop(time + durations[i]);
        time += durations[i] * 0.8;
      });
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  // Play notification sound - Break complete (gentle chime)
  const playBreakCompleteSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      
      // Gentle two-tone chime
      const notes = [659.25, 523.25]; // E5, C5
      let time = audioContext.currentTime;
      
      notes.forEach((freq) => {
        const osc = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        osc.connect(noteGain);
        noteGain.connect(gainNode);
        osc.frequency.setValueAtTime(freq, time);
        osc.type = 'sine';
        noteGain.gain.setValueAtTime(0.25, time);
        noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time);
        osc.stop(time + 0.3);
        time += 0.25;
      });
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  // Play tick sound (subtle click every minute)
  const playTickSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(1200, audioContext.currentTime);
      osc.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.05);
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  // Handle session completion
  const handleSessionComplete = useCallback(() => {
    if (sessionType === 'work') {
      playWorkCompleteSound();
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F97316', '#22C55E'],
      });
      
      toast.success(
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <p className="font-bold">Sessão completa! 🎯</p>
            <p className="text-sm text-muted-foreground">
              {newCount} {newCount === 1 ? 'sessão' : 'sessões'} hoje. Hora do descanso!
            </p>
          </div>
        </div>,
        { duration: 4000 }
      );
      
      if (newCount % 4 === 0) {
        setSessionType('longBreak');
        setTimeLeft(times.longBreak * 60);
      } else {
        setSessionType('break');
        setTimeLeft(times.break * 60);
      }
    } else {
      playBreakCompleteSound();
      toast.info(
        <div className="flex items-center gap-2">
          <Coffee className="h-5 w-5" />
          <span>Descanso finalizado! Bora produzir 💪</span>
        </div>
      );
      setSessionType('work');
      setTimeLeft(times.work * 60);
    }
    
    setIsRunning(false);
  }, [sessionType, completedSessions, times, playWorkCompleteSound, playBreakCompleteSound]);

  // Play tick sound every minute
  useEffect(() => {
    if (isRunning && timeLeft > 0 && timeLeft % 60 === 0 && timeLeft !== times[sessionType] * 60) {
      playTickSound();
    }
  }, [isRunning, timeLeft, sessionType, times, playTickSound]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, handleSessionComplete]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(
      sessionType === 'work' 
        ? times.work * 60 
        : sessionType === 'break' 
          ? times.break * 60 
          : times.longBreak * 60
    );
  };

  const handleClose = () => {
    localStorage.setItem(VISIBILITY_KEY, 'false');
    setIsVisible(false);
    window.dispatchEvent(new Event('pomodoro-visibility-changed'));
    toast.info(
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4" />
        <span>Pomodoro desativado. Reative em Configurações.</span>
      </div>,
      { duration: 3000 }
    );
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work': return 'text-primary';
      case 'break': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
    }
  };

  const getProgressColor = () => {
    switch (sessionType) {
      case 'work': return 'bg-primary';
      case 'break': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
    }
  };

  const getBorderColor = () => {
    switch (sessionType) {
      case 'work': return 'border-primary/50';
      case 'break': return 'border-green-500/50';
      case 'longBreak': return 'border-blue-500/50';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Invisible constraints container */}
      <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-40" />
      
      <AnimatePresence>
        <motion.div
          drag
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0.1}
          dragConstraints={constraintsRef}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "fixed bottom-6 right-6 z-50 rounded-xl border shadow-2xl backdrop-blur-xl transition-colors duration-300 cursor-grab active:cursor-grabbing",
            "bg-card/95",
            getBorderColor(),
            isExpanded ? "w-64" : "w-auto"
          )}
          style={{ touchAction: 'none' }}
        >
          {/* Compact View */}
          {!isExpanded && (
            <div className="flex items-center gap-2 p-2">
              <div 
                className="flex items-center gap-2 cursor-pointer flex-1"
                onClick={() => setIsExpanded(true)}
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  sessionType === 'work' ? 'bg-primary/20' : sessionType === 'break' ? 'bg-green-500/20' : 'bg-blue-500/20'
                )}>
                  <Timer className={cn("h-5 w-5", getSessionColor())} />
                </div>
                <div className="pr-1">
                  <p className={cn("text-lg font-bold font-mono leading-tight", getSessionColor())}>
                    {formatTime(timeLeft)}
                  </p>
                  <div className="h-1 w-14 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", getProgressColor())}
                      style={{ width: `${getProgress()}%` }}
                    />
                  </div>
                </div>
                {isRunning && (
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      sessionType === 'work' ? 'bg-primary' : sessionType === 'break' ? 'bg-green-500' : 'bg-blue-500'
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      getProgressColor()
                    )}></span>
                  </span>
                )}
              </div>
              <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            </div>
          )}

          {/* Expanded View */}
          {isExpanded && (
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                  <Timer className={cn("h-4 w-4", getSessionColor())} />
                  <span className="text-sm font-medium">Pomodoro</span>
                  <span className="text-xs text-muted-foreground">
                    {completedSessions} 🍅
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setIsExpanded(false)}
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                    onClick={handleClose}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Session Tabs */}
              <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
                {(['work', 'break', 'longBreak'] as SessionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setIsRunning(false);
                      setSessionType(type);
                      setTimeLeft(times[type] * 60);
                    }}
                    className={cn(
                      "flex-1 py-1 px-2 text-xs font-medium rounded transition-colors",
                      sessionType === type
                        ? type === 'work' 
                          ? 'bg-primary text-primary-foreground' 
                          : type === 'break'
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    {type === 'work' ? 'Foco' : type === 'break' ? 'Pausa' : 'Longa'}
                  </button>
                ))}
              </div>

              {/* Timer */}
              <div className="text-center py-2">
                <p className={cn("text-3xl font-bold font-mono", getSessionColor())}>
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {sessionType === 'work' 
                    ? 'Tempo de foco' 
                    : sessionType === 'break' 
                      ? 'Pausa curta' 
                      : 'Pausa longa'}
                </p>
              </div>

              {/* Progress */}
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", getProgressColor())}
                  style={{ width: `${getProgress()}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                {!isRunning ? (
                  <Button onClick={handleStart} size="sm" className="gap-1.5 h-8">
                    <Play className="h-3 w-3" />
                    Iniciar
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="sm" variant="secondary" className="gap-1.5 h-8">
                    <Pause className="h-3 w-3" />
                    Pausar
                  </Button>
                )}
                <Button onClick={handleReset} size="sm" variant="outline" className="gap-1.5 h-8">
                  <RotateCcw className="h-3 w-3" />
                  Resetar
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Export function to reopen pomodoro from settings
export function reopenPomodoro() {
  localStorage.setItem(VISIBILITY_KEY, 'true');
  window.dispatchEvent(new Event('pomodoro-visibility-changed'));
}
