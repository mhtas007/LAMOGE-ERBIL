import React from 'react';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { useAppContext } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate }) => {
  const { isRtl } = useAppContext();
  
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <StatusBar />
      <div className={`flex-1 bg-natural-bg text-natural-text flex flex-col print:bg-natural-surface overflow-hidden`}>
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 flex flex-col p-4 md:p-8 overflow-x-hidden overflow-y-auto print:p-0 print:overflow-visible relative">
          {children}
        </main>
      </div>
    </div>
  );
};
