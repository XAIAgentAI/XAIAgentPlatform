import { useTranslations } from 'next-intl';
import React from 'react';

interface AgentSelectorProps {
    handleAgentSelect: any;
    agent: string | null;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ handleAgentSelect, agent }) => {
    const checkmarkColor = "#4CAF50"; // 这里定义勾号的颜色
    const t = useTranslations("chat");

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-slate-200 bg-opacity-50" style={{zIndex:20000}}>
            <div className="bg-stone-300 dark:bg-[#3e3e3e] w-[300px] rounded-lg shadow-lg flex flex-col mx-auto my-auto absolute" style={{zIndex:22000}}>
                <h3 className="text-foreground p-4 text-left">{t("selectagent")}</h3>
                <div className="flex flex-col items-center justify-center space-y-2">
                    {['Xaiagent','StyleID','LogoLift','PicSpan'].map((eachagent, index) => (
                        <button
                            key={eachagent}
                            type="button"
                            className="relative flex flex-col w-full pl-4 py-2 text-foreground hover:w-[98.6%] hover:mx-auto duration-200"
                            onClick={() => handleAgentSelect(eachagent)}
                        >
                            <p className="w-full text-left">{eachagent}</p>
                            <svg className="absolute right-4" width="24" height="24" viewBox="0 0 24 24" fill="#eeeeee" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="2" width="20" height="20" rx="4" stroke="#dddddd" strokeWidth="1"/>
                                <path d="M7 12L12 18L17 5" stroke={eachagent==agent?"#333333":"#eeeeee"} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="mt-2 mx-auto text-xs w-[90%] hover:w-[88%]">
                                <p className="text-start text-foreground">{t(eachagent)}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentSelector;