'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface InputComponentProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setUserStatus: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  userName: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>; // 确保返回 Promise
  conversations: any;
  setIsNew: any;
  prompt: any;
  agent: string;
  setagent: any;
}

const InputComponent: React.FC<InputComponentProps> = ({
  agent,
  setagent,
  prompt,
  setIsNew,
  conversations,
  userName,
  setUserStatus,
  input,
  setInput,
  isLoading,
  setIsLoading,
  handleSubmit,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const locale = useLocale();
  const t = useTranslations("chat");

  // 初始化 prompt
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
        5 * 24
      )}px`;
      if (textareaRef.current.scrollHeight > 5 * 24) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [input]);

  const isSubmitEnabled = !isLoading && input !== null && input.trim() !== '';

    // ✅ 上传图片到后端 API（STID 模式专用）
    const uploadImageToBackend = async (file: File): Promise<string> => {
      console.log('[STID] Starting image upload to backend...');
      console.log('[STID] File info:', { name: file.name, size: file.size, type: file.type });
      
      const formData = new FormData();
      formData.append('image', file);
  
      try {
        console.log('[STID] Sending request to /api/image...');
        const response = await fetch('/api/image', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          console.error('[STID] Image upload failed with status:', response.status);
          throw new Error('上传图片失败');
        }
  
        const data = await response.json();
        console.log('[STID] Image upload successful. Received URL:', data.imageUrl);
        return data.imageUrl; // 返回 OSS URL
      } catch (error) {
        console.error('[STID] Error during image upload:', error);
        throw error;
      }
    };
  
    // ✅ 处理图片上传（用户选择文件时触发）
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        console.log('[Image] User selected file:', e.target.files[0]);
        setSelectedImage(e.target.files[0]);
      } else {
        console.log('[Image] No file selected or selection cancelled');
      }
    };
  
    // ✅ 修改后的发送逻辑（STID 模式 & 普通模式）
    const handleSendClick = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log('[Submit] Form submission started');
  
      if (!userName) {
        console.log('[Auth] User not logged in, showing auth modal');
        setUserStatus(false);
        setTimeout(() => setUserStatus(true), 1000);
        return;
      }
  
      if (conversations["1"]?.length > 0) {
        console.log('[Chat] Existing conversation detected, marking as new');
        setIsNew("yes");
      }
  
      setIsLoading(true); // 开始加载
      console.log('[Loading] Set loading state to true');
  
      try {
        // STID 模式：先上传图片，再提交对话
        if (agent === "StyleID" && selectedImage) {
          console.log('[STID] STID mode detected with selected image');
          const imageUrl = await uploadImageToBackend(selectedImage);
          console.log('[STID] Setting input with image URL:', imageUrl);
          setInput(imageUrl); // 设置输入为图片 URL
          console.log('[STID] Submitting conversation with image...');
          await handleSubmit(e); // 提交对话（可能包含 imageUrl）
          setSelectedImage(null); // 清空已选图片
          console.log('[STID] Cleared selected image');
          if (fileInputRef.current) fileInputRef.current.value = ''; // 清空文件输入
        } 
        // 普通模式：直接提交文本
        else {
          console.log('[Submit] Normal mode - submitting text input:', input);
          await handleSubmit(e);
        }
      } catch (error) {
        console.error('[Error] Submission failed:', error);
      } finally {
        console.log('[Loading] Set loading state to false');
        setIsLoading(false); // 结束加载
      }
    };

  return (
    <div className="fixed bottom-0 md:bottom-[23px] w-[97vw] lg:w-[78vw] mx-auto md:right-[0.38vw] lg:right-[0.48vw] bg-background bg-opacity-0" style={{zIndex: 10000}}>
      <div className="max-w-3xl px-4 py-4 w-full lg:w-[80%] mx-auto rounded-2xl">
        <form onSubmit={handleSendClick} className="w-full relative">
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
              {/* 文本输入框 */}
              <textarea
                ref={textareaRef}
                value={input || ''}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("inputHolder")}
                className="w-full bg-[#EDEDED] rounded-2xl dark:bg-[rgb(21,21,21)] placeholder:text-[#222222] placeholder:opacity-25 px-[18px] py-[10px] pb-[10.5px] dark:placeholder:text-white placeholder:text-sm focus:outline-none border-none text-zinc-800 dark:text-white focus:caret-zinc-800 dark:focus:caret-white pr-10 resize-none overflow-hidden min-h-[44px] max-h-[120px] pl-10 hide-scrollbar"
                disabled={isLoading}
                rows={1}
              />
              {/* 图片预览 */}
              {selectedImage ? (
                <div className="w-[180px] md:w-[80%] mb-2 mx-auto mt-2 flex items-center justify-between bg-white/50 dark:bg-[rgba(45,45,45,0.6)] p-2 rounded-sm" style={{zIndex:1000}}>
                  <div className="flex items-center truncate max-w-[70%]">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {selectedImage.name}
                    </span>
                  </div>
                </div>
              ):(<div className="h-[28px]"></div>)}
            </div>
            
            {/* 发送按钮 */}
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