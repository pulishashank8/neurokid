"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionMenuProps {
    onEdit?: () => void;
    onDelete?: () => void;
    isOwner: boolean;
    resourceName?: string; // e.g. "Post", "Comment", "Message"
}

export function ActionMenu({ onEdit, onDelete, isOwner, resourceName = "Item" }: ActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOwner) return null;

    if (showDeleteConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 scale-100 opacity-100">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        Delete {resourceName}?
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Are you sure you want to delete this? This action cannot be undone.
                    </p>
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (onDelete) onDelete();
                                setShowDeleteConfirm(false);
                                setIsOpen(false);
                            }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm shadow-red-500/20 transition-all"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                aria-label="More actions"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-1">
                        {onEdit && (
                            <button
                                onClick={() => {
                                    onEdit();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(true);
                                    // setIsOpen(false); // Wait until confirm action closes it or the confirm modal takes over
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
