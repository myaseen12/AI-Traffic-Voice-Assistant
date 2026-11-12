/**
 * AI Traffic Voice Assistant - Design System Tokens
 * Standardized 8pt Grid, WCAG AAA Accessibility, Civic Engineering Standard
 */

export const tokens = {
  colors: {
    brand: {
      deepNavy: '#061D38',       // Header, footer, dark hero canvas
      darkNavy: '#092B50',       // Dark surface elevation, borders, dark card bg
      navySurface: '#0D3866',    // Interactive surface in dark mode
      royalBlue: '#0875DF',      // Primary brand accent, primary CTA, active navigation
      brightBlue: '#1685F5',     // Hover states, active links, primary focal elements
      lightBlue: '#DCEBFF',      // Informational badges, security panels, tinted surfaces
      cyanElectric: '#00F0FF',   // Voice soundwaves, mic pulse indicator, high-vis frequency
      cyanMuted: '#06B6D4',      // Secondary voice metrics, subtle frequency lines
      cyanSurface: '#E0F7FA',    // Light voice container tint
    },
    neutral: {
      white: '#FFFFFF',
      background: '#F7F9FC',     // Main civic portal background
      surface: '#FFFFFF',        // Card and container background
      surfaceMuted: '#F1F5F9',   // Table header, input inactive background
      borderSubtle: '#E2E8F0',   // Card & component outlines
      borderStrong: '#CBD5E1',   // Input field borders
      textPrimary: '#10233F',    // High-contrast primary copy
      textSecondary: '#334155',  // Supporting descriptions
      textMuted: '#64748B',      // Metadata, labels, timestamps
      textDisabled: '#94A3B8',   // Disabled controls
    },
    semantic: {
      success: {
        base: '#0D8A4E',
        surface: '#ECFDF3',
        border: '#A6F4C5',
        text: '#05603A',
      },
      warning: {
        base: '#D97706',
        surface: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
      },
      error: {
        base: '#D92D20',
        surface: '#FEF3F2',
        border: '#FECDCA',
        text: '#912018',
      },
      info: {
        base: '#0875DF',
        surface: '#EFF8FF',
        border: '#B2DDFF',
        text: '#175CD3',
      },
    },
    status: {
      pending: { bg: '#FEF3F2', text: '#B42318', border: '#FECDCA' },
      paid: { bg: '#ECFDF3', text: '#027A48', border: '#A6F4C5' },
      disputed: { bg: '#FFF8E6', text: '#B54708', border: '#FEDF89' },
      cancelled: { bg: '#F1F5F9', text: '#475467', border: '#D0D5DD' },
    }
  },

  typography: {
    fontFamilies: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
      nastaliq: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif",
    },
    fontSizes: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],       // 14px
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],    // 36px
      '5xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }],         // 48px
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    }
  },

  spacing: {
    px: '1px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  radii: {
    none: '0px',
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',  // Pill
  },

  shadows: {
    subtle: '0 1px 3px rgba(6, 29, 56, 0.04), 0 1px 2px rgba(6, 29, 56, 0.02)',
    card: '0 2px 10px rgba(6, 29, 56, 0.04), 0 1px 3px rgba(6, 29, 56, 0.02)',
    cardHover: '0 10px 25px -5px rgba(6, 29, 56, 0.08), 0 8px 10px -6px rgba(6, 29, 56, 0.04)',
    modal: '0 20px 25px -5px rgba(6, 29, 56, 0.15), 0 8px 10px -6px rgba(6, 29, 56, 0.08)',
    glowCyan: '0 0 20px rgba(0, 240, 255, 0.35)',
    glowBlue: '0 0 25px rgba(8, 117, 223, 0.25)',
  },

  layout: {
    containerMaxWidth: '1280px',
    heroMaxWidth: '1440px',
    contentMaxWidth: '960px',
    modalMaxWidth: '480px',
    sidebarWidth: '260px',
    headerHeight: '72px',
  },

  zIndex: {
    base: 0,
    card: 1,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    toast: 1500,
    tooltip: 1600,
  }
};
