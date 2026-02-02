import clsx from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'info', size = 'sm' }: BadgeProps) {
  const baseClasses = 'rounded font-semibold inline-block';
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';

  const variantClasses = {
    success: 'bg-green-900 text-green-200',
    warning: 'bg-yellow-900 text-yellow-200',
    danger: 'bg-red-900 text-red-200',
    info: 'bg-cyan-900 text-cyan-200',
  };

  return (
    <span className={clsx(baseClasses, sizeClasses, variantClasses[variant])}>
      {label}
    </span>
  );
}
