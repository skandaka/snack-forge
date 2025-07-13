import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata = {
    title: 'SnackSmith - AI-Powered 3D Snack Designer',
    description: 'Design custom healthy snacks in 3D with real-time nutrition analysis and AI coaching',
    keywords: 'snack design, nutrition, 3D modeling, healthy eating, AI coach',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
        <body className="font-inter antialiased">
        {children}
        </body>
        </html>
    );
}