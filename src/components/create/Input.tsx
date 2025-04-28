'use client'
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface InputComponentProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent, imageFile?: File) => Promise<void>;
}

const InputComponent: React.FC<InputComponentProps> = ({
  input,
  setInput,
  isLoading,
  handleSubmit,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const t = useTranslations("create");

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight * 2,
        120
      )}px`;
      if (textareaRef.current.scrollHeight > 5 * 24) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [input]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e, selectedImage || undefined);
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isSubmitEnabled = !isLoading && (input.trim() !== '' || selectedImage);

  return (
    <div className="fixed bottom-[23px] w-[97vw] mx-auto bg-background bg-opacity-0" style={{zIndex: 10}}>
      <div className="max-w-3xl px-4 py-[12px] w-full md:w-[80%] lg:w-[70%] mx-auto rounded-2xl">
        <form onSubmit={handleFormSubmit} className="w-full relative">
          <div className="w-full relative flex items-center bg-[#EDEDED] dark:bg-[rgb(21,21,21)] rounded-2xl">
            {/* Image upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="self-end absolute mb-[8.8px] left-2 w-8 h-8 rounded-full flex items-center justify-center bg-[#EDEDED] dark:bg-[rgba(22,22,22,0.7)] hover:bg-[#E0E0E0] dark:hover:bg-[rgba(22,22,22,0.6)] transition-colors"
              aria-label={t("uploadImage")}
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
              {/* Text input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("agentDescriptionPlaceholder")}
                className="placeholder:relative placeholder:top-[2px] w-full bg-[#EDEDED] rounded-2xl dark:bg-[rgb(21,21,21)] placeholder:text-[#222222] placeholder:opacity-25 px-[18px] py-[10px] dark:placeholder:text-white placeholder:text-sm focus:outline-none border-none text-zinc-800 dark:text-white focus:caret-zinc-800 dark:focus:caret-white pr-10 resize-none overflow-hidden min-h-[32px] max-h-[120px] pl-10 hide-scrollbar"
                disabled={isLoading}
                rows={1}
              />

              {/* Image preview */}
              {selectedImage && (
                <div className="w-[66vw] md:w-[70vw] lg:w-[72vw] max-w-[520px] mb-2 mx-auto mt-2 flex items-center justify-between bg-white/50 dark:bg-[rgba(45,45,45,0.6)] px-2 py-1 rounded-sm" style={{zIndex:1000}}>
                  <div className="flex items-center truncate max-w-[70%]">
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {selectedImage.name}
                    </span>
                  </div>
                  <button 
                    onClick={handleCancelImage}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[rgba(22,22,22,0.1)] transition-colors"
                    aria-label={t("cancelImage")}
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
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!isSubmitEnabled}
              className={`self-end absolute right-[4px] w-8 h-8 mb-[10px] rounded-full flex items-center justify-center ${
                isSubmitEnabled 
                  ? 'bg-[#ff6b00] hover:bg-[#ff8533] text-white' 
                  : 'bg-[#E0E0E0] dark:bg-[rgba(22,22,22,0.1)] text-gray-400 dark:text-gray-500'
              } transition-colors`}
              aria-label={t("createAgent")}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputComponent;