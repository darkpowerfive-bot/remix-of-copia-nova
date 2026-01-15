import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Plus, Trash2, CheckCircle2, Trophy, Loader2, Rocket, TrendingUp, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import confetti from 'canvas-confetti';

interface UserGoal {
  id: string;
  goal_type: string;
  period_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
}

interface SuggestedGoal {
  period_type: 'weekly' | 'monthly';
  suggested_value: number;
  average_history: number;
  improvement_percentage: number;
}

const GOAL_TYPES = [
  { value: 'videos', label: 'Vídeos Finalizados', icon: '🎬' },
];

const PERIOD_TYPES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
];

export function UserGoalsCard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const celebratedGoals = useRef<Set<string>>(new Set());

  // Celebration effect when goal is completed
  const triggerCelebration = (goalType: string, periodType: string) => {
    // Confetti effect
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F97316', '#FBBF24', '#22C55E', '#3B82F6', '#A855F7'],
    });

    // Second burst for more impact
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5, x: 0.3 },
      });
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5, x: 0.7 },
      });
    }, 250);

    // Special toast
    toast.success(
      <div className="flex items-center gap-3">
        <PartyPopper className="h-6 w-6 text-primary" />
        <div>
          <p className="font-bold">🎉 Meta Atingida!</p>
          <p className="text-sm text-muted-foreground">
            Parabéns! Você completou sua meta {periodType === 'weekly' ? 'semanal' : 'mensal'} de vídeos!
          </p>
        </div>
      </div>,
      {
        duration: 5000,
        className: 'border-primary/50 bg-gradient-to-r from-primary/10 to-transparent',
      }
    );
  };
  
  // Form state
  const [goalType, setGoalType] = useState('videos');
  const [periodType, setPeriodType] = useState('weekly');
  const [targetValue, setTargetValue] = useState('5');

  const fetchGoals = async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date();
      
      const { data, error } = await (supabase
        .from('user_goals' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('end_date', format(today, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      // Update current values and check for completions
      const updatedGoals = await Promise.all(
        (data || []).map(async (goal) => {
          const currentValue = await calculateCurrentValue(
            goal.goal_type,
            goal.start_date,
            goal.end_date
          );
          
          // Check if goal was just completed (not celebrated yet)
          const isCompleted = currentValue >= goal.target_value;
          const wasCompletedBefore = goal.is_completed;
          const goalKey = `${goal.id}-${goal.start_date}`;
          
          if (isCompleted && !wasCompletedBefore && !celebratedGoals.current.has(goalKey)) {
            celebratedGoals.current.add(goalKey);
            triggerCelebration(goal.goal_type, goal.period_type);
            
            // Mark goal as completed in database
            await (supabase
              .from('user_goals' as any)
              .update({ is_completed: true, completed_at: new Date().toISOString() })
              .eq('id', goal.id) as any);
          }
          
          return { ...goal, current_value: currentValue, is_completed: isCompleted };
        })
      );

      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Um vídeo finalizado = download de imagens em lote (batch_generation_history)
  const calculateCurrentValue = async (
    goalType: string,
    startDate: string,
    endDate: string
  ): Promise<number> => {
    if (!user?.id) return 0;

    if (goalType === 'videos') {
      // Conta vídeos finalizados baseado em downloads de imagens (batch_generation_history)
      const { count, error } = await supabase
        .from('batch_generation_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      if (error) {
        console.error('Error calculating current value:', error);
        return 0;
      }

      return count || 0;
    }

    return 0;
  };

  const handleCreateGoal = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      if (periodType === 'weekly') {
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
      } else {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      }

      // Check if goal already exists for this type and period
      // Check if goal already exists using type assertion for the new table
      const { data: existing } = await (supabase
        .from('user_goals' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('goal_type', goalType)
        .eq('period_type', periodType)
        .eq('start_date', format(startDate, 'yyyy-MM-dd'))
        .single() as any);

      if (existing) {
        toast.error('Você já tem uma meta deste tipo para este período');
        setSaving(false);
        return;
      }

      const { error } = await (supabase.from('user_goals' as any) as any).insert({
        user_id: user.id,
        goal_type: goalType,
        period_type: periodType,
        target_value: parseInt(targetValue),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;

      toast.success('Meta criada com sucesso!');
      setIsDialogOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Erro ao criar meta');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await (supabase
        .from('user_goals' as any)
        .delete()
        .eq('id', goalId) as any);

      if (error) throw error;

      toast.success('Meta removida');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erro ao remover meta');
    }
  };

  // Calculate suggested goals based on video production history
  const calculateSuggestedGoals = async () => {
    if (!user?.id) return;
    
    setLoadingSuggestions(true);
    try {
      const suggestions: SuggestedGoal[] = [];
      const today = new Date();
      
      // Calculate weekly average based on batch_generation_history (finished videos = image downloads)
      const weeklyData: number[] = [];
      for (let i = 1; i <= 4; i++) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        
        const { count } = await supabase
          .from('batch_generation_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', format(weekStart, 'yyyy-MM-dd'))
          .lte('created_at', format(weekEnd, 'yyyy-MM-dd') + 'T23:59:59');
        
        weeklyData.push(count || 0);
      }
      
      const weeklyAverage = weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length;
      const weeklySuggested = Math.max(1, Math.ceil(weeklyAverage * 1.2)); // 20% improvement
      
      suggestions.push({
        period_type: 'weekly',
        suggested_value: weeklySuggested,
        average_history: Math.round(weeklyAverage * 10) / 10,
        improvement_percentage: 20,
      });
      
      // Calculate monthly average based on batch_generation_history
      const monthlyData: number[] = [];
      for (let i = 1; i <= 3; i++) {
        const monthStart = startOfMonth(subMonths(today, i));
        const monthEnd = endOfMonth(subMonths(today, i));
        
        const { count } = await supabase
          .from('batch_generation_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', format(monthStart, 'yyyy-MM-dd'))
          .lte('created_at', format(monthEnd, 'yyyy-MM-dd') + 'T23:59:59');
        
        monthlyData.push(count || 0);
      }
      
      const monthlyAverage = monthlyData.reduce((a, b) => a + b, 0) / monthlyData.length;
      const monthlySuggested = Math.max(1, Math.ceil(monthlyAverage * 1.15)); // 15% improvement
      
      suggestions.push({
        period_type: 'monthly',
        suggested_value: monthlySuggested,
        average_history: Math.round(monthlyAverage * 10) / 10,
        improvement_percentage: 15,
      });
      
      setSuggestedGoals(suggestions);
    } catch (error) {
      console.error('Error calculating suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: SuggestedGoal) => {
    setGoalType('videos');
    setPeriodType(suggestion.period_type);
    setTargetValue(suggestion.suggested_value.toString());
    
    // Create the goal directly
    setSaving(true);
    try {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      if (suggestion.period_type === 'weekly') {
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
      } else {
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
      }

      const { data: existing } = await (supabase
        .from('user_goals' as any)
        .select('id')
        .eq('user_id', user?.id)
        .eq('goal_type', 'videos')
        .eq('period_type', suggestion.period_type)
        .eq('start_date', format(startDate, 'yyyy-MM-dd'))
        .single() as any);

      if (existing) {
        toast.error('Você já tem uma meta de vídeos para este período');
        setSaving(false);
        return;
      }

      const { error } = await (supabase.from('user_goals' as any) as any).insert({
        user_id: user?.id,
        goal_type: 'videos',
        period_type: suggestion.period_type,
        target_value: suggestion.suggested_value,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;

      toast.success('Meta de vídeos criada com sucesso!');
      fetchGoals();
      calculateSuggestedGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Erro ao criar meta');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    calculateSuggestedGoals();
  }, [user?.id]);

  const getGoalTypeInfo = (type: string) => {
    return GOAL_TYPES.find(g => g.value === type) || { label: type, icon: '📌' };
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Minhas Metas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Minhas Metas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={periodType} onValueChange={setPeriodType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_TYPES.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade Alvo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>

                <Button 
                  onClick={handleCreateGoal} 
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    'Criar Meta'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 overflow-auto">
        {/* Suggested Goals for Videos */}
        {suggestedGoals.length > 0 && !goals.some(g => g.goal_type === 'videos') && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Rocket className="h-4 w-4" />
              <span className="text-sm font-medium">Metas Sugeridas de Vídeos</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado no seu histórico de produção
            </p>
            <div className="space-y-2">
              {suggestedGoals.map((suggestion) => (
                <div 
                  key={suggestion.period_type}
                  className="flex items-center justify-between bg-background rounded-md p-2"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    <div>
                      <p className="text-xs font-medium">
                        {suggestion.period_type === 'weekly' ? 'Semanal' : 'Mensal'}: {suggestion.suggested_value} vídeos
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Média: {suggestion.average_history} • +{suggestion.improvement_percentage}% de melhoria
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Aceitar'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && suggestedGoals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma meta ativa</p>
            <p className="text-xs mt-1">Clique em "Nova Meta" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const typeInfo = getGoalTypeInfo(goal.goal_type);
              const progress = getProgressPercentage(goal.current_value, goal.target_value);
              const isCompleted = goal.current_value >= goal.target_value;

              return (
                <div 
                  key={goal.id} 
                  className={`space-y-2 p-2 rounded-lg transition-all ${
                    isCompleted 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-base flex-shrink-0">{isCompleted ? '🏆' : typeInfo.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{typeInfo.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {goal.period_type === 'weekly' ? 'Semanal' : 'Mensal'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={`text-xs font-bold ${isCompleted ? 'text-green-500' : ''}`}>
                        {goal.current_value}/{goal.target_value}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={progress}
                    className={`h-1.5 ${isCompleted ? '[&>div]:bg-green-500' : ''}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
