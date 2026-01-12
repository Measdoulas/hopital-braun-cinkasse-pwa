import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Card Component - Premium Design System
 * Container élégant avec ombres douces et espacement généreux
 */
export const Card = React.forwardRef(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx(
            // Base styles
            'bg-white',
            'rounded-2xl',
            'shadow-sm',

            // Hover effect
            'hover:shadow-md',
            'transition-shadow duration-300',

            // Custom className
            className
        ))}
        {...props}
    >
        {children}
    </div>
));
Card.displayName = "Card";

/**
 * CardHeader - En-tête de carte avec padding généreux
 */
export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx(
            "flex flex-col space-y-2 p-6",
            className
        ))}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle - Titre de carte avec typographie claire
 */
export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={twMerge(clsx(
            "text-xl font-bold leading-tight tracking-tight text-slate-900",
            className
        ))}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription - Description secondaire
 */
export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={twMerge(clsx(
            "text-sm text-slate-500 leading-relaxed",
            className
        ))}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent - Contenu principal avec padding
 */
export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx(
            "p-6 pt-0",
            className
        ))}
        {...props}
    />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter - Pied de carte pour actions
 */
export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge(clsx(
            "flex items-center gap-4 p-6 pt-0",
            className
        ))}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";
