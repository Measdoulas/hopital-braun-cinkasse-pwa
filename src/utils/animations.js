/**
 * Animations & Transitions - Design System
 * Classes d'animations réutilisables pour micro-interactions
 */

// ==================== FADE IN ANIMATIONS ====================

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
};

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 }
};

export const fadeInDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
};

// ==================== SLIDE ANIMATIONS ====================

export const slideInRight = {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
};

export const slideInLeft = {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
};

// ==================== SCALE ANIMATIONS ====================

export const scaleIn = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.2 }
};

// ==================== CSS ANIMATION CLASSES ====================

/**
 * Classes Tailwind pour animations simples
 * Utilisez directement dans className
 */
export const animationClasses = {
    // Fade
    fadeIn: 'animate-in fade-in duration-300',
    fadeOut: 'animate-out fade-out duration-200',

    // Slide
    slideInFromBottom: 'animate-in slide-in-from-bottom-4 duration-300',
    slideInFromTop: 'animate-in slide-in-from-top-4 duration-300',
    slideInFromLeft: 'animate-in slide-in-from-left-4 duration-300',
    slideInFromRight: 'animate-in slide-in-from-right-4 duration-300',

    // Zoom
    zoomIn: 'animate-in zoom-in-95 duration-200',
    zoomOut: 'animate-out zoom-out-95 duration-200',

    // Spin (loading)
    spin: 'animate-spin',

    // Pulse (attention)
    pulse: 'animate-pulse',

    // Bounce (notification)
    bounce: 'animate-bounce',
};

// ==================== TRANSITION CLASSES ====================

export const transitionClasses = {
    // Base transitions
    all: 'transition-all duration-200 ease-in-out',
    colors: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',

    // Slow transitions
    allSlow: 'transition-all duration-300 ease-in-out',
    colorsSlow: 'transition-colors duration-300 ease-in-out',

    // Fast transitions
    allFast: 'transition-all duration-150 ease-in-out',
    colorsFast: 'transition-colors duration-150 ease-in-out',
};

// ==================== HOVER EFFECTS ====================

export const hoverEffects = {
    // Lift effect
    lift: 'hover:scale-105 hover:-translate-y-1 transition-transform duration-200',

    // Subtle lift
    subtleLift: 'hover:scale-102 hover:-translate-y-0.5 transition-transform duration-200',

    // Grow
    grow: 'hover:scale-110 transition-transform duration-200',

    // Shadow grow
    shadowGrow: 'hover:shadow-lg transition-shadow duration-200',

    // Brightness
    brighten: 'hover:brightness-110 transition-all duration-200',

    // Dim
    dim: 'hover:opacity-80 transition-opacity duration-200',
};
