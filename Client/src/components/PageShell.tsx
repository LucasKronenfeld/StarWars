import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  hideOverlay?: boolean;
}

export function PageShell({ 
  children, 
  className = '', 
  hideOverlay = false,
}: PageShellProps) {
  return (
    <div 
      className={`min-h-screen bg-cover bg-center bg-fixed bg-no-repeat ${className}`}
      style={{ backgroundImage: "url('/space.png')" }}
    >
      {/* Dark overlay for readability */}
      {!hideOverlay && (
        <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 pointer-events-none" />
      )}
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
