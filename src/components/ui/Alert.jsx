import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export const Alert = React.forwardRef(({ className, variant = 'info', title, children, ...props }, ref) => {
    const variants = {
        info: 'bg-blue-50 text-blue-900 border-blue-200',
        success: 'bg-green-50 text-green-900 border-green-200',
        warning: 'bg-orange-50 text-orange-900 border-orange-200',
        error: 'bg-red-50 text-red-900 border-red-200',
    };

    const icons = {
        info: <Info className="h-5 w-5 text-blue-500" />,
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        warning: <AlertCircle className="h-5 w-5 text-orange-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
    };

    return (
        <div
            ref={ref}
            className={twMerge(clsx(
                "relative w-full rounded-lg border p-4 flex gap-3",
                variants[variant],
                className
            ))}
            role="alert"
            {...props}
        >
            <div className="flex-shrink-0">{icons[variant]}</div>
            <div className="flex-1">
                {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
                <div className="text-sm opacity-90">{children}</div>
            </div>
        </div>
    );
});

Alert.displayName = 'Alert';
