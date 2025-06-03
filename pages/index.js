import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <>
      <Head>
        <title>Redirecting to Dashboard</title>
        <meta name="description" content="Redirecting to AI agent dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`${geistSans.variable} ${geistMono.variable}`}>
        <p>Redirecting to dashboard...</p>
      </div>
    </>
  );
}