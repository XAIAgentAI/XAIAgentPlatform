// app/layout.tsx
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {headers} from 'next/headers';
import {routing} from '@/i18n/routing';
import ContextProvider from '../../../context';
import { Toaster } from '@/components/Toaster';
import Navbar from '@/components/Navbar';
import './globals.css';
import './fonts.css';

// 生成静态参数
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // 确保传入的 locale 是有效的
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // 启用静态渲染
  setRequestLocale(locale);

  // 获取所有消息
  const messages = await getMessages();

  // 获取 cookies
  const cookies = headers().get('cookie');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ContextProvider cookies={cookies}>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <div className="flex-1">{children}</div>
            </div>
            <Toaster />
          </ContextProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}