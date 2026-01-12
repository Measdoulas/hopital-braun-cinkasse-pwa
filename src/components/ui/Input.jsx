import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Input Component - Premium Design System
 * Champs de formulaire avec focus clair et états d'erreur
 * 
 * @param {object} props
 * @param {string} props.error - Message d'erreur à afficher
 * @param {string} props.label - Label du champ
 * @param {boolean} props.required - Champ obligatoire
 */
export const Input = React.forwardRef(({ className, error, label, required, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="relative w-full space-y-2">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-slate-700"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <input
                id={inputId}
                className={twMerge(clsx(
                    // Base styles
                    'flex h-12 w-full px-4 py-3',
                    'rounded-xl',
                    'border-2',
                    'bg-white',
                    'text-slate-900 text-base',
                    'placeholder:text-slate-400',
                    'transition-all duration-200',

                    // States normaux
                    'border-slate-200',
                    'hover:border-slate-300',

                    // Focus state
                    'focus:outline-none',
                    'focus:border-blue-500',
                    'focus:ring-4',
                    'focus:ring-blue-500/10',

                    // Disabled state
                    'disabled:bg-slate-50',
                    'disabled:text-slate-400',
                    'disabled:cursor-not-allowed',
                    'disabled:border-slate-200',

                    // Error state
                    error && [
                        'border-red-500',
                        'focus:border-red-500',
                        'focus:ring-red-500/10',
                        'bg-red-50/50'
                    ],

                    className
                ))}
                ref={ref}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${inputId}-error` : undefined}
                {...props}
            />

            {error && (
                <p
                    id={`${inputId}-error`}
                    className="text-sm text-red-600 font-medium flex items-center gap-1.5"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
