import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, RotateCcw, Coffee, Zap, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import confetti from 'canvas-confetti';

type SessionType = 'work' | 'break' | 'longBreak';

const DEFAULT_TIMES = {
  work: 25,
  break: 5,
  longBreak: 15,
};

export function PomodoroCard() {
  const [times, setTimes] = useState(DEFAULT_TIMES);
  const [timeLeft, setTimeLeft] = useState(times.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Play notification sound
  const playNotification = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not available');
    }
  }, []);

  // Handle session completion
  const handleSessionComplete = useCallback(() => {
    playNotification();
    
    if (sessionType === 'work') {
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);
      
      // Mini celebration
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
      
      // Switch to break (long break every 4 sessions)
      if (newCount % 4 === 0) {
        setSessionType('longBreak');
        setTimeLeft(times.longBreak * 60);
      } else {
        setSessionType('break');
        setTimeLeft(times.break * 60);
      }
    } else {
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
  }, [sessionType, completedSessions, times, playNotification]);

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

  const handleSessionSwitch = (type: SessionType) => {
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(
      type === 'work' 
        ? times.work * 60 
        : type === 'break' 
          ? times.break * 60 
          : times.longBreak * 60
    );
  };

  const handleSaveSettings = (newTimes: typeof times) => {
    setTimes(newTimes);
    // Reset current timer with new time
    setTimeLeft(
      sessionType === 'work' 
        ? newTimes.work * 60 
        : sessionType === 'break' 
          ? newTimes.break * 60 
          : newTimes.longBreak * 60
    );
    setSettingsOpen(false);
    toast.success('Tempos atualizados!');
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

  return (
    <Card className="h-full flex flex-col border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            Pomodoro
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {completedSessions} 🍅
            </span>
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Configurar Tempos</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Foco (min)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        defaultValue={times.work}
                        className="w-16 h-7 text-xs"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 25;
                          setTimes(prev => ({ ...prev, work: val }));
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Pausa (min)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        defaultValue={times.break}
                        className="w-16 h-7 text-xs"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 5;
                          setTimes(prev => ({ ...prev, break: val }));
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Pausa Longa (min)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={45}
                        defaultValue={times.longBreak}
                        className="w-16 h-7 text-xs"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 15;
                          setTimes(prev => ({ ...prev, longBreak: val }));
                        }}
                      />
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full h-7 text-xs"
                    onClick={() => handleSaveSettings(times)}
                  >
                    Salvar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Session Type Tabs */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          <button
            onClick={() => handleSessionSwitch('work')}
            className={`flex-1 py-1 px-2 text-xs font-medium rounded transition-colors ${
              sessionType === 'work' 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            Foco
          </button>
          <button
            onClick={() => handleSessionSwitch('break')}
            className={`flex-1 py-1 px-2 text-xs font-medium rounded transition-colors ${
              sessionType === 'break' 
                ? 'bg-green-500 text-white' 
                : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            Pausa
          </button>
          <button
            onClick={() => handleSessionSwitch('longBreak')}
            className={`flex-1 py-1 px-2 text-xs font-medium rounded transition-colors ${
              sessionType === 'longBreak' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            Longa
          </button>
        </div>

        {/* Timer Display */}
        <div className="text-center py-4">
          <p className={`text-4xl font-bold font-mono ${getSessionColor()}`}>
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

        {/* Progress Bar */}
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {!isRunning ? (
            <Button 
              onClick={handleStart} 
              size="sm" 
              className="gap-1.5"
            >
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
          ) : (
            <Button 
              onClick={handlePause} 
              size="sm" 
              variant="secondary"
              className="gap-1.5"
            >
              <Pause className="h-4 w-4" />
              Pausar
            </Button>
          )}
          <Button 
            onClick={handleReset} 
            size="sm" 
            variant="outline"
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
