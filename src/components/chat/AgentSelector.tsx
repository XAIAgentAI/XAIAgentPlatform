import React from 'react';

interface AgentSelectorProps {
    handleAgentSelect: any;
    agent: string | null;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ handleAgentSelect, agent }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-slate-200 bg-opacity-50" style={{zIndex:20000}}>
            <div className="bg-stone-400 dark:bg-[#333333] w-[300px] rounded-lg shadow-lg flex flex-col mx-auto my-auto absolute" style={{zIndex:22000}}>
                <h3 className="text-white p-4 text-left">Select an Agent</h3>
                <div className="flex flex-col items-center justify-center space-y-2">
                    {['Xaiagent','StyleID','DeepLink','PicSpan'].map((eachagent,index) => (
                        <button
                            key={eachagent}
                            type="button"
                            className="relative flex flex-col w-full pl-4 py-2 text-white hover:w-[98.6%] hover:mx-auto duration-200"
                            onClick={() => handleAgentSelect(eachagent)}
                        >
                            <p className="w-full text-left">{eachagent}</p>
                            {agent === eachagent && <span className="absolute right-4 top-4">&#10004;</span>}
                            <div className="mt-2 text-xs w-full">
                              <p className="text-start text-stone-200">This is a recommended model</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentSelector;
