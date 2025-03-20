import React from 'react';

interface AgentSelectorProps {
    handleAgentSelect: (agent:string) => void
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ handleAgentSelect }) => {
    return (
        <div className="fixed top-[114px] left-[2.24vw] md:left-[1.4vw] lg:left-[21.98vw] xl:left-[25.9vw] w-[120px] bg-stone-200 dark:bg-zinc-800 rounded-b-lg shadow-lg z-100">
            <button
                type="button"
                className="relative z-100 flex items-center w-full pl-[13px] py-2 text-white dark:text-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-500 hover:text-white"
                onClick={() => handleAgentSelect('Scholar GPT')}
            >
                <p>Scholar GPT</p>
            </button>
            <button
                type="button"
                className="relative z-100 flex items-center w-full pl-[13px] py-2 text-white dark:text-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-500 hover:text-white"
                onClick={() => handleAgentSelect('DeepSeek V3')}
            >
                <p>DeepSeek V3</p>
            </button>
            <button
                type="button"
                className="relative z-100 flex items-center w-full pl-[13px] py-2 text-white dark:text-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-500 hover:text-white"
                onClick={() => handleAgentSelect('DeepSeek R1')}
            >
               <p>DeepSeek R1</p>
            </button>
            <button
                type="button"
                className="relative z-100 flex items-center w-full pl-[13px] py-2 text-white dark:text-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-500 hover:text-white"
                onClick={() => handleAgentSelect('Chatgpt o4')}
            >
               <p>Chatgpt o4</p>
            </button>
        </div>
    );
};

export default AgentSelector;
