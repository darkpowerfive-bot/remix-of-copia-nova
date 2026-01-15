import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutGrid, 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Video,
  FileText,
  Image,
  Mic,
  ChevronRight,
  ChevronLeft,
  Loader2,
  BarChart3,
  Kanban,
  Target,
  Trophy,
  Flame
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BoardTask {
  id: string;
  title: string;
  task_type: 'video' | 'script' | 'thumbnail' | 'audio' | 'other';
  column_id: 'backlog' | 'todo' | 'doing' | 'review' | 'done';
  task_order: number;
  created_at: string;
  completed_at: string | null;
  schedule_id: string | null;
}

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-zinc-800/80', headerColor: 'bg-zinc-700', icon: '📋', textColor: 'text-zinc-300' },
  { id: 'todo', title: 'A Fazer', color: 'bg-blue-900/40', headerColor: 'bg-blue-600', icon: '📝', textColor: 'text-blue-300' },
  { id: 'doing', title: 'Em Andamento', color: 'bg-amber-900/40', headerColor: 'bg-amber-600', icon: '🔥', textColor: 'text-amber-300' },
  { id: 'review', title: 'Revisão', color: 'bg-purple-900/40', headerColor: 'bg-purple-600', icon: '👀', textColor: 'text-purple-300' },
  { id: 'done', title: 'Concluído', color: 'bg-green-900/40', headerColor: 'bg-green-600', icon: '✅', textColor: 'text-green-300' },
] as const;

const taskTypes = [
  { id: 'video', label: 'Vídeo', icon: Video, color: 'text-red-400' },
  { id: 'script', label: 'Roteiro', icon: FileText, color: 'text-blue-400' },
  { id: 'thumbnail', label: 'Thumbnail', icon: Image, color: 'text-green-400' },
  { id: 'audio', label: 'Áudio', icon: Mic, color: 'text-purple-400' },
  { id: 'other', label: 'Outro', icon: LayoutGrid, color: 'text-muted-foreground' },
] as const;

