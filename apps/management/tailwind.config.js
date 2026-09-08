/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    navy: '#0d1b2a',
                    dark: '#08121e',
                    card: '#112233',
                    border: '#1e3a5f',
                    gold: '#f59e0b',
                }
            }
        },
    },
    plugins: [],
}