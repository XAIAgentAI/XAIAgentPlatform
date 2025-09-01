import React from 'react';

// 社交媒体图标组件
export const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const TelegramIcon = () => (
  <svg viewBox="0 0 25 20" className="w-4 h-4 fill-current">
    <path d="M22.8686 0.172433C22.8686 0.172433 25.1814 -0.673005 24.9886 1.38018C24.9243 2.22561 24.3462 5.18457 23.8965 8.38514L22.3547 17.8659C22.3547 17.8659 22.2262 19.2548 21.0698 19.4965C19.9135 19.738 18.179 18.6511 17.8578 18.4094C17.6008 18.2283 13.0398 15.5109 11.4337 14.1823C10.984 13.82 10.4701 13.0953 11.4979 12.2499L18.2433 6.21119C19.0141 5.48654 19.7851 3.7957 16.573 5.84887L7.57924 11.5857C7.57924 11.5857 6.55137 12.1895 4.62416 11.6461L0.448471 10.4383C0.448471 10.4383 -1.09332 9.53252 1.54054 8.62665C7.9647 5.78842 15.8664 2.88984 22.8686 0.172433Z" />
  </svg>
);

export const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const MediumIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.43v-.065c0-.338.275-.612.61-.612h18.48c.335 0 .61.274.61.612v.065l-2.24 2.43c-.22.198-.333.49-.303.784.03.295.173.568.42.744l1.718 1.295c.27.203.44.52.44.854v.065c0 .338-.275.612-.61.612h-18.48c-.335 0-.61-.274-.61-.612v-.065c0-.334.17-.651.44-.854l1.718-1.295c.247-.176.39-.449.42-.744z"/>
    <path d="M22.307 12.5c0 .276-.224.5-.5.5H2.193c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h19.614c.276 0 .5.224.5.5z"/>
  </svg>
);

export const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

// 根据 URL 获取对应的图标
export const getSocialIcon = (url: string) => {
  if (url.includes("x.com") || url.includes("twitter.com")) {
    return <TwitterIcon />;
  }
  if (url.includes("t.me") || url.includes("telegram")) {
    return <TelegramIcon />;
  }
  if (url.includes("youtube")) {
    return <YouTubeIcon />;
  }
  if (url.includes("medium.com")) {
    return <MediumIcon />;
  }
  if (url.includes("github.com")) {
    return <GitHubIcon />;
  }
  return null;
};

// 根据 URL 获取按钮样式
export const getSocialButtonStyle = (url: string) => {
  if (url.includes("x.com") || url.includes("twitter.com")) {
    return "hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white hover:-rotate-12";
  }
  if (url.includes("t.me") || url.includes("telegram")) {
    return "hover:bg-[#229ED9]/10 hover:text-[#229ED9] hover:rotate-12";
  }
  if (url.includes("youtube")) {
    return "hover:bg-[#FF0000]/10 hover:text-[#FF0000] hover:-rotate-12";
  }
  if (url.includes("medium.com")) {
    return "hover:bg-[#00AB6C]/10 hover:text-[#00AB6C] hover:rotate-12";
  }
  if (url.includes("github.com")) {
    return "hover:bg-[#333]/10 hover:text-[#333] dark:hover:text-[#fff] hover:-rotate-12";
  }
  return "";
}; 