export function ProductionBoardCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<BoardTask['task_type']>('video');
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<BoardTask | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleColumnIndex, setVisibleColumnIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'kanban' | 'report'>('kanban');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(5);

  // Fetch kanban settings from database
  const { data: kanbanSettings } = useQuery({
    queryKey: ['kanban-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_kanban_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const weeklyGoal = kanbanSettings?.weekly_goal ?? 5;

  // Save kanban settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newGoal: number) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_kanban_settings')
        .upsert({
          user_id: user.id,
          weekly_goal: newGoal,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-settings'] });
      toast.success('Meta semanal atualizada!');
      setIsEditingGoal(false);
    },
    onError: () => {
      toast.error('Erro ao salvar meta');
    },
  });

  // Fetch tasks from database
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['production-board-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('production_board_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('task_order', { ascending: true });
      
      if (error) throw error;
      return data as BoardTask[];
    },
    enabled: !!user?.id,
  });

  // Fetch completion history for weekly goal calculation
  const { data: completionHistory = [] } = useQuery({
    queryKey: ['task-completion-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const { data, error } = await supabase
        .from('task_completion_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', weekStart.toISOString())
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (params: { title: string; task_type: string; column_id: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const maxOrder = tasks.filter(t => t.column_id === params.column_id).length;
      
      const { data, error } = await supabase
        .from('production_board_tasks')
        .insert({
          user_id: user.id,
          title: params.title,
          task_type: params.task_type,
          column_id: params.column_id,
          task_order: maxOrder,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-board-tasks'] });
      toast.success('Tarefa adicionada!');
      setNewTaskTitle('');
      setAddingToColumn(null);
    },
    onError: () => {
      toast.error('Erro ao adicionar tarefa');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<BoardTask> }) => {
      const { error } = await supabase
        .from('production_board_tasks')
        .update(params.updates)
        .eq('id', params.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-board-tasks'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('production_board_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-board-tasks'] });
      toast.success('Tarefa removida');
    },
    onError: () => {
      toast.error('Erro ao remover tarefa');
    },
  });

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) {
      toast.error('Digite um título para a tarefa');
      return;
    }
    addTaskMutation.mutate({
      title: newTaskTitle.trim(),
      task_type: newTaskType,
      column_id: columnId,
    });
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const updateTaskTitle = (taskId: string) => {
    if (!editTitle.trim()) return;
    updateTaskMutation.mutate({
      id: taskId,
      updates: { title: editTitle.trim() },
    });
    setEditingTask(null);
    setEditTitle('');
  };

  const moveTask = async (taskId: string, newColumn: BoardTask['column_id']) => {
    const task = tasks.find(t => t.id === taskId);
    const updates: Partial<BoardTask> & { completed_at?: string | null } = { column_id: newColumn };
    
    // Set completed_at when moving to done, clear it when moving out
    if (newColumn === 'done') {
      updates.completed_at = new Date().toISOString();
      
      // Register in permanent history when completing a task
      if (task && user?.id) {
        await supabase.from('task_completion_history').insert({
          user_id: user.id,
          task_title: task.title,
          task_type: task.task_type,
          completed_at: updates.completed_at,
        });
        queryClient.invalidateQueries({ queryKey: ['task-completion-history'] });

        // Check if all tasks for this schedule are done
        if (task.schedule_id) {
          const scheduleTasks = tasks.filter(t => t.schedule_id === task.schedule_id);
          const otherTasksDone = scheduleTasks
            .filter(t => t.id !== taskId)
            .every(t => t.column_id === 'done');
          
          // If this is the last task, update schedule status to 'ready'
          if (otherTasksDone) {
            await supabase
              .from('publication_schedule')
              .update({ status: 'ready' })
              .eq('id', task.schedule_id);
            
            toast.success('🎉 Todas as tarefas concluídas! Vídeo marcado como Pronto na Agenda.');
          }
        }
      }
    } else {
      updates.completed_at = null;
    }
    
    updateTaskMutation.mutate({
      id: taskId,
      updates,
    });
    toast.success(`Movido para ${columns.find(c => c.id === newColumn)?.title}`);
  };

  const handleDragStart = (task: BoardTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (draggedTask && draggedTask.column_id !== columnId) {
      moveTask(draggedTask.id, columnId as BoardTask['column_id']);
    }
    setDraggedTask(null);
  };

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(t => t.column_id === columnId).sort((a, b) => a.task_order - b.task_order);
  };

  const getTaskIcon = (type: BoardTask['task_type']) => {
    const taskType = taskTypes.find(t => t.id === type);
    if (!taskType) return null;
    const Icon = taskType.icon;
    return <Icon className={`h-3 w-3 ${taskType.color}`} />;
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.column_id === 'done').length;
  const inProgressTasks = tasks.filter(t => t.column_id === 'doing').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Weekly goal calculations
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  // Use completion history for accurate weekly count (persists even after task deletion)
  const tasksCompletedThisWeek = completionHistory.length;

  const weeklyProgress = Math.min(100, Math.round((tasksCompletedThisWeek / weeklyGoal) * 100));
  const isGoalReached = tasksCompletedThisWeek >= weeklyGoal;

  const saveWeeklyGoal = () => {
    if (tempGoal >= 1 && tempGoal <= 50) {
      saveSettingsMutation.mutate(tempGoal);
    }
  };

  // Report data
  const columnData = columns.map(col => ({
    name: col.title,
    value: tasks.filter(t => t.column_id === col.id).length,
    color: col.id === 'backlog' ? '#71717a' : col.id === 'todo' ? '#3b82f6' : col.id === 'doing' ? '#f59e0b' : col.id === 'review' ? '#a855f7' : '#22c55e'
  }));

  const typeData = taskTypes.map(type => ({
    name: type.label,
    value: tasks.filter(t => t.task_type === type.id).length,
    color: type.id === 'video' ? '#ef4444' : type.id === 'script' ? '#3b82f6' : type.id === 'thumbnail' ? '#22c55e' : type.id === 'audio' ? '#a855f7' : '#71717a'
  })).filter(d => d.value > 0);

  const backlogTasks = tasks.filter(t => t.column_id === 'backlog').length;
  const todoTasks = tasks.filter(t => t.column_id === 'todo').length;
  const reviewTasks = tasks.filter(t => t.column_id === 'review').length;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Escada de Produção
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {viewMode === 'kanban' ? 'Arraste tarefas entre as colunas' : 'Visão geral do seu fluxo'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode('kanban')}
              >
                <Kanban className="h-3.5 w-3.5" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'report' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode('report')}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Relatório
              </Button>
            </div>
            {viewMode === 'kanban' && inProgressTasks > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                🔥 {inProgressTasks} em andamento
              </Badge>
            )}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">{completedTasks}/{totalTasks}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekly Goal Indicator - Always visible */}
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Meta Semanal</span>
              {isGoalReached && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
                  <Trophy className="h-3 w-3" />
                  Atingida!
                </Badge>
              )}
            </div>
            {isEditingGoal ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={tempGoal}
                  onChange={(e) => setTempGoal(parseInt(e.target.value) || 1)}
                  className="w-16 h-7 text-xs text-center"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveWeeklyGoal();
                    if (e.key === 'Escape') setIsEditingGoal(false);
                  }}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveWeeklyGoal}>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditingGoal(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 hover:bg-primary/10"
                onClick={() => {
                  setTempGoal(weeklyGoal);
                  setIsEditingGoal(true);
                }}
              >
                <Edit3 className="h-3 w-3" />
                {weeklyGoal} tarefas
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isGoalReached 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                    : 'bg-gradient-to-r from-primary to-amber-500'
                }`}
                style={{ width: `${weeklyProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
              {isGoalReached ? (
                <Flame className="h-4 w-4 text-green-400 animate-pulse" />
              ) : tasksCompletedThisWeek > 0 ? (
                <Flame className="h-4 w-4 text-amber-400" />
              ) : null}
              <span className={`text-sm font-bold ${isGoalReached ? 'text-green-400' : 'text-foreground'}`}>
                {tasksCompletedThisWeek}/{weeklyGoal}
              </span>
            </div>
          </div>
        </div>

        {viewMode === 'report' ? (
          /* Report View */
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {columns.map(col => {
                const count = tasks.filter(t => t.column_id === col.id).length;
                return (
                  <div key={col.id} className={`${col.color} rounded-xl p-3 text-center`}>
                    <div className="text-2xl mb-1">{col.icon}</div>
                    <div className={`text-2xl font-bold ${col.textColor}`}>{count}</div>
                    <div className="text-xs text-muted-foreground">{col.title}</div>
                  </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Column Distribution */}
              <div className="bg-secondary/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Distribuição por Etapa
                </h4>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={columnData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {columnData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Type Distribution */}
              <div className="bg-secondary/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Distribuição por Tipo
                </h4>
                {typeData.length > 0 ? (
                  <div className="h-[180px] flex items-center">
                    <ResponsiveContainer width="50%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {typeData.map((type, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                            <span className="text-muted-foreground">{type.name}</span>
                          </div>
                          <span className="font-semibold">{type.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                    Nenhuma tarefa ainda
                  </div>
                )}
              </div>
            </div>

            {/* Flow Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{progressPercent}%</div>
                <div className="text-xs text-green-300/70">Taxa de Conclusão</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">{inProgressTasks}</div>
                <div className="text-xs text-amber-300/70">Em Progresso</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{backlogTasks + todoTasks}</div>
                <div className="text-xs text-blue-300/70">Pendentes</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{reviewTasks}</div>
                <div className="text-xs text-purple-300/70">Em Revisão</div>
              </div>
            </div>
          </div>
        ) : (
          /* Kanban View */
          <>
        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisibleColumnIndex(Math.max(0, visibleColumnIndex - 1))}
            disabled={visibleColumnIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{columns[visibleColumnIndex].title}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisibleColumnIndex(Math.min(columns.length - 1, visibleColumnIndex + 1))}
            disabled={visibleColumnIndex === columns.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {columns.map((column) => {
            const columnTasks = getTasksByColumn(column.id);
            const isEmpty = columnTasks.length === 0;
            
            return (
              <div
                key={column.id}
                className={`rounded-xl overflow-hidden ${column.color} min-h-[300px] transition-all duration-200 ${
                  draggedTask && draggedTask.column_id !== column.id 
                    ? 'ring-2 ring-primary/30 ring-dashed' 
                    : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{column.icon}</span>
                    <h4 className={`text-sm font-bold ${column.textColor}`}>{column.title}</h4>
                  </div>
                  <Badge className={`${column.color} ${column.textColor} border-current/30 text-xs h-5 px-2 font-bold`}>
                    {columnTasks.length}
                  </Badge>
                </div>
                
                <div className="p-2">

                <ScrollArea className="h-[250px]">
                  <div className="space-y-2 pr-2">
                    {isEmpty && !addingToColumn && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="text-2xl mb-2 opacity-50">{column.icon}</div>
                        <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
                      </div>
                    )}
                    
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        className={`bg-background/90 rounded-lg p-2.5 cursor-grab active:cursor-grabbing border border-border/40 
                          hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 hover:scale-[1.02]
                          transition-all duration-200 ease-out group ${
                          draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        {editingTask === task.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateTaskTitle(task.id);
                                if (e.key === 'Escape') setEditingTask(null);
                              }}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateTaskTitle(task.id)}>
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTask(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                {getTaskIcon(task.task_type)}
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                  {taskTypes.find(t => t.id === task.task_type)?.label}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground line-clamp-2">{task.title}</p>
                            </div>
                            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-primary/10"
                                onClick={() => {
                                  setEditingTask(task.id);
                                  setEditTitle(task.title);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 hover:bg-destructive/10 text-destructive"
                                onClick={() => deleteTask(task.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {addingToColumn === column.id ? (
                      <div className="bg-background/90 rounded-lg p-3 border-2 border-primary/30 space-y-2.5">
                        <Input
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="O que você vai produzir?"
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addTask(column.id);
                            if (e.key === 'Escape') setAddingToColumn(null);
                          }}
                        />
                        <div className="flex flex-wrap gap-1">
                          {taskTypes.map((type) => (
                            <Button
                              key={type.id}
                              size="sm"
                              variant={newTaskType === type.id ? 'default' : 'outline'}
                              className={`h-7 text-xs px-2.5 ${newTaskType === type.id ? '' : 'hover:bg-secondary'}`}
                              onClick={() => setNewTaskType(type.id as BoardTask['task_type'])}
                            >
                              <type.icon className={`h-3 w-3 mr-1 ${newTaskType === type.id ? '' : type.color}`} />
                              {type.label}
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="h-7 text-xs flex-1" 
                            onClick={() => addTask(column.id)}
                            disabled={addTaskMutation.isPending}
                          >
                            {addTaskMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : '+ Adicionar'}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-3" onClick={() => setAddingToColumn(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 border border-dashed border-border/50 hover:border-primary/30"
                        onClick={() => setAddingToColumn(column.id)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Nova tarefa
                      </Button>
                    )}
                  </div>
                </ScrollArea>
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
