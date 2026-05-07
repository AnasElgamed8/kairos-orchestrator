/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-color': 'var(--bg-color)',
        'text-color': 'var(--text-color)',
        'primary-color': 'var(--primary-color)',
        'secondary-color': 'var(--secondary-color)',
        'accent-color': 'var(--accent-color)',
        'danger-color': 'var(--danger-color)',
        'success-color': 'var(--success-color)',
        'surface-color': 'var(--surface-color)',
        'border-color': 'var(--border-color)',
        'glass-bg': 'var(--glass-bg)',
      },
    },
  },
  plugins: [],
}
