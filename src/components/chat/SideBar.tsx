'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AuthButton from './SignUp';

interface SideBarProps {
  messages: { id: string; content: string; timestamp: string }[];
}

const SideBar = ({ messages }: SideBarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [bgCopy, setBgCopy] = useState<string>('bg-stone-700')
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; content: string; timestamp: string }[]>([]);

  useEffect(() => {
    if (query) {
      const results = messages.filter(msg =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [query, messages]);

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleEmailOpen = () => {
    setIsEmailOpen(!isEmailOpen);
  };

  const handleClose = () => {
    setIsSearchOpen(false);
    setIsEmailOpen(false);
    setQuery('');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('endless_sword@163.com');
    setBgCopy('bg-stone-500')
    setTimeout(() => setBgCopy('bg-stone-700'), 200);
  };

  return (
    <div className="fixed 2xl:top-[40px] md:top-[68px] hidden lg:flex flex-col w-[20vw] bg-zinc-800 p-4 text-white h-[calc(100vh-115px)]">
      <div className="flex justify-end space-x-2">
        <div className="inline-block w-[50px] flex items-center self-start relative right-[calc(8vw-20px)] xl:right-[calc(9vw-5px)] 2xl-[10vw]">
          <AuthButton/>
        </div>
        <Image src="/images/search.png" alt="Search" width={28} height={28} onClick={handleSearchOpen} className="cursor-pointer relative right-[4px]"/>
        <Image src="/images/write.png" alt="Email" width={28} height={24} onClick={handleEmailOpen} className="cursor-pointer relative right-[4px]"/>
      </div>
      {isSearchOpen && (
        <div className="w-full flex items-center justify-between rounded mb-4 p-2">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[64%] text-neutral-700 pl-2 focus:outline-none rounded-lg space-x-2 space-y-2 focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition duration-300"
          />
          <button onClick={handleClose} className="w-auto ml-[6px] xl:ml-[0] xl:w-[30%] bg-zinc-700 text-white px-2 py-1 rounded-full">
            Cancel
          </button>
        </div>
      )}
      {isSearchOpen ? (
        <div className="overflow-y-auto">
          {searchResults.map((msg) => (
            <div key={msg.id} className="mb-2 bg-neutral-900 w-full text-zinc-700 text-center hover:bg-slate-400 rounded-xl">
              {msg.content}
            </div>
          ))}
        </div>
      ) : (
        <>
          {isEmailOpen && (
            <div className="mt-4">
              <div className="text-lg mb-2 text-stone-50 font-light">Email Us:</div>
              <div className="flex flex-col items-start xl:flex-row xl:items-center xl:justify-between">
                <div className="text-stone-100 font-light">endless_sword@163.com</div>
                <button onClick={handleCopyEmail} className={`${bgCopy} relative top-[4px] xl:top-0 text-slate-200 px-2 py-1 rounded-md`}>
                  Copy
                </button>
              </div>
            </div>
          )}
          <hr className="my-4 border-gray-700" />
          <div className="text-lg mb-4 space-y-2">
            <div>Explore AI Agent</div>
            <div>Trading AI Agent</div>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto space-y-4">
            <div>
              <div className="text-xs">Today</div>
              <div className="overflow-y-auto max-h-33vh">
                {messages
                  .filter((msg) => new Date(msg.timestamp).getDate() === new Date().getDate())
                  .slice(0, 2)
                  .map((msg) => (
                    <div key={msg.id} className="mb-2 bg-neutral-900 w-[60%] text-zinc-700 text-center hover:bg-slate-400 rounded-xl">
                      {msg.content.split(' ').slice(0, 3).join(' ')}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <div className="text-xs">7 days ago</div>
              <div className="overflow-y-auto max-h-35vh">
                {messages
                  .filter(
                    (msg) =>
                      new Date(msg.timestamp).getDate() === new Date().getDate() - 7
                  )
                  .slice(0, 2)
                  .map((msg) => (
                    <div key={msg.id} className="mb-2 bg-neutral-900 w-[60%] text-zinc-700 text-center hover:bg-slate-400 rounded-xl">
                      {msg.content.split(' ').slice(0, 3).join(' ')}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SideBar;

