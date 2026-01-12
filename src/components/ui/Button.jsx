import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Button Component - Premium Design System
 * 
 * @param {object} props
 * @param {'primary'|'secondary'|'success'|'danger'|'ghost'} props.variant - Button style variant
 * @param {'sm'|'md'|'lg'|'xl'} props.size - Button size
 * @param {boolean} props.isLoading - Show loading state
 * @param {boolean} props.fullWidth - Expand to full width
 */
export const Button = React.forwardRef((
    {
        className,
        variant = 'primary',
        size = 'md',
        isLoading = false,
        fullWidth = false,
        children,
        ...props
    }, ref) => {
    // Variantes avec couleurs standard Tailwind
    const variants = {
        primary: clsx(
            'bg-blue-600 text-white',
            'hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30',
            'active:bg-blue-800 active:shadow-md active:scale-[0.98]',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:bg-blue-300 disabled:cursor-not-allowed disabled:shadow-none'
        ),

        secondary: clsx(
            'bg-white text-blue-600 border-2 border-blue-600',
            'hover:bg-blue-50 hover:border-blue-700',
            'active:bg-blue-100 active:scale-[0.98]',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'disabled:bg-slate-50 disabled:text-blue-300 disabled:border-blue-200 disabled:cursor-not-allowed'
        ),

        success: clsx(
            'bg-green-600 text-white',
            'hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/30',
            'active:bg-green-800 active:shadow-md active:scale-[0.98]',
            'focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
            'disabled:bg-green-300 disabled:cursor-not-allowed disabled:shadow-none'
        ),

        danger: clsx(
            'bg-red-600 text-white',
            'hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30',
            'active:bg-red-800 active:shadow-md active:scale-[0.98]',
            'focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
            'disabled:bg-red-300 disabled:cursor-not-allowed disabled:shadow-none'
        ),

        ghost: clsx(
            'bg-transparent text-slate-700',
            'hover:bg-slate-100',
            'active:bg-slate-200 active:scale-[0.98]',
            'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
            'disabled:text-slate-400 disabled:cursor-not-allowed'
        ),
    };

    // Tailles avec espacement généreux
    const sizes = {
        sm: 'h-9 px-3 py-1.5 text-sm',
        md: 'h-11 px-5 py-2.5 text-base',
        lg: 'h-13 px-6 py-3 text-lg',
        xl: 'h-14 px-8 py-3.5 text-lg',
    };

    return (
        <button
            ref={ref}
            className={twMerge(clsx(
                // Base styles
                'inline-flex items-center justify-center gap-2',
                'rounded-xl font-semibold',
                'transition-all duration-200',
                'focus-visible:outline-none',

                // Variante et taille
                variants[variant],
                sizes[size],

                // Full width
                fullWidth && 'w-full',

                // Custom className
                className
            ))}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';
