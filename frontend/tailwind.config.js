/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#FF385C', // Airbnb-ish red
                secondary: '#00A699',
                dark: '#222222',
                light: '#F7F7F7'
            }
        },
    },
    plugins: [],
}
