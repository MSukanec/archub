import React from "react";
import { FolderOpen } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface UserSelectorProps {
  projects: Project[];
  onProjectSelect: (projectId: string | null) => void;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export default function UserSelector({
  projects,
  onProjectSelect,
  isExpanded,
  onToggle,
  className = ""
}: UserSelectorProps) {
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={onToggle}
        className="w-full h-12 flex items-center justify-center rounded-xl transition-colors bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--menues-fg)] hover:bg-[var(--card-hover-bg)]"
      >
        <FolderOpen className="h-6 w-6" />
      </button>

      {isExpanded && (
        <div 
          className="fixed bottom-20 left-4 right-4 border rounded-xl shadow-lg h-[50vh] overflow-y-auto z-50 p-1"
          style={{ 
            backgroundColor: 'var(--menues-bg)',
            borderColor: 'var(--menues-border)',
          }}
        >
          <div className="px-2 py-1 text-xs font-medium border-b border-[var(--menues-border)] mb-1" style={{ color: 'var(--menues-fg)' }}>
            Proyecto
          </div>
          {/* Opción "General" */}
          <button
            onClick={() => onProjectSelect(null)}
            className="w-full px-2 py-3 text-left text-base hover:bg-[var(--menues-hover-bg)] transition-colors rounded-xl"
            style={{ color: 'var(--menues-fg)' }}
          >
            General
          </button>
          {projects?.map((project) => (
            <button
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              className="w-full px-2 py-3 text-left text-base hover:bg-[var(--menues-hover-bg)] transition-colors rounded-xl"
              style={{ color: 'var(--menues-fg)' }}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}