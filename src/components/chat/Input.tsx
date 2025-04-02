'use client'
import React, { useEffect, useState } from 'react';
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
  prompt: any;
}

const InputComponent: React.FC<InputComponentProps> = ({ prompt, setIsNew, conversations, userName, setUserStatus, input, setInput, isLoading, handleSubmit }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && prompt) {
      setInput(prompt);
      setIsInitialized(true);
    }
  }, [prompt, setInput, isInitialized]);

  // 确定发送按钮是否可点击
  const isSubmitEnabled = !isLoading && input !== null && input.trim() !== '';

  const handleSendClick = (e: React.FormEvent) => {
    if (!userName) {
      setUserStatus(false);
      const timer = setTimeout(() => {
        setUserStatus(true);
      }, 1000);
      e.preventDefault(); // 阻止表单提交
      return;
    }
    if(conversations["1"]?.length > 0){
      setIsNew("yes");
    }
    handleSubmit(e);
  };

  const locale = useLocale();
  const t = useTranslations("chat");

  return (
    <div className="fixed bottom-0 md:bottom-[23px] w-[97vw] lg:w-[78vw] mx-auto md:right-[0.38vw] lg:right-[0.48vw] bg-background bg-opacity-0" style={{zIndex:10000}}>
      <div className="max-w-3xl px-4 py-4 w-full lg:w-[80%] mx-auto rounded-2xl">
        <form onSubmit={handleSubmit} className="w-full relative">
          <div className="w-full relative">
            <input
              type="text"
              value={input || ''}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("inputHolder")}
              className="w-full rounded-full bg-stone-200 dark:bg-zinc-800 px-[18px] py-[10px] pb-[10.5px] placeholder-stone-400 dark:placeholder:text-white placeholder:text-sm focus:outline-none border-none text-zinc-800 dark:text-white focus:caret-zinc-800 dark:focus:caret-white pr-10"
              disabled={isLoading} // 禁用输入框仅当isLoading为true
            />
            {/* 发送按钮 */}
            <button
              type="submit"
              onClick={handleSendClick}
              disabled={!isSubmitEnabled}
              className={`absolute top-1/2 right-[4px] transform -translate-y-1/2 w-8 h-8 rounded-full ${
                isSubmitEnabled ? 'bg-black' : 'bg-[hsl(0,0%,51%)]'
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
