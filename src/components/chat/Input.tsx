'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface InputComponentProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setUserStatus: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedStyle: React.Dispatch<React.SetStateAction<string | null>>
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  userName: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>; // 确保返回 Promise
  conversations: { [id: string]: Message[] };
  setIsNew: any;
  setIsLoadingImage: any;
  prompt: any;
  agent: string;
  count: any;
  userNumber: any;
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
  count,
  userNumber,
  setConversations,
  prompt,
  setIsNew,
  convid,
  conversations,
  userName,
  setIsLoadingImage,
  setSelectedStyle,
  setUserStatus,
  input,
  setInput,
  isLoading,
  setIsLoading,
  handleSubmit,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [presets, setPresets] = useState<{name: string; prompt: string}[]>([])
  const [placeholderText, setPlaceholderText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isStyleOpen, setIsStyleOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const locale = useLocale();
  const t = useTranslations("chat");

  const presetBtnTextMap = {
    "StyleID": "Styles",
    "LogoLift": "Logos"
  }

  // Stable Diffusion style presets
  const stylePresets = [
    { 
        name: t("Cinematic.name"), 
        prompt: t("Cinematic.prompt") 
    },
    { 
        name: t("Anime.name"), 
        prompt: t("Anime.prompt") 
    },
    { 
        name: t("Cyberpunk.name"), 
        prompt: t("Cyberpunk.prompt") 
    },
    { 
        name: t("Watercolor.name"), 
        prompt: t("Watercolor.prompt") 
    },
    { 
        name: t("LowPoly.name"), 
        prompt: t("LowPoly.prompt") 
    },
    { 
        name: t("Portrait.name"), 
        prompt: t("Portrait.prompt") 
    },
    { 
        name: t("OilPainting.name"), 
        prompt: t("OilPainting.prompt") 
    },
    { 
        name: t("Minimalist.name"), 
        prompt: t("Minimalist.prompt") 
    },
    { 
        name: t("PixelArt.name"), 
        prompt: t("PixelArt.prompt") 
    },
    { 
        name: t("Sketch.name"), 
        prompt: t("Sketch.prompt") 
    },
    { 
        name: t("ChalkDrawing.name"), 
        prompt: t("ChalkDrawing.prompt") 
    },
    { 
        name: t("Claymation.name"), 
        prompt: t("Claymation.prompt") 
    },
    { 
        name: t("ComicBook.name"), 
        prompt: t("ComicBook.prompt") 
    },
    { 
        name: t("Vaporwave.name"), 
        prompt: t("Vaporwave.prompt") 
    },
    { 
        name: t("Ukiyoe.name"), 
        prompt: t("Ukiyoe.prompt") 
    }
  ];
  const logoPresets = [
    { 
        name: t("logo.minimalist.name"), 
        prompt: t("logo.minimalist.prompt") 
    },
    { 
        name: t("logo.geometry.name"), 
        prompt: t("logo.geometry.prompt") 
    },
    { 
        name: t("logo.nature.name"), 
        prompt: t("logo.nature.prompt") 
    },
    { 
        name: t("logo.retro.name"), 
        prompt: t("logo.retro.prompt") 
    },
    { 
        name: t("logo.cyber.name"), 
        prompt: t("logo.cyber.prompt") 
    },
  ]
  // 切换agent清空输入框
  useEffect(() => {
    setInput('');
  }, [agent])

  // 初始化presets
  useEffect(() => {
    if(agent === 'StyleID') {
      setPresets(stylePresets)
      setPlaceholderText(t("inputHolder"))
    } else if(agent === 'LogoLift') {
      setPresets(logoPresets)
      setPlaceholderText(t("logo.inputHolder"))
    }
  }, [agent])

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
      if(!input){
        textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        32
      )}px`;
      } else {
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          120
        )}px`;
      }
      if (textareaRef.current.scrollHeight > 5 * 24) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [input]);

  const handleStyleSelect = (stylePrompt: string, styleName: string) => {
    if(agent === 'LogoLift') {
      setInput(`${stylePrompt},${input}`);
    } else {
      setInput(stylePrompt);
    }
    setSelectedStyle(styleName);
    setIsStyleOpen(false);
  };

  const handleScrollLeft = () => {
    if(scrollRef.current){
      scrollRef.current.scrollLeft-=100;
    }
  }

  const handleScrollRight = () => {
    if(scrollRef.current){
      scrollRef.current.scrollLeft+=100;
    }
  }

  // STID必须有图片
  const isSubmitEnabled = !isLoading && input !== null && input.trim() !== '' && 
  (agent !== "StyleID" || (agent === "StyleID" && selectedImage !== null));

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
    
      // 用来判断各个agent是否进入业务处理流程
      const checkAgent = (agent: string) => {
        if(agent === 'StyleID') return !!selectedImage
        else if(agent === 'LogoLift') return true
        else return false
      }
      try {
        if(checkAgent(agent)) {
          //loading
          setIsLoadingImage(true);
          if(selectedImage) console.log(`[${agent}] ${agent} mode detected with selected image`);
          const originalInput = input;

          // 0. 清理状态
          setSelectedImage(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setInput('');

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
          // 这个地方不需要上传图片的agent 不需要这一步
          if(agent === 'StyleID') {
            const originalImageUrl = await uploadImageToBackend(selectedImage as File);
            console.log(`[${agent}] Original image URL:`, originalImageUrl);
          } 
          
          
          // 构造参数，不同agent参数不一样
          let params:any;
          if(agent === 'StyleID') {
            params = new FormData();
            params.append('face_image', selectedImage as File);
            params.append('prompt', input);
          } else if(agent === 'LogoLift') {
            params = {
              prompt: input
            }
          }
         
          // 3. 调用各自agent API
          console.log(`[${agent}] Calling ${agent} API...`);
          let apiRes:any
          if(agent === 'StyleID') {
            apiRes = await fetch('/api/stid', {
              method: 'POST',
              body: params,
            });
            // 后续处理
            if (!apiRes.ok) {
              //图片无脸处理
                const errorResponse = await fetch('/api/chat/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: originalInput,
                    message: t("noface"),
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
          } else if(agent === 'LogoLift') {
            apiRes = await fetch('/api/logolift', {
              method: 'POST',
              body: JSON.stringify({
                prompt: input,
              }),
            });
          }
          
          // 4. 将生成的图片Blob转换为File对象
          const generatedImageBlob = await apiRes.blob();
          const generatedImageFile = new File([generatedImageBlob], 'generated-image.jpg', {
            type: 'image/jpeg',
          });

          // 5. 上传生成的图片到后端获取URL
          const generatedImageUrl = await uploadImageToBackend(generatedImageFile);
          console.log(`[${agent}] Generated image URL:`, generatedImageUrl);

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
          console.log(`[${agent}] Image message response:`, imageData);
          
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 阻止默认的换行行为
      handleSendClick(e);
    } 
  };
  return (
    <div className="fixed bottom-0 md:bottom-[23px] w-[97vw] lg:w-[78vw] mx-auto md:right-[0.38vw] lg:right-[0.48vw] bg-background bg-opacity-0" style={{zIndex: 10}}>
      <div className="max-w-3xl px-4 py-[12px] w-full lg:w-[80%] mx-auto rounded-2xl">
        {agent === "LogoLift" && (
          <div className="text-center text-neutral-600 dark:text-neutral-300 text-sm mb-3">
            提示：如需在Logo中显示文本（仅限英文），请用引号标注""出来。
          </div>
        ) }
        
        <form onSubmit={handleSendClick} className="w-full relative">
          <div className="w-full relative flex items-center bg-[#EDEDED] dark:bg-[rgb(21,21,21)] rounded-2xl">
            {/* 图片上传按钮 */}
            {
              agent === "StyleID" && (
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
              )
            }
            
            <div className="flex flex-col w-full">
            {/* Style selector - only shown for StyleID agent */}
            {(agent === "StyleID" || agent === "LogoLift") && (
              <div className="relative w-[94%] mx-auto mt-2">
                <div 
                  className={`flex items-center justify-center space-x-2 ${
                    isStyleOpen ? 'w-full hide-scrollbar' : 'w-fit'
                  } mx-auto transition-all duration-300 ease-in-out`}
                >
                  <button
                    type="button"
                    onClick={() => setIsStyleOpen(!isStyleOpen)}
                    className={`flex items-center space-x-2 rounded-full ${
                      isStyleOpen 
                        ? 'px-4 py-2 bg-card-inner-hover dark:bg-[rgba(30,30,30,0.9)] shadow-md' 
                        : 'px-4 py-2 bg-card-inner dark:bg-[rgba(22,22,22,0.8)] hover:bg-card-inner-hover dark:hover:bg-[rgba(30,30,30,0.9)]'
                    } transition-all duration-200`}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 text-neutral-600 dark:text-neutral-300"
                    >
                      <path 
                        d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="currentColor"
                      />
                    </svg>
                    <span className={`${isStyleOpen ? 'opacity-100' : 'opacity-100'} whitespace-nowrap overflow-hidden transition-all duration-200 text-neutral-600 dark:text-neutral-300`}>
                      {presetBtnTextMap[agent]}
                    </span>
                    <p className="text-neutral-600 dark:text-neutral-300">{presets.length}</p>
                  </button>
                  
                  {isStyleOpen && (
                    <div className="flex flex-row space-x-1 overflow-hidden">
                    <button
                      onClick={handleScrollLeft}
                      type="button"
                      className="px-2 py-1.5 text-xs rounded-full bg-transparent hover:bg-[rgba(220,220,220,0.9)] dark:hover:bg-[rgba(30,30,30,0.9)] transition-colors duration-150 text-neutral-600 dark:text-neutral-300"
                    >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="rgba(155, 155, 155, 0.5)"
                          className="w-4 h-4"
                        >
                          <path
                            d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1.708.708L5.707 7.5H11.5a.5.5 0 0 1.5.5z"
                          />
                        </svg>
                    </button>
                    <div className="flex space-x-2 overflow-x-auto hide-scrollbar" ref={scrollRef}>
                      {presets.map((style, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleStyleSelect(style.prompt,style.name)}
                          className="px-3 py-1.5 text-xs rounded-full bg-card-inner dark:bg-[rgba(22,22,22,0.8)] hover:bg-card-inner-hover dark:hover:bg-[rgba(30,30,30,0.9)] whitespace-nowrap transition-colors duration-150 text-neutral-600 dark:text-neutral-300"
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                    <button
                        onClick={handleScrollRight}
                        type="button"
                        className="px-2 py-1.5 text-xs rounded-full bg-transparent hover:bg-[rgba(220,220,220,0.9)] dark:hover:bg-[rgba(30,30,30,0.9)] transition-colors duration-150 text-neutral-600 dark:text-neutral-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="rgba(155, 155, 155, 0.5)"
                          className="w-4 h-4"
                        >
                          <path d="M4 8a.5.5 0 0 1.5-.5h5.793L8.146 5.854a.5.5 0 1 1.708-.708l3 3a.5.5 0 0 1 0.708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z" />
                          <path d="M4 8a.5.5 0 0 0.5.5h5.793l-1.647 1.646a.5.5 0 0 0.708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5A.5.5 0 0 0 4 8z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
              {/* 文本输入框 */}
              <textarea
                ref={textareaRef}
                value={input || ''}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholderText}
                className={`placeholder:relative placeholder:top-[2px] w-full bg-[#EDEDED] rounded-2xl dark:bg-[rgb(21,21,21)] placeholder:text-[#222222] placeholder:opacity-25 px-[18px] ${agent === "StyleID" ? "pt-[3px] pb-[3px]" : "py-[10px]"} dark:placeholder:text-white placeholder:text-sm focus:outline-none border-none text-zinc-800 dark:text-white focus:caret-zinc-800 dark:focus:caret-white pr-10 resize-none overflow-hidden min-h-[32px] max-h-[120px] pl-10 hide-scrollbar`}
                disabled={isLoading}
                rows={1}
                onKeyDown={handleKeyDown}
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
        {agent === "StyleID" && (
          <div className="w-full mx-auto mt-1 overflow-hidden flex flex-col space-y-1">
            <div className="flex flex-row items-center justify-around text-xs text-[#666666] dark:text-[#999999] font-medium tracking-tight opacity-80 space-x-1 lg:hidden">
              <div className="text-center">{t("need")}</div>
            </div>
            <div className="opacity-75 text-center max-w-[80%] mx-auto text-xs text-[#666666] dark:text-[#999999] font-medium hidden lg:block">{t("need")} | {t("bottom.auser")} {userNumber} | {t("bottom.apic")} {count}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputComponent;