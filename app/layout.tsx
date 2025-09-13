import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from 'sonner'
import Script from 'next/script'
import './globals.css'
import { NotificationInitializer } from '@/components/notification-initializer'

const baseUrl = process.env.NEXTAUTH_URL || 'https://fitness.archer.software'

export const metadata: Metadata = {
  title: 'Archer Fitness | AI Workout Dashboard',
  description:
    'AI-powered fitness app by Antonio Archer, a software developer from Philadelphia. Track workouts, nutrition, and progress with intelligent insights.',
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'Archer Fitness | AI Workout Dashboard',
    description:
      'AI-powered fitness app by Antonio Archer, a software developer from Philadelphia. Track workouts, nutrition, and progress with intelligent insights.',
    url: baseUrl,
    siteName: 'Archer Fitness',
    images: [
      {
        url: '/logo.webp',
        width: 1200,
        height: 630,
        alt: 'Archer Fitness logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Archer Fitness | AI Workout Dashboard',
    description:
      'AI-powered fitness app by Antonio Archer, a software developer from Philadelphia. Track workouts, nutrition, and progress with intelligent insights.',
    images: ['/logo.webp'],
    creator: '@ad_archer_',
  },
  keywords: [
    'Antonio Archer',
    'Archer Fitness',
    'AI Workout',
    'Fitness App',
    'Workout Tracker',
    'Nutrition Tracker',
    'Philadelphia',
    'Software Developer',
    'DevOps Engineer',
  ],
  authors: [{ name: 'Antonio Archer' }],
  creator: 'Antonio Archer',
  publisher: 'Antonio Archer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Archer Fitness',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Site-level structured data */}
        <Script
          id="website-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Archer Fitness',
              url: baseUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.google.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
              sameAs: [
                'https://github.com/ad-archer',
                'https://www.linkedin.com/in/antonio-archer',
                'https://twitter.com/ad_archer_',
                'https://www.youtube.com/@ad-archer',
                'https://www.instagram.com/Antonio_DArcher',
              ],
            }),
          }}
        />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Antonio Archer',
              url: 'https://www.antonioarcher.com',
              image: `${baseUrl}/logo.webp`,
              jobTitle: 'Software Developer & DevOps Engineer',
              worksFor: {
                '@type': 'Organization',
                name: 'Self-employed',
              },
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Philadelphia',
                addressRegion: 'PA',
                addressCountry: 'US',
              },
              sameAs: [
                'https://github.com/ad-archer',
                'https://www.linkedin.com/in/antonio-archer',
                'https://twitter.com/ad_archer_',
                'https://www.linktr.ee/adarcher',
                'https://www.adarcher.app',
                'https://www.youtube.com/@ad-archer',
                'https://www.instagram.com/Antonio_DArcher',
              ],
            }),
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/android-chrome-512x512.png" sizes="512x512" type="image/png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Archer Fitness" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <NotificationInitializer />
          {children}
          <Toaster />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}

        {/* Service Worker Registration */}
        <Script
          id="sw-registration"
          strategy="afterInteractive"
        >
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('Service Worker registered with scope:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('Service Worker registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
