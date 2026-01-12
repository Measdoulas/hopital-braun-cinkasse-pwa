/**
 * Design Tokens - Hôpital Braun Cinkassé
 * Design System Premium & Professionnel
 */

// ==================== PALETTE DE COULEURS ====================
// Utilise uniquement les couleurs standard de Tailwind pour garantir la compatibilité

export const colors = {
    // Primary (Bleu) - 9 nuances
    primary: {
        50: '#eff6ff',   // blue-50
        100: '#dbeafe',  // blue-100
        200: '#bfdbfe',  // blue-200
        300: '#93c5fd',  // blue-300
        400: '#60a5fa',  // blue-400
        500: '#3b82f6',  // blue-500
        600: '#2563eb',  // blue-600 - Principal
        700: '#1d4ed8',  // blue-700
        800: '#1e40af',  // blue-800
        900: '#1e3a8a',  // blue-900
    },

    // Success (Vert) - 9 nuances
    success: {
        50: '#f0fdf4',   // green-50
        100: '#dcfce7',  // green-100
        200: '#bbf7d0',  // green-200
        300: '#86efac',  // green-300
        400: '#4ade80',  // green-400
        500: '#22c55e',  // green-500
        600: '#16a34a',  // green-600 - Principal
        700: '#15803d',  // green-700
        800: '#166534',  // green-800
        900: '#14532d',  // green-900
    },

    // Warning (Orange) - 9 nuances
    warning: {
        50: '#fffbeb',   // amber-50
        100: '#fef3c7',  // amber-100
        200: '#fde68a',  // amber-200
        300: '#fcd34d',  // amber-300
        400: '#fbbf24',  // amber-400
        500: '#f59e0b',  // amber-500 - Principal
        600: '#d97706',  // amber-600
        700: '#b45309',  // amber-700
        800: '#92400e',  // amber-800
        900: '#78350f',  // amber-900
    },

    // Danger (Rouge) - 9 nuances
    danger: {
        50: '#fef2f2',   // red-50
        100: '#fee2e2',  // red-100
        200: '#fecaca',  // red-200
        300: '#fca5a5',  // red-300
        400: '#f87171',  // red-400
        500: '#ef4444',  // red-500 - Principal
        600: '#dc2626',  // red-600
        700: '#b91c1c',  // red-700
        800: '#991b1b',  // red-800
        900: '#7f1d1d',  // red-900
    },

    // Neutral (Gris/Slate) - 11 nuances
    neutral: {
        50: '#f8fafc',   // slate-50
        100: '#f1f5f9',  // slate-100
        200: '#e2e8f0',  // slate-200
        300: '#cbd5e1',  // slate-300
        400: '#94a3b8',  // slate-400
        500: '#64748b',  // slate-500
        600: '#475569',  // slate-600
        700: '#334155',  // slate-700
        800: '#1e293b',  // slate-800
        900: '#0f172a',  // slate-900
        950: '#020617',  // slate-950
    },
};

// ==================== TYPOGRAPHIE ====================

export const typography = {
    fontSize: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
    },

    fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },

    lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
        loose: '2',
    },

    letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
    },
};

// ==================== ESPACEMENT ====================

export const spacing = {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
};

// ==================== OMBRES ====================

export const shadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

// ==================== BORDURES ====================

export const borderRadius = {
    none: '0',
    sm: '0.125rem',    // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',
};

export const borderWidth = {
    0: '0',
    DEFAULT: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
};

// ==================== TRANSITIONS ====================

export const transitions = {
    duration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        slower: '500ms',
    },

    timing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
    },
};
