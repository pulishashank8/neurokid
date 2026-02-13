'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  ArrowRight,
  Loader2,
  ListTodo,
} from 'lucide-react';
import Link from 'next/link';
import { FormattedDate } from '@/components/shared/FormattedDate';

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  completed: boolean;
}

interface TodoWidgetProps {
  className?: string;
}

export default function TodoWidget({ className = '' }: TodoWidgetProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch('/api/owner/todos');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTodos(data.todos || []);
    } catch {
      // No fake data – show empty when API fails or doesn't exist
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTodo(id: string) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));

    try {
      await fetch(`/api/owner/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
    } catch {
      // Revert on error
      setTodos(prev => prev.map(t =>
        t.id === id ? { ...t, completed: todo.completed } : t
      ));
    }
  }

  async function addTodo() {
    if (!newTodo.trim()) return;
    setAdding(true);

    const tempId = `temp-${Date.now()}`;
    const newItem: TodoItem = {
      id: tempId,
      title: newTodo.trim(),
      priority: 'MEDIUM',
      completed: false,
    };

    setTodos(prev => [newItem, ...prev]);
    setNewTodo('');

    try {
      const res = await fetch('/api/owner/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newItem.title, priority: 'MEDIUM' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodos(prev => prev.map(t => t.id === tempId ? data.todo : t));
      }
    } catch {
      // Keep the temp item if API fails
    } finally {
      setAdding(false);
    }
  }

  async function deleteTodo(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id));

    try {
      await fetch(`/api/owner/todos/${id}`, { method: 'DELETE' });
    } catch {
      // Could restore on error, but for now just let it be removed
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'LOW':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  const pendingCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className={`bg-card backdrop-blur-xl rounded-2xl border border-border p-6 transition-colors duration-500 ease-out ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">My Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {pendingCount} pending, {completedCount} done
            </p>
          </div>
        </div>
        <Link
          href="/owner/dashboard/actions"
          className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
        >
          All Tasks
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Add Todo Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new task..."
          className="flex-1 px-3 py-2 bg-slate-900/50 border border-white/5 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
        />
        <button
          onClick={addTodo}
          disabled={adding || !newTodo.trim()}
          className="px-3 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Plus className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* Todo List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No tasks yet. Add one above!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todos.slice(0, 5).map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                todo.completed
                  ? 'bg-muted/20 border-border opacity-60'
                  : 'bg-muted/30 border-border hover:bg-accent/50'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="flex-shrink-0"
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-400 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {todo.title}
                </div>
                {todo.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <FormattedDate date={todo.dueDate} style="date" />
                  </div>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                {todo.priority}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
