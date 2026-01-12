import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Badge Component - Premium Design System
 * Badges colorés pour statuts, tags, compteurs
 * 
 * @param {object} props
 * @param {'default'|'primary'|'success'|'warning'|'danger'} props.variant - Style du badge
 * @param {React.ElementType} props.icon - Icône Lucide optionnelle
 */
export const Badge = ({
    className,
    variant = 'default',
    icon: Icon,
    children,
    ...props
}) => {
    const variants = {
        default: 'bg-slate-100 text-slate-700',
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
    };

    return (
        <span
            className={twMerge(clsx(
                // Base styles
                'inline-flex items-center gap-1 px-2.5 py-0.5',
                'rounded-full text-xs font-medium',
                'transition-colors duration-200',

                // Variant
                variants[variant],

                // Custom className
                className
            ))}
            {...props}
        >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {children}
        </span>
    );
};
