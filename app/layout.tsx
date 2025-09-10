import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from 'sonner'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Archer Fitness | AI Workout Dashboard',
  description:
    'AI-powered fitness app by Antonio Archer, a software developer from Philadelphia. Track workouts, nutrition, and progress with intelligent insights.',
  metadataBase: new URL('https://fitness.adarcher.app'),
  alternates: {
    canonical: 'https://fitness.adarcher.app',
  },
  openGraph: {
    title: 'Archer Fitness | AI Workout Dashboard',
    description:
      'AI-powered fitness app by Antonio Archer, a software developer from Philadelphia. Track workouts, nutrition, and progress with intelligent insights.',
    url: 'https://fitness.adarcher.app',
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Archer Fitness',
  },
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
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
              url: 'https://fitness.adarcher.app',
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
              image: 'https://fitness.adarcher.app/logo.webp',
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
        <link rel="icon" href="/logo.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/logo.webp" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Archer Fitness" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
