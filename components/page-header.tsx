"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ListRestart } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  backPath?: string;
  onNewProject?: () => void;
  rightContent?: ReactNode;
  subtitle?: string;
}

export function PageHeader({
  title,
  icon,
  backPath,
  onNewProject,
  rightContent,
  subtitle,
}: PageHeaderProps) {
  const router = useRouter();

  const handleStartNewProject = () => {
    if (onNewProject) {
      onNewProject();
    } else {
      if (
        confirm("Start a new project? This will clear all your current work.")
      ) {
        router.push("/");
      }
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {backPath && (
          <button
            onClick={() => router.push(backPath)}
            className="p-2 md:p-2.5 hover:bg-gray-100 rounded-xl transition-all group touch-manipulation flex-shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        )}
        <button
          onClick={handleStartNewProject}
          className="p-2 md:p-2.5 hover:bg-gray-100 rounded-xl transition-all group touch-manipulation flex-shrink-0"
          title="Start a new project"
        >
          <ListRestart className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
        {(backPath || true) && (
          <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-1.5 md:gap-2 truncate">
            {icon}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-600 mt-0.5 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightContent && (
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}
