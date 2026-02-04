import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'cyan' | 'yellow' | 'purple' | 'red' | 'green' | 'gold';
  hover?: boolean;
}

const variantStyles = {
  default: 'border-white/20 hover:border-white/30',
  cyan: 'border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/10',
  yellow: 'border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-yellow-500/10',
  purple: 'border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/10',
  red: 'border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/10',
  green: 'border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/10',
  gold: 'border-yellow-500/30 hover:border-yellow-400/50 hover:shadow-yellow-500/20',
};

export function GlassCard({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true 
}: GlassCardProps) {
  return (
    <div 
      className={`
        bg-black/50 backdrop-blur-md rounded-xl border
        ${variantStyles[variant]}
        ${hover ? 'transition-all duration-300 hover:shadow-lg hover:bg-black/60' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
