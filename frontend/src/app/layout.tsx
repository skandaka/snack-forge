// src/app/layout.tsx
import './globals.css'
import React from 'react'
import Header from '../components/layout/Header'
import './globals.css';


export const metadata = {
    title: 'SnackSmith',
    description: 'Design your custom snack with AI nutrition coach',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className="bg-white text-gray-900 font-sans">
        <Header/>
        <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
        </main>
        </body>
        </html>
    )
}


