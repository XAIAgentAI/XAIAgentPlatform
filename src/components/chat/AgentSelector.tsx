import { useTranslations } from 'next-intl';
import React, { useState, useRef, useEffect } from 'react';

interface AgentSelectorProps {
    handleAgentSelect: any;
    agent: string | null;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ handleAgentSelect, agent }) => {
    const t = useTranslations("chat");
    const [isVisible, setIsVisible] = useState(true);
    const modalRef = useRef(null);

    // 点击页面其他地方关闭模态框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !(modalRef.current as any).contains(event.target)) {
                setIsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed left-4 md:left-8 lg:left-[calc(24vw+4px)] xl:left-[calc(27vw+9px)] top-[117px] w-[300px] h-auto flex flex-col items-center justify-center bg-white dark:bg-[linear-gradient(145deg,_#1a1a1a_0%,_#0d0d0d_100%)] shadow-lg dark:shadow-xl dark:shadow-black/50" ref={modalRef} style={{zIndex:"100010"}}>
            <h3 className="text-foreground dark:text-[#f0f0f0] p-[10px] text-left font-medium">{t("selectagent")}</h3>
            <div className="flex flex-col items-center justify-center space-y-2 w-full pb-1">
                {['StyleID', 'LogoLift'].map((eachagent, index) => (
                    <button
                        key={eachagent}
                        type="button"
                        className={`relative flex flex-col w-[97%] pl-4 py-2 text-foreground dark:text-[#e0e0e0] hover:w-[97%] hover:mx-auto duration-200 
                                  hover:dark:bg-[linear-gradient(90deg,_rgba(45,45,45,0.5)_0%,_rgba(30,30,30,0.3)_100%)]
                                  ${eachagent === agent ? 'bg-[rgb(250,250,250)] dark:bg-[rgba(60,60,60,0.4)]' : ''}`}
                        onClick={() => handleAgentSelect(eachagent)}
                    >
                        <p className="w-full text-left font-medium">{eachagent}</p>
                        <svg className="absolute right-4" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="2" width="20" height="20" rx="4" className="stroke-[#dddddd] dark:stroke-[#555555]" strokeWidth="1"/>
                            <path d="M7 12L12 18L17 5" className={`${eachagent===agent ? "stroke-[#333333] dark:stroke-[#ffffff]" : ""}`} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="mt-2 mx-auto text-xs w-[90%]">
                            <p className="text-start text-foreground dark:text-[#b0b0b0]">{t(eachagent)}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AgentSelector;