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
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { TokenBalance } from "./ui-custom/token-balance"
import { useDisconnect } from 'wagmi';

const Navbar = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)

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
    // {
    //   id: "creating",
    //   href: "/create-guide",
    //   label: t('navigation.creating'),
    //   comingSoon: false
    // },
    {
      id: "model",
      href: "/create",
      label: t('navigation.model'),
      comingSoon: false
    },
    {
      id: "about",
      href: "https://xaiagent.io/",
      label: t('navigation.about'),
      isExternal: true
    }
  ];

  // 处理客户端挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 监听 URL 参数变化，自动同步搜索关键词到输入框
  useEffect(() => {
    const keyword = searchParams.get('searchKeyword') || '';
    setSearchKeyword(keyword);
  }, [searchParams]);

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

  // 处理搜索功能
  const handleSearch = async (keyword: string) => {
    setIsSearching(true);
    try {
      // 跳转到首页并传递搜索参数，保持当前的排序参数
      const currentParams = new URLSearchParams(window.location.search);
      
      if (keyword.trim()) {
        // 有搜索关键词时，设置搜索参数
        currentParams.set('searchKeyword', keyword.trim());
      } else {
        // 没有搜索关键词时，删除搜索参数，显示全部结果
        currentParams.delete('searchKeyword');
      }
      
      router.push(`/${locale}?${currentParams.toString()}`);
      
      // 关闭搜索框，但不清空搜索关键词
      setIsSearchExpanded(false);
    } catch (error) {
      console.error('搜索失败:', error);
      toast({
        description: t('common.searchFailed'),
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 处理搜索框回车事件
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchKeyword);
    }
  };

  // 处理搜索框输入变化
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  // 处理清除搜索
  const handleClearSearch = () => {
    setSearchKeyword('');
    // 跳转到没有搜索关键词的 URL
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('searchKeyword');
    router.push(`/${locale}?${currentParams.toString()}`);
    // 自动收起搜索框
    setIsSearchExpanded(false);
  };

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
    // 精确匹配路径，避免 /create 匹配到 /create-guide
    const currentPath = pathname?.replace(`/${locale}`, '') || '';
    if (href === currentPath) {
      return true;
    }
    // 对于子路径，确保是完整的路径段匹配
    return currentPath.startsWith(href + '/');
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
              link.isExternal ? (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "text-text-primary text-xs font-normal font-['Sora'] leading-7 whitespace-nowrap",
                    "transition-colors hover:text-primary",
                    "relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary",
                    "after:w-0 hover:after:w-full after:transition-all"
                  )}
                >
                  {link.label}
                </a>
              ) : (
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
              )
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
                type="text"
                placeholder={t('common.search')}
                value={searchKeyword}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                className={cn(
                  "w-[250px] pl-[15px] pr-[70px] py-2.5 bg-transparent",
                  "border-text-primary/30 rounded-[100px]",
                  "text-text-primary text-xs font-normal font-['Sora'] leading-10",
                  "placeholder:text-text-secondary focus-visible:ring-0",
                  "transition-all duration-300",
                  "focus:border-primary focus:ring-1 focus:ring-primary/30"
                )}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {searchKeyword && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                    aria-label={t('accessibility.clearSearch')}
                  >
                    <X className="w-3 h-3 text-text-secondary" />
                  </button>
                )}
                <button
                  onClick={() => handleSearch(searchKeyword)}
                  disabled={isSearching}
                  className="p-1 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
                  aria-label={t('accessibility.searchIcon')}
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              </div>
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
                        type="text"
                        placeholder={t('common.search')}
                        value={searchKeyword}
                        onChange={handleSearchInputChange}
                        onKeyPress={handleSearchKeyPress}
                        onBlur={() => {
                          setTimeout(() => setIsSearchExpanded(false), 100);
                        }}
                        className={cn(
                          "w-full pl-4 pr-[70px] py-2.5 bg-transparent",
                          "border-none rounded-[100px]",
                          "text-text-primary text-sm font-normal font-['Sora']",
                          "placeholder:text-text-secondary focus-visible:ring-0",
                          "transition-all duration-300"
                        )}
                        autoFocus
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        {searchKeyword && (
                          <button
                            onClick={handleClearSearch}
                            className="p-1.5 hover:bg-primary/10 rounded-full transition-colors"
                            aria-label={t('accessibility.clearSearch')}
                          >
                            <X className="w-3 h-3 text-text-secondary" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleSearch(searchKeyword);
                            setIsSearchExpanded(false); // 搜索后自动收起
                          }}
                          disabled={isSearching}
                          className="p-1.5 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
                          aria-label={t('accessibility.searchIcon')}
                        >
                          {isSearching ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
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
                  link.isExternal ? (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "w-full block text-center",
                        "text-text-primary text-base lg:text-sm font-normal font-['Sora']",
                        "hover:text-primary"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ) : (
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
                  )
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