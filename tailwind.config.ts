import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // From Stitch design system
        'primary': '#99f7ff',
        'primary-dim': '#00e2ee',
        'primary-fixed': '#00f1fe',
        'primary-fixed-dim': '#00e2ee',
        'primary-container': '#00f1fe',
        'on-primary': '#005f64',
        'on-primary-fixed': '#004145',
        'on-primary-fixed-variant': '#006065',
        'on-primary-container': '#00555a',

        'secondary': '#a4fa00',
        'secondary-dim': '#99eb00',
        'secondary-fixed': '#a4fa00',
        'secondary-fixed-dim': '#99eb00',
        'secondary-container': '#426900',
        'on-secondary': '#395b00',
        'on-secondary-fixed': '#2b4700',
        'on-secondary-fixed-variant': '#406600',
        'on-secondary-container': '#ebffcb',

        'tertiary': '#ffc965',
        'tertiary-dim': '#ecaa00',
        'tertiary-fixed': '#feb700',
        'tertiary-fixed-dim': '#ecaa00',
        'tertiary-container': '#feb700',
        'on-tertiary': '#5f4200',
        'on-tertiary-fixed': '#392700',
        'on-tertiary-fixed-variant': '#5f4200',
        'on-tertiary-container': '#533a00',

        'background': '#0b0e14',
        'surface': '#0b0e14',
        'surface-dim': '#0b0e14',
        'surface-bright': '#282c36',
        'surface-container-lowest': '#000000',
        'surface-container-low': '#10131a',
        'surface-container': '#161a21',
        'surface-container-high': '#1c2028',
        'surface-container-highest': '#22262f',
        'surface-tint': '#99f7ff',
        'surface-variant': '#22262f',
        'on-surface': '#ecedf6',
        'on-surface-variant': '#a9abb3',

        'inverse-surface': '#f9f9ff',
        'inverse-on-surface': '#52555c',
        'inverse-primary': '#006a70',

        'error': '#ff716c',
        'error-dim': '#d7383b',
        'error-container': '#9f0519',
        'on-error': '#490006',
        'on-error-container': '#ffa8a3',

        'outline': '#73757d',
        'outline-variant': '#45484f',

        'on-background': '#ecedf6',
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'full': '9999px',
      },
      fontFamily: {
        'headline': ['Space Grotesk', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'label': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
