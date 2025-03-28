import React from 'react';

interface AgentSelectorProps {
    handleAgentSelect: any;
    agent: string | null;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ handleAgentSelect, agent }) => {
    const checkmarkColor = "#4CAF50"; // 这里定义勾号的颜色

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-slate-200 bg-opacity-50" style={{zIndex:20000}}>
            <div className="bg-stone-400 dark:bg-[#333333] w-[300px] rounded-lg shadow-lg flex flex-col mx-auto my-auto absolute" style={{zIndex:22000}}>
                <h3 className="text-white p-4 text-left">选择一个代理</h3>
                <div className="flex flex-col items-center justify-center space-y-2">
                    {['Xaiagent','StyleID','LogoLift','PicSpan'].map((eachagent, index) => (
                        <button
                            key={eachagent}
                            type="button"
                            className="relative flex flex-col w-full pl-4 py-2 text-white hover:w-[98.6%] hover:mx-auto duration-200"
                            onClick={() => handleAgentSelect(eachagent)}
                        >
                            <p className="w-full text-left">{eachagent}</p>
                            <svg className="absolute right-4 top-5" width="24" height="24" viewBox="0 0 24 24" fill="#bbbbbb" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="2" width="20" height="20" rx="4" stroke="#777777" strokeWidth="2"/>
                                <path d="M8 11L12 17L17 5" stroke={eachagent==agent?"#777777":"#bbbbbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <div className="mt-2 text-xs w-full">
                                <p className="text-start text-stone-200">这是一个推荐的模型</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentSelector;
