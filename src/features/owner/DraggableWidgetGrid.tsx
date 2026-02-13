'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { GripVertical, X, Maximize2, Minimize2, Settings } from 'lucide-react';

export interface WidgetConfig {
  id: string;
  title: string;
  component: ReactNode;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  visible?: boolean;
  minimized?: boolean;
}

interface DraggableWidgetGridProps {
  widgets: WidgetConfig[];
  onLayoutChange?: (layout: WidgetConfig[]) => void;
  storageKey?: string;
  className?: string;
  editable?: boolean;
}

export default function DraggableWidgetGrid({
  widgets: initialWidgets,
  onLayoutChange,
  storageKey = 'owner-dashboard-layout',
  className = '',
  editable = true,
}: DraggableWidgetGridProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem(storageKey);
    if (savedLayout) {
      try {
        const layout = JSON.parse(savedLayout);
        // Merge saved layout with initial widgets (in case new widgets were added)
        const mergedWidgets = initialWidgets.map(widget => {
          const saved = layout.find((l: WidgetConfig) => l.id === widget.id);
          if (saved) {
            return { ...widget, visible: saved.visible, minimized: saved.minimized };
          }
          return widget;
        });
        // Reorder based on saved positions
        const orderedWidgets = layout
          .map((l: { id: string }) => mergedWidgets.find(w => w.id === l.id))
          .filter(Boolean) as WidgetConfig[];
        // Add any new widgets not in saved layout
        const newWidgets = mergedWidgets.filter(w => !layout.some((l: { id: string }) => l.id === w.id));
        setWidgets([...orderedWidgets, ...newWidgets]);
      } catch {
        setWidgets(initialWidgets);
      }
    }
  }, [initialWidgets, storageKey]);

  // Save layout changes
  const saveLayout = useCallback((newWidgets: WidgetConfig[]) => {
    const layoutData = newWidgets.map(w => ({
      id: w.id,
      visible: w.visible,
      minimized: w.minimized,
    }));
    localStorage.setItem(storageKey, JSON.stringify(layoutData));
    onLayoutChange?.(newWidgets);
  }, [storageKey, onLayoutChange]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = widgets.findIndex(w => w.id === draggedId);
    const targetIndex = widgets.findIndex(w => w.id === targetId);

    const newWidgets = [...widgets];
    const [draggedWidget] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedWidget);

    setWidgets(newWidgets);
    saveLayout(newWidgets);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const toggleVisibility = (id: string) => {
    const newWidgets = widgets.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    setWidgets(newWidgets);
    saveLayout(newWidgets);
  };

  const toggleMinimize = (id: string) => {
    const newWidgets = widgets.map(w =>
      w.id === id ? { ...w, minimized: !w.minimized } : w
    );
    setWidgets(newWidgets);
    saveLayout(newWidgets);
  };

  const resetLayout = () => {
    setWidgets(initialWidgets);
    localStorage.removeItem(storageKey);
    onLayoutChange?.(initialWidgets);
  };

  const visibleWidgets = widgets.filter(w => w.visible !== false);

  return (
    <div className={className}>
      {editable && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isEditMode
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            {isEditMode ? 'Done' : 'Customize'}
          </button>
          {isEditMode && (
            <button
              onClick={resetLayout}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-sm font-medium transition-all"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {isEditMode && (
        <div className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-white/5">
          <div className="text-sm font-medium text-white mb-2">Widgets</div>
          <div className="flex flex-wrap gap-2">
            {widgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => toggleVisibility(widget.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  widget.visible !== false
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-white/5'
                }`}
              >
                {widget.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleWidgets.map(widget => {
          const colSpanClass = widget.colSpan === 3 ? 'lg:col-span-3' : widget.colSpan === 2 ? 'lg:col-span-2' : '';
          const rowSpanClass = widget.rowSpan === 2 ? 'row-span-2' : '';

          return (
            <div
              key={widget.id}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={`relative ${colSpanClass} ${rowSpanClass} ${
                draggedId === widget.id ? 'opacity-50' : ''
              } ${isEditMode ? 'cursor-move' : ''}`}
            >
              {isEditMode && (
                <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                  <button
                    onClick={() => toggleMinimize(widget.id)}
                    className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                  >
                    {widget.minimized ? (
                      <Maximize2 className="w-3 h-3" />
                    ) : (
                      <Minimize2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleVisibility(widget.id)}
                    className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {isEditMode && (
                <div className="absolute top-2 left-2 z-10 p-1 rounded bg-slate-700/80 text-slate-400 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              {widget.minimized ? (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{widget.title}</span>
                    <button
                      onClick={() => toggleMinimize(widget.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                widget.component
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
