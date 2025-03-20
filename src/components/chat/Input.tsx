'use client'
import React, { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface InputComponentProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setUserStatus: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  userName: string | null;
  handleSubmit: (e: React.FormEvent) => any;
  conversations: any;
  setIsNew: any;
  agentId: any;
}


const InputComponent: React.FC<InputComponentProps> = ({ agentId, setIsNew, conversations, userName, setUserStatus, input, setInput, isLoading, handleSubmit }) => {
  // 确定发送按钮是否可点击
  const isSubmitEnabled = !isLoading && input.trim() !== '';

  const handleSendClick = (e: React.FormEvent) => {
    if (!userName) {
      setUserStatus(false);
      const timer = setTimeout(() => {
        setUserStatus(true);
      }, 1000);
      e.preventDefault(); // 阻止表单提交
      return;
    }
    if(conversations[agentId]?.length > 0){
      setIsNew("yes");
    }
    handleSubmit(e);
  };

  const locale = useLocale();
  const t = useTranslations("chat");

  return (
    <div className="fixed bottom-[2px] md:bottom-[40px] w-[97vw] lg:w-[78vw] mx-auto md:right-[0.38vw] lg:right-[0.48vw]">
      <div className="max-w-3xl px-4 py-4 w-full lg:w-[80%] mx-auto rounded-2xl">
        <form onSubmit={handleSubmit} className="w-full relative">
          <div className="w-full relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("inputHolder")}
              className="w-full rounded-full bg-stone-200 dark:bg-zinc-800 px-[18px] py-2 pb-[-0.6px] placeholder:text-white focus:outline-none border-none text-white focus:caret-white pr-10"
              disabled={isLoading} // 禁用输入框仅当isLoading为true
            />
            {/* 发送按钮 */}
            <button
              type="submit"
              onClick={handleSendClick}
              disabled={!isSubmitEnabled}
              className={`absolute top-1/2 right-[4px] transform -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-white bg-opacity-30 dark:bg-opacity-10 ${
                isSubmitEnabled ? 'bg-opacity-90 dark:bg-opacity-30' : ''
              }`}
            >
              <img
                src="/images/vector.png"
                alt="Send"
                className={`w-4 h-4 mx-auto`}
              />
            </button>
          </div>
        </form>
        <div className="mt-2 text-center text-stone-500 dark:text-neutral-700 text-xs">{t("inputInfo")}</div>
      </div>
    </div>
  );
};

export default InputComponent;
