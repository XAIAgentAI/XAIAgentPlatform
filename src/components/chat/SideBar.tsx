'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface SideBarProps {
  messages: { id: string; content: string; timestamp: string }[];
}

interface ModalProps {
  onClose: () => void;
}

const SearchBar = ({ onClose }: ModalProps) => {
  const [query, setQuery] = useState('');

  return (
    <div className="fixed top-0 right-0 h-full w-full bg-white bg-opacity-90 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-72 p-2 rounded-full border border-gray-300 mb-4"
        />
        <button onClick={onClose} className="bg-black text-white px-4 py-2 rounded-full">
          Close
        </button>
      </div>
    </div>
  );
};

const EmailEditor = ({ onClose }: ModalProps) => {
  return (
    <div className="fixed top-0 right-0 h-full w-full bg-white bg-opacity-90 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center w-72">
        <textarea
          placeholder="Write your email here..."
          className="w-full h-64 p-2 rounded border border-gray-300 mb-4"
        />
        <button onClick={onClose} className="bg-black text-white px-4 py-2 rounded-full">
          Close
        </button>
      </div>
    </div>
  );
};

const SideBar = ({ messages }: SideBarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const todayMessages = messages
    .filter((msg) => new Date(msg.timestamp).getDate() === new Date().getDate())
    .slice(0, 2);

  const weekAgoMessages = messages
    .filter(
      (msg) =>
        new Date(msg.timestamp).getDate() === new Date().getDate() - 7
    )
    .slice(0, 2);

  const handleSearchOpen = () => {
    //setIsSearchOpen(true);
  };

  const handleEmailOpen = () => {
    //setIsEmailOpen(true);
  };

  const handleClose = () => {
    //setIsSearchOpen(false);
    //setIsEmailOpen(false);
  };

  return (
    <div className="fixed hidden lg:flex flex-col w-[20vw] bg-zinc-800 p-4 text-white h-[calc(100vh-115px)]">
      <div className="flex justify-end space-x-2">
        <Image src="/images/topsearch.png" alt="Search" width={16} height={16} onClick={handleSearchOpen} className="cursor-pointer"/>
        <Image src="/images/email2.png" alt="Email" width={24} height={24} onClick={handleEmailOpen} className="cursor-pointer"/>
      </div>
      {isSearchOpen && <SearchBar onClose={handleClose}/>}
      {isEmailOpen && <EmailEditor onClose={handleClose}/>}
      <hr className="my-4 border-gray-700" />
      <div className="text-lg mb-4 space-y-2">
        <div>Explore AI Agent</div>
        <div>Trading AI Agent</div>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto space-y-4">
        <div>
          <div className="text-sm">Today</div>
          <div className="overflow-y-auto max-h-35vh">
            {todayMessages.map((msg) => (
              <div key={msg.id} className="mb-2">
                {msg.content}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm">7 days ago</div>
          <div className="overflow-y-auto max-h-35vh">
            {weekAgoMessages.map((msg) => (
              <div key={msg.id} className="mb-2">
                {msg.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
