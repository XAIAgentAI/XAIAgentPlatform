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
}


const InputComponent: React.FC<InputComponentProps> = ({ userName, setUserStatus, input, setInput, isLoading, handleSubmit }) => {
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
    handleSubmit(e);
  };

  const locale = useLocale();
  const t = useTranslations("chat");

  return (
    <div className="fixed bottom-6 w-[97vw] ml-auto">
      <div className="max-w-3xl px-4 py-4 w-full rounded-2xl md:w-[calc(700px)] md:ml-auto md:mr-[calc(1.4vw+10px)] lg:w-[calc(620px+12vw)] lg:ml-auto lg:mr-[calc(3.6vw-32px)] xl:w-[calc(62vw-30px)] xl:ml-auto xl:mr-[calc(7.4vw-0.8%)] 2xl:ml-auto 2xl:mr-[calc(7.6vw-0.8%)]">
        <form onSubmit={handleSubmit} className="w-full relative">
          <div className="w-full relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("inputHolder")}
              className="w-full rounded-full bg-zinc-800 px-4 py-2 placeholder-text-tertiary focus:outline-none border-none focus:text-slate-200 focus:caret-slate-200 pr-10"
              disabled={isLoading} // 禁用输入框仅当isLoading为true
            />
            {/* 发送按钮 */}
            <button
              type="submit"
              onClick={handleSendClick}
              disabled={!isSubmitEnabled}
              className={`absolute top-1/2 right-[4px] transform -translate-y-1/2 w-8 h-8 rounded-full bg-white bg-opacity-10 ${
                isSubmitEnabled ? 'bg-opacity-30' : ''
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
        <div className="mt-2 text-center text-neutral-700 text-xs">{t("inputInfo")}</div>
      </div>
    </div>
  );
};

export default InputComponent;
