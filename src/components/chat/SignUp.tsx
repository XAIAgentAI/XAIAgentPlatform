// components/SignUp.tsx
import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface AuthButtonProps {
  userName: any;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthButton: React.FC<AuthButtonProps> = ({ userName, setUserName }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoginMode, setLoginMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (username: string, password: string) => {
    const response = await fetch('/api/chat/1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: username,
        thing: isLoginMode ? 'login' : 'signup',
        password: password
      })
    });

    const data = await response.json();

    if (data.success) {
      setIsLoggedIn(true);
      setLoggedInUsername(username);
      setUserName(username); // 更新用户名
      closeModal();
    } else {
      setError(data.message);
    }
  };

  const toggleMode = () => {
    setLoginMode(!isLoginMode);
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setUserName('');
    setPassword('');
    setError('');
  };

  if (isLoggedIn) return (
    <div
      className="bg-orange-100 rounded-full w-8 h-8 flex text-zinc-700 items-center justify-center cursor-pointer"
    >
      {loggedInUsername.slice(0, 3)}
    </div>
  );

  return (
    <>
      <div
        className="bg-slate-200 rounded-full w-8 h-8 flex text-zinc-700 items-center justify-center cursor-pointer"
        onClick={() => {
          setModalOpen(true);
          setLoginMode(false);
        }}
      >
        User
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg w-64">
            <button
              type="button"
              className="flex items-center justify-center px-2 py-1 text-zinc-700 rounded-full ml-[88%] hover:bg-teal-100 cursor-pointer"
              onClick={() => { setModalOpen(false) }}
            >
              <XMarkIcon className="w-4 h-4 text-zinc-700" />
            </button>
            <h2 className="text-lg text-center font-medium mb-4 text-zinc-700">
              {isLoginMode ? 'Log in' : 'Sign up'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAuth(userName, password);
            }}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-zinc-600"
                />
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-zinc-600"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="mb-4 text-sm text-blue-500 cursor-pointer" onClick={toggleMode}>
                {isLoginMode ? 'Sign up' : 'Log in'}
              </div>
              <button
                type="submit"
                className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthButton;
