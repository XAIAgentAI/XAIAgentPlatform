import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // 支持的语言列表
  locales: ['en', 'ja', 'ko'],

  // 默认语言
  defaultLocale: 'en'
});

// 创建导航 API 的轻量级包装器
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing); 