import React from 'react';
import { Plus, Settings, History } from 'lucide-react';

interface SidebarHeaderProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onNewChat, onOpenSettings }) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] shrink-0">
      <div className="flex items-center gap-2 font-semibold text-[var(--vscode-sideBarTitle-foreground)]">
        Arc1610
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onNewChat}
          title="New Chat"
          className="p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-icon-foreground)] transition-colors bg-transparent"
        >
          <Plus size={16} />
        </button>
        <button 
          title="History"
          className="p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-icon-foreground)] transition-colors bg-transparent"
        >
          <History size={16} />
        </button>
        <button 
          onClick={onOpenSettings}
          title="Settings"
          className="p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-icon-foreground)] transition-colors bg-transparent"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};
