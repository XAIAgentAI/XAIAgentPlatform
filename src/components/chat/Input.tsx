'use client'
import React, { useEffect, useState, useRef } from 'react';
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
  setagent: any;
}

const InputComponent: React.FC<InputComponentProps> = ({ setagent, prompt, setIsNew, conversations, userName, setUserStatus, input, setInput, isLoading, handleSubmit }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // 初始化prompt
  useEffect(() => {
    if (!isInitialized && prompt) {
      setInput(prompt);
      setIsInitialized(true);
    }
  }, [prompt, setInput, isInitialized]);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        5 * 24 // 最大5行高度
      )}px`;
      // Enable scrolling when content exceeds 5 lines
      if (textareaRef.current.scrollHeight > 5 * 24) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [input]);

  const isSubmitEnabled = !isLoading && input !== null && input.trim() !== '';

  const handleSendClick = (e: React.FormEvent) => {
    if (!userName) {
      setUserStatus(false);
      setTimeout(() => setUserStatus(true), 1000);
      e.preventDefault();
      return;
    }
    if(conversations["1"]?.length > 0){
      setIsNew("yes");
    }
    handleSubmit(e);
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setagent("StyleID");
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // 调用新API接口
  const handleTryNewApi = async () => {
    if (!selectedImage) return;
    
    const formData = new FormData();
    formData.append('face_image', selectedImage);
    
    try {
      const response = await fetch('/api/stid', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API响应:', data);
      } else {
        console.error('API错误:', response.statusText);
      }
    } catch (error) {
      console.error('发送图片失败:', error);
    } finally {
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const locale = useLocale();
  const t = useTranslations("chat");

  return (
    <div className="fixed bottom-0 md:bottom-[23px] w-[97vw] lg:w-[78vw] mx-auto md:right-[0.38vw] lg:right-[0.48vw] bg-background bg-opacity-0" style={{zIndex:10000}}>
      <div className="max-w-3xl px-4 py-4 w-full lg:w-[80%] mx-auto rounded-2xl">
        <form onSubmit={handleSubmit} className="w-full relative">
          <div className="w-full relative flex items-center bg-[#EDEDED] dark:bg-[rgb(21,21,21)] rounded-2xl">
            {/* 图片上传按钮 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="self-end absolute mb-[8.8px] left-2 w-8 h-8 rounded-full flex items-center justify-center bg-[#EDEDED] dark:bg-[rgba(22,22,22,0.7)] hover:bg-[#E0E0E0] dark:hover:bg-[rgba(22,22,22,0.6)] transition-colors"
              aria-label="上传图片"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </button>
            
            <div className="flex flex-col w-full">
              {/* 自适应高度的文本输入框 */}
              <textarea
                ref={textareaRef}
                value={input || ''}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("inputHolder")}
                className="w-full bg-[#EDEDED] rounded-2xl dark:bg-[rgb(21,21,21)] placeholder:text-[#222222] placeholder:opacity-25 px-[18px] py-[10px] pb-[10.5px] dark:placeholder:text-white placeholder:text-sm focus:outline-none border-none text-zinc-800 dark:text-white focus:caret-zinc-800 dark:focus:caret-white pr-10 resize-none overflow-hidden min-h-[44px] max-h-[120px] pl-10 hide-scrollbar"
                disabled={isLoading}
                rows={1}
              />
              {/* 图片预览和API按钮 - 移动到输入框底部 */}
              {selectedImage ? (
                <div className="w-[80%] mb-1 mx-auto mt-2 flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-2 rounded-sm" style={{zIndex:1000}}>
                  <div className="flex items-center truncate max-w-[70%]">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {selectedImage.name}
                    </span>
                  </div>
                  <button
                    onClick={handleTryNewApi}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors whitespace-nowrap"
                  >
                    尝试STID
                  </button>
                </div>
              ):(<div className="h-[28px]"></div>)}
            </div>
            
            {/* 发送按钮 - 优化后的样式 */}
            <button
              type="submit"
              onClick={handleSendClick}
              disabled={!isSubmitEnabled}
              className={`self-end absolute right-[4px] w-8 h-8 mb-[10px] rounded-full flex items-center justify-center ${
                isSubmitEnabled 
                  ? 'bg-[#1A73E8] hover:bg-[#0d5bbc] text-white' 
                  : 'bg-[#E0E0E0] dark:bg-[rgba(22,22,22,0.1)] text-gray-400 dark:text-gray-500'
              } transition-colors`}
              aria-label="发送消息"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
        
        <div className="mt-2 text-center text-stone-500 dark:text-neutral-700 text-xs">
          {t("inputInfo")}
        </div>
      </div>
    </div>
  );
};

export default InputComponent;