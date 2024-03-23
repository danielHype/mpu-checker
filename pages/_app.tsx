import { AuthProvider } from '@/context/AuthContext';
import '@/styles/base.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    
    <AuthProvider>
      <main className={inter.variable}>
        <Component {...pageProps} />
      </main>
      </AuthProvider>
    
  );
}

export default MyApp;
