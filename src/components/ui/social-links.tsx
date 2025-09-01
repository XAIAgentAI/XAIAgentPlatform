import { Twitter, MessageCircle as Telegram, Youtube } from "lucide-react"
import type { ReactNode } from 'react'
import { GB, JP, KR, CN, US, VN, TH, ID } from 'country-flag-icons/react/3x2'
import { Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getSocialIcon, getSocialButtonStyle } from './social-icons'

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
                  className={`group relative w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:scale-110 ${getSocialButtonStyle(link)}`}
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