import React from 'react';

interface AgentSelectorProps {
    handleAgentSelect: (agent:string) => void
}

const AgentSelector: React.FC<AgentSelectorProps> = ({ handleAgentSelect }) => {
    return (
        <div className="min-w-[135px] fixed top-[100px] left-[2.84vw] md:left-[3.6vw] lg:left-[20.6vw] xl:left-[26.2vw] w-[26vw] max-w-[150px] bg-zinc-800 rounded-b-lg shadow-lg">
            <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                onClick={() => handleAgentSelect('Scholar GPT')}
            >
                Scholar GPT
            </button>
            <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                onClick={() => handleAgentSelect('DeepSeek V3')}
            >
                DeepSeek V3
            </button>
            <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                onClick={() => handleAgentSelect('DeepSeek R1')}
            >
                DeepSeek R1
            </button>
            <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-2 text-zinc-700 hover:bg-zinc-700 hover:text-white"
                onClick={() => handleAgentSelect('Chatgpt o4')}
            >
                Chatgpt o4
            </button>
        </div>
    );
};

export default AgentSelector;
