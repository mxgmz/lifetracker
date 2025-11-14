import './globals.css'

export const metadata = {
  title: 'Life Tracker MVP',
  description: 'Track your daily habits and life',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

