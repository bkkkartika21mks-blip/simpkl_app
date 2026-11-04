import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Memuat data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center" role="status">
      <Loader2 className={`${sizeClasses[size]} text-teal-600 dark:text-teal-400 animate-spin`} />
      {label && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">{label}</p>}
    </div>
  );
};
