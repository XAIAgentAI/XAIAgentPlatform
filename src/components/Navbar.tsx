'use client';

import { CustomButton as Button } from "@/components/ui-custom/custom-button"
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Search, Menu, X, Wallet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ThemeToggle from "./ThemeToggle"
import LanguageSwitcher from "./LanguageSwitcher"
import { useState, useEffect } from "react"
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from "next/navigation";
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { TokenBalance } from "./ui-custom/token-balance"
import { useDisconnect } from 'wagmi';


const Navbar = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const { disconnect } = useDisconnect();

  const t = useTranslations();
  const { toast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { open } = useAppKit()
  const { address, isConnected, status } = useAppKitAccount()
  const { isAuthenticated, isLoading, error, authenticate } = useAuth()
  const router = useRouter()
  const [connectingTimeout, setConnectingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isManualConnecting, setIsManualConnecting] = useState(false);

  const navigationLinks = [
    {
      id: "trading",
      href: "/",
      label: t('navigation.trading')
    },
    {
      id: "explore",
      href: "/agents",
      label: t('navigation.explore')
    },
    {
      id: "creating",
      href: "/create",
      label: t('navigation.creating'),
      comingSoon: false
    },
    {
      id: "model",
      href: "/chat/create",
      label: t('navigation.model'),
      comingSoon: false
    }
  ];

  // 处理客户端挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [])

  useEffect(() => {
    if (error) {
      toast({
        description: error,
      })
    }
  }, [error, toast])

  // 添加连接超时处理
  useEffect(() => {
    if (status === 'connecting' && !isTimeout && isManualConnecting) {
      // 如果连接时间超过8秒，强制重置状态
      const timeout = setTimeout(() => {
        if (status === 'connecting') {
          setIsTimeout(true);
          setIsManualConnecting(false);
          toast({
            description: t('wallet.connectionTimeout'),
            variant: "destructive"
          });
          // 断开连接
          disconnect();
        }
      }, 8000);

      setConnectingTimeout(timeout);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }

    // 当状态不是connecting时，重置状态
    if (status !== 'connecting') {
      setIsTimeout(false);
      setIsManualConnecting(false);
    }
  }, [status, disconnect, t, toast, isTimeout, isManualConnecting]);

  // 优化钱包连接状态处理
  useEffect(() => {
    // 只要有地址就认为已连接
    if (address) {
      if (connectingTimeout) {
        clearTimeout(connectingTimeout);
        setConnectingTimeout(null);
      }
      setIsTimeout(false);
      setIsManualConnecting(false);
      authenticate();
    }
  }, [address, connectingTimeout, authenticate]);

  const handleWalletClick = () => {
    // 使用 address 判断是否已连接
    if (address) {
      open({ view: 'Account' });
    } else {
      // 如果当前状态是connecting，先重置状态
      if (status === 'connecting') {
        if (connectingTimeout) {
          clearTimeout(connectingTimeout);
          setConnectingTimeout(null);
        }
        setIsTimeout(false);
      }
      setIsManualConnecting(true);
      open({ view: 'Connect' });
    }
    setIsMenuOpen(false);
  }

  const handleBuyDBC = () => {
    router.push(`/${locale}/buy-dbc`)
    setIsMenuOpen(false)
  }

  const handleBuyXAA = () => {
    router.push(`/${locale}/agent-detail/1`)
    setIsMenuOpen(false)
  }

  const handleComingSoonClick = (e: React.MouseEvent, isComingSoon?: boolean) => {
    if (isComingSoon) {
      e.preventDefault();
      toast({
        description: t('messages.comingSoon'),
      })
    }
    setIsMenuOpen(false)
  }

  // 检查链接是否为当前页面
  const isCurrentPath = (href: string) => {
    if (href === '/') {
      return pathname === `/${locale}`;
    }
    return pathname?.startsWith(`/${locale}${href}`);
  };

  // 在UI中显示钱包状态
  const getWalletDisplayStatus = () => {
    if (!mounted) return t('wallet.connect');

    if (status === 'connecting' && !isTimeout && isManualConnecting) {
      return t('wallet.connecting');
    }
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return t('wallet.connect');
  };


  return (
    <nav className="sticky top-0 left-0 right-0 w-full bg-background z-50">
      <div className="w-full  lg:h-18 h-16 flex items-center justify-between relative px-8">
        {/* Logo and Navigation Links */}
        <div className="flex items-center justify-start pr-5 gap-8">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt={t('accessibility.logo')}
              width={50}
              height={50}
              className="w-[50px] h-[50px] object-cover flex-shrink-0"
              priority
              unoptimized
            />
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={cn(
                  "text-text-primary text-xs font-normal font-['Sora'] leading-7 whitespace-nowrap",
                  "transition-colors hover:text-primary",
                  "relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary",
                  isCurrentPath(link.href)
                    ? "text-primary after:w-full"
                    : "after:w-0 hover:after:w-full after:transition-all",
                )}
                onClick={(e) => handleComingSoonClick(e, link.comingSoon)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu Button and Theme Toggle */}
        <div className="flex items-center gap-4 lg:gap-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? t('buttons.closeMenu') : t('buttons.toggleMenu')}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleWalletClick}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary"
            aria-label={t('accessibility.walletIcon')}
          >
            {mounted ? (
              status === 'connecting' && !isTimeout && isManualConnecting ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : isConnected ? (
                <div className="relative">
                  <Wallet className="w-5 h-5" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />
                </div>
              ) : (
                <Wallet className="w-5 h-5" />
              )
            ) : (
              <Wallet className="w-5 h-5" />
            )}
          </motion.button>

          <ThemeToggle className="lg:hidden" />
          <div className="lg:hidden">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4 justify-end min-w-0 flex-1">
          {/* 搜索框容器 */}
          <div className="relative">
            {/* 默认搜索框 - 在宽屏幕显示 */}
            <div className={cn(
              "relative transition-all duration-300",
              "hidden xl:block"
            )}>
              <Input
                type="search"
                placeholder={t('common.search')}
                className={cn(
                  "w-[250px] pl-[15px] pr-[30px] py-2.5 bg-transparent",
                  "border-text-primary/30 rounded-[100px]",
                  "text-text-primary text-xs font-normal font-['Sora'] leading-10",
                  "placeholder:text-text-secondary focus-visible:ring-0",
                  "transition-all duration-300",
                  "focus:border-primary focus:ring-1 focus:ring-primary/30"
                )}
              />
              <Search
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary"
                aria-label={t('accessibility.searchIcon')}
              />
            </div>

            {/* 搜索图标和展开搜索框 */}
            <div className="xl:hidden">
              <AnimatePresence mode="wait">
                {!isSearchExpanded ? (
                  <motion.button
                    key="search-icon"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSearchExpanded(true)}
                    className={cn(
                      "flex items-center justify-center w-10 h-10",
                      "rounded-full hover:bg-primary/10 transition-colors",
                      "text-text-primary"
                    )}
                    aria-label={t('accessibility.searchIcon')}
                  >
                    <Search className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="search-input"
                    initial={{ width: 40, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 40, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="relative"
                  >
                    <div className="relative flex items-center bg-background rounded-[100px] border border-border-color">
                      <Input
                        type="search"
                        placeholder={t('common.search')}
                        className={cn(
                          "w-full pl-4 pr-[70px] py-2.5 bg-transparent",
                          "border-none rounded-[100px]",
                          "text-text-primary text-sm font-normal font-['Sora']",
                          "placeholder:text-text-secondary focus-visible:ring-0",
                          "transition-all duration-300"
                        )}
                        autoFocus
                      />
                      <div className="absolute right-2 flex items-center gap-2">
                        <Search className="w-4 h-4 text-text-secondary" />
                        <button
                          onClick={() => setIsSearchExpanded(false)}
                          className="p-1.5 hover:bg-primary/10 rounded-full transition-colors"
                          aria-label={t('accessibility.closeSearch')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <GradientBorderButton onClick={handleBuyDBC}>
              {t('buttons.buyDBC')}
            </GradientBorderButton>

            <GradientBorderButton onClick={handleBuyXAA}>
              {t('buttons.buyXAA')}
            </GradientBorderButton>

            <Button
              className="h-[38.50px]"
              onClick={handleWalletClick}
              disabled={mounted && status === 'connecting' && isManualConnecting === true}
            >
              {getWalletDisplayStatus()}
            </Button>

            <div className="flex gap-0.5">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-[62px] lg:top-[80px] left-0 right-0 bg-background border-b border-border-color shadow-lg"
            >
              <div className="container mx-auto p-4 space-y-4 flex flex-col items-center">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={cn(
                      "w-full block text-center",
                      "text-text-primary text-base lg:text-sm font-normal font-['Sora']",
                      isCurrentPath(link.href) && "text-primary"
                    )}
                    onClick={(e) => handleComingSoonClick(e, link.comingSoon)}
                  >
                    {link.label}
                  </Link>
                ))}

                <GradientBorderButton
                  containerClassName="w-full max-w-[220px]"
                  onClick={handleBuyDBC}
                >
                  {t('buttons.buyDBC')}
                </GradientBorderButton>

                <GradientBorderButton
                  containerClassName="w-full max-w-[220px]"
                  onClick={handleBuyXAA}
                >
                  {t('buttons.buyXAA')}
                </GradientBorderButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      <div className=" mt-[-6px] px-8 pb-1">
        <TokenBalance />
      </div>
    </nav>
  );
}

export default Navbar; 