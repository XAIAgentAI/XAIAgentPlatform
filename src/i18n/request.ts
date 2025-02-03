import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // 这通常对应于 [locale] 段
  let locale = await requestLocale;

  // 确保使用有效的语言
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // 时区配置
    timeZone: 'Asia/Shanghai'
  };
}); 