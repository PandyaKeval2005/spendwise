import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { TopHeader } from './TopHeader';
import { MobileBottomNav } from './MobileBottomNav';

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-slate-900">
      {/* Desktop Left Sidebar */}
      <DesktopSidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 sm:pb-8">
        {/* Sticky Top Header with Month Navigation */}
        <TopHeader onSelectTab={onSelectTab} />

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={onSelectTab}
      />
    </div>
  );
};
