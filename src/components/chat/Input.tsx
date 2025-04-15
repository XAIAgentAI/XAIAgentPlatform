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
  conversations: { [id: string]: Message[] };
  setIsNew: any;
  setIsLoadingImage: any;
  prompt: any;
  agent: string;
  isNew: any;
  setConversations: any;
  convid: any;
  setagent: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  convid: string;
  agent: string;
}

const InputComponent: React.FC<InputComponentProps> = ({
  agent,
  isNew,
  setagent,
  setConversations,
  prompt,
  setIsNew,
  convid,
  conversations,
  userName,
  setIsLoadingImage,
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

    // 取消已选择的图片
    const handleCancelImage = () => {
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  
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
    
      setIsLoading(true);
      console.log('[Loading] Set loading state to true');
    
      try {
        // STID模式处理
        if (agent === "StyleID" && selectedImage) {
          setIsLoadingImage(true);
          console.log('[STID] STID mode detected with selected image');
          const originalInput = input;
          setInput("");
          
          // 1. 先添加用户文本消息到对话
          const userTextMessage: Message = {
            id: `${Date.now()}-${userName}`,
            role: 'user',
            content: input,
            time: new Date().toISOString(),
            convid: convid,
            agent: agent
          };
          setConversations((prev:{ [id: string]: Message[] }) => ({ ...prev, ["1"]: [...(prev["1"] || []), userTextMessage] }));
          
          // 2. 上传原始图片到后端获取URL
          const originalImageUrl = await uploadImageToBackend(selectedImage);
          console.log('[STID] Original image URL:', originalImageUrl);
          
          // 3. 调用STID API生成新图片
          const stidFormData = new FormData();
          stidFormData.append('face_image', selectedImage);
          stidFormData.append('prompt', input);
          
          console.log('[STID] Calling STID API...');
          const stidResponse = await fetch('/api/stid', {
            method: 'POST',
            body: stidFormData,
          });
          
          if (!stidResponse.ok) {
            //图片无脸处理
              const errorResponse = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: originalInput,
                  message: "There is no face or the prompt is too unclear.",
                  user: userName,
                  thing: "image", 
                  isNew: isNew,
                  convid: convid,
                  model: "DeepSeek V3",
                  agent: agent
                }),
              });
              const errorData = await errorResponse.json();
              const aiMessage: Message = {
                id: `${errorData.convid}-${Date.now()}`,
                role: 'assistant',
                content: errorData.assistant || "",
                time: errorData.time || new Date().toISOString(),
                convid: errorData.convid,
                agent: errorData.agent
              };
              setConversations((prev:{ [id: string]: Message[] }) => ({ ...prev, ["1"]: [...(prev["1"] || []), aiMessage] }));
              console.log('[Loading] Set loading state to false');
              setIsLoading(false);
              setIsLoadingImage(false);
              setIsNew("no");
              return;
          }
          
          // 4. 将生成的图片Blob转换为File对象
          const generatedImageBlob = await stidResponse.blob();
          const generatedImageFile = new File([generatedImageBlob], 'generated-image.jpg', {
            type: 'image/jpeg',
          });
          
          // 5. 上传生成的图片到后端获取URL
          const generatedImageUrl = await uploadImageToBackend(generatedImageFile);
          console.log('[STID] Generated image URL:', generatedImageUrl);
          
          // 6. 发送图片消息到聊天API
          const imageResponse = await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: originalInput,
              message: generatedImageUrl, // 使用生成的图片URL作为消息内容
              user: userName,
              thing: "image", // 重要：设置为image类型
              isNew: isNew,
              convid: convid,
              model: "DeepSeek V3",
              agent: agent
            }),
          });
          
          const imageData = await imageResponse.json();
          console.log('[STID] Image message response:', imageData);
          
          // 7. 添加AI消息到对话
          const aiMessage: Message = {
            id: `${imageData.convid}-${Date.now()}`,
            role: 'assistant',
            content: generatedImageUrl,
            time: imageData.time || new Date().toISOString(),
            convid: imageData.convid,
            agent: imageData.agent
          };
          setConversations((prev:{ [id: string]: Message[] }) => ({ ...prev, ["1"]: [...(prev["1"] || []), aiMessage] }));
          
          // 8. 清理状态
          setSelectedImage(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setInput('');
        } else {
          // 普通文本模式保持不变
          console.log('[Submit] Normal mode - submitting text input:', input);
          await handleSubmit(e);
        }
      } catch (error) {
        console.error('[Error] Submission failed:', error);
      } finally {
        console.log('[Loading] Set loading state to false');
        setIsLoading(false);
        setIsLoadingImage(false);
        setIsNew("no");
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
                <div className="w-[66vw] md:w-[70vw] lg:w-[72vw] max-w-[520px] mb-2 mx-auto mt-2 flex items-center justify-between bg-white/50 dark:bg-[rgba(45,45,45,0.6)] px-2 py-1 rounded-sm" style={{zIndex:1000}}>
                  <div className="flex items-center truncate max-w-[70%]">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {selectedImage.name}
                    </span>
                  </div>
                  <button 
                    onClick={handleCancelImage}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[rgba(22,22,22,0.1)] transition-colors"
                    aria-label="取消图片"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
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
                  ? 'bg-[#ff6b00] hover:bg-[#ff8533] text-white' 
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