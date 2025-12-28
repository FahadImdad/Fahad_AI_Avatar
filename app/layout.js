import './globals.css'

export const metadata = {
    title: 'Fahad AI Avatar',
    description: 'Interactive AI Avatar with voice and conversation',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>{children}</body>
        </html>
    )
}
