import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://erp.sukuux.com'),
  title: {
    default: 'Sukuu ERP — Institutional Operating System for African Schools',
    template: '%s · Sukuu ERP',
  },
  description: 'Sukuu ERP is the institutional operating system built for African schools — managing students, staff, academics, finance, and operations in one platform by Ayivi Solutions Limited.',
  applicationName: 'Sukuu ERP',
  keywords: ['Sukuu', 'Sukuu ERP', 'school management system', 'African schools', 'student information system', 'Ghana education software', 'Ayivi Solutions'],
  authors: [{ name: 'Ayivi Solutions Limited' }],
  creator: 'Ayivi Solutions Limited',
  publisher: 'Ayivi Solutions Limited',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
    shortcut: '/icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://erp.sukuux.com',
    siteName: 'Sukuu ERP',
    title: 'Sukuu ERP — Institutional Operating System for African Schools',
    description: 'Manage students, staff, academics, finance, and operations in one platform built for African schools.',
    images: [{ url: '/sukuu-icon.png', width: 512, height: 512, alt: 'Sukuu ERP' }],
  },
  twitter: {
    card: 'summary',
    title: 'Sukuu ERP — Institutional Operating System for African Schools',
    description: 'Manage students, staff, academics, finance, and operations in one platform built for African schools.',
    images: ['/sukuu-icon.png'],
  },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: '#040D34',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Cormorant+Garamond:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
