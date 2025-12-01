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
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        {backPath && (
          <button
            onClick={() => router.push(backPath)}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all group"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        )}
        <button
          onClick={handleStartNewProject}
          className="p-2.5 hover:bg-gray-100 rounded-xl transition-all group"
          title="Start a new project"
        >
          <ListRestart className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
        {(backPath || true) && <div className="h-6 w-px bg-gray-200" />}
        <div>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {icon}
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-600 mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightContent && (
        <div className="flex items-center gap-3">{rightContent}</div>
      )}
    </div>
  );
}
