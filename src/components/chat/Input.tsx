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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // 点击模态框外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (!isImageLoading) {
          setShowImageModal(false);
        }
      }
    }
    if (showImageModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImageModal, isImageLoading]);

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

  // 调用STID API接口
  const handleTryNewApi = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedImage || !input) return;
    
    const formData = new FormData();
    formData.append('face_image', selectedImage);
    formData.append('prompt', input);
    
    try {
      setIsImageLoading(true);
      setImageError(null);
      setShowImageModal(true);
      
      const response = await fetch('/api/stid', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('image')) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setGeneratedImage(imageUrl);
        } else {
          setImageError('There is no face detected in your input or your image is over 10MB');
        }
      } else {
        setImageError('There is no face detected in your input or your image is over 10MB');
      }
    } catch (error) {
      console.error('发送图片失败:', error);
      setImageError('There was an error processing your image');
    } finally {
      setIsImageLoading(false);
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      // You could add a toast notification here for success
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'stid-generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const locale = useLocale();
  const t = useTranslations("chat");

  return (
    <div className="fixed bottom-0 md:bottom-[23px] w-[97vw] lg:w-[78vw] mx-auto md:right-[0.38vw] lg:right-[0.48vw] bg-background bg-opacity-0" style={{zIndex:150000}}>
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
                    disabled={isLoading || !input.trim()}
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

      {/* 自定义图片展示模态框 */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex:1000100}}>
          <div 
            ref={modalRef}
            style={{zIndex:1000100}}
            className="bg-white relative dark:bg-[#1e1e1e] rounded-lg shadow-xl w-[90vw] max-w-2xl min-h-[80vh] max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center border-b dark:border-gray-700 p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Image received</h3>
              {!isImageLoading && (
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="p-4 overflow-auto flex-grow flex items-center justify-center">
              {isImageLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className="animate-spin h-12 w-12 text-orange-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">Processing your image...</p>
                </div>
              ) : imageError ? (
                <div className="flex items-center justify-center h-full text-center p-8">
                  <p className="text-gray-600 dark:text-gray-300 text-lg">{imageError}</p>
                </div>
              ) : generatedImage ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <img 
                    src={generatedImage} 
                    alt="Generated from STID" 
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={handleCopyImage}
                      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      title="Copy image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                    <button
                      onClick={handleDownloadImage}
                      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      title="Download image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputComponent;