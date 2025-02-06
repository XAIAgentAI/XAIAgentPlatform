import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

const languages = {
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  zh: '中文'
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // router.replace(pathname, { locale: newLocale });
    window.location.href = `/${newLocale}${pathname}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border">
        {Object.entries(languages).map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleLocaleChange(key)}
            className={`cursor-pointer transition-colors
              ${locale === key 
                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 