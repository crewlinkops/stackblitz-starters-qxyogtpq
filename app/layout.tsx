import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Crewlink | Modern Field Service Operations',
  description: 'Streamline your field service business with automated scheduling, SMS outreach, and unified calendar management on Crewlink.',
  openGraph: {
    title: 'Crewlink | Modern Field Service Operations',
    description: 'The easiest way to manage your service business.',
    url: 'https://gocrewlink.com',
    siteName: 'Crewlink',
    images: [
      {
        url: 'https://gocrewlink.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crewlink | Modern Field Service Operations',
    description: 'The easiest way to manage your service business.',
    images: ['https://gocrewlink.com/og-image.png'],
  },
};

import { ThemeProvider } from './components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
