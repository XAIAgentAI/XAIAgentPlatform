import { Twitter, MessageCircle as Telegram, Youtube } from "lucide-react"
import type { ReactNode } from 'react'
import { GB, JP, KR, CN, US, VN, TH, ID } from 'country-flag-icons/react/3x2'
import { Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SocialLinksProps {
  links: string
  className?: string
}

interface RegionInfo {
  name: string
  flag?: ReactNode
}

export function SocialLinks({ links, className = "" }: SocialLinksProps) {
  const t = useTranslations('regions')
  const socialLinks = links.split(",").map(link => link.trim())

  const handleSocialClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault()
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const getSocialIcon = (url: string) => {
    if (url.includes("x.com") || url.includes("twitter.com")) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    }
    if (url.includes("t.me") || url.includes("telegram")) {
      return (
        <svg viewBox="0 0 25 20" className="w-4 h-4 fill-current">
          <path d="M22.8686 0.172433C22.8686 0.172433 25.1814 -0.673005 24.9886 1.38018C24.9243 2.22561 24.3462 5.18457 23.8965 8.38514L22.3547 17.8659C22.3547 17.8659 22.2262 19.2548 21.0698 19.4965C19.9135 19.738 18.179 18.6511 17.8578 18.4094C17.6008 18.2283 13.0398 15.5109 11.4337 14.1823C10.984 13.82 10.4701 13.0953 11.4979 12.2499L18.2433 6.21119C19.0141 5.48654 19.7851 3.7957 16.573 5.84887L7.57924 11.5857C7.57924 11.5857 6.55137 12.1895 4.62416 11.6461L0.448471 10.4383C0.448471 10.4383 -1.09332 9.53252 1.54054 8.62665C7.9647 5.78842 15.8664 2.88984 22.8686 0.172433Z" />
        </svg>
      )
    }
    if (url.includes("youtube")) {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    }
    return null
  }

  const getButtonStyle = (url: string) => {
    if (url.includes("x.com") || url.includes("twitter.com")) {
      return "hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white hover:-rotate-12"
    }
    if (url.includes("t.me") || url.includes("telegram")) {
      return "hover:bg-[#229ED9]/10 hover:text-[#229ED9] hover:rotate-12"
    }
    if (url.includes("youtube")) {
      return "hover:bg-[#FF0000]/10 hover:text-[#FF0000] hover:-rotate-12"
    }
    return ""
  }

  const getRegionInfo = (url: string): RegionInfo | null => {
    const flagClass = "w-full h-full object-cover"

    if (url.includes("Japan")) {
      return {
        name: t('japan'),
        flag: <JP className={flagClass} />
      }
    }
    if (url.includes("kGlobal")) {
      return {
        name: t('global')
      }
    }
    if (url.includes("Korea")) {
      return {
        name: t('korea'),
        flag: <KR className={flagClass} />
      }
    }
    if (url.includes("China")) {
      return {
        name: t('china'),
        flag: <CN className={flagClass} />
      }
    }
    if (url.includes("US")) {
      return {
        name: t('us'),
        flag: <US className={flagClass} />
      }
    }
    if (url.includes("Vietnam")) {
      return {
        name: t('vietnam'),
        flag: <VN className={flagClass} />
      }
    }
    if (url.includes("Thailand")) {
      return {
        name: t('thailand'),
        flag: <TH className={flagClass} />
      }
    }
    if (url.includes("Indonesia")) {
      return {
        name: t('indonesia'),
        flag: <ID className={flagClass} />
      }
    }
    return null
  }

  const groupedLinks = socialLinks.reduce((acc, link) => {
    const platform = link.includes("youtube") ? "youtube" :
                    link.includes("t.me") ? "telegram" : "twitter"
    const region = getRegionInfo(link)
    if (!acc[platform]) {
      acc[platform] = []
    }
    acc[platform].push({ link, region })
    return acc
  }, {} as Record<string, Array<{ link: string; region: RegionInfo | null }>>)

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {Object.entries(groupedLinks).map(([platform, links]) => (
        <div key={platform} className="flex items-center gap-2">
          {links.map(({ link, region }, index) => {
            const icon = getSocialIcon(link)
            if (!icon) return null

            return (
              <div key={index} className="inline-flex items-center">
                <button
                  className={`group relative w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:scale-110 ${getButtonStyle(link)}`}
                  onClick={(e) => handleSocialClick(e, link)}
                  aria-label={`Visit ${region?.name ?? 'social media'}`}
                >
                  {icon}
                  {region?.flag && (
                    <div className="absolute -bottom-1 -right-1 rounded-full overflow-hidden border-2 border-background dark:border-background w-4 h-4 shadow-sm">
                      {region.flag}
                    </div>
                  )}
                  <span className="sr-only">{region?.name}</span>
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
} 