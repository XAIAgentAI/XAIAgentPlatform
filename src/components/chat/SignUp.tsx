// components/AuthButton.tsx
import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface User {
  username: string;
  password: string;
}

const AuthButton: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLoginMode, setLoginMode] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (username: string, password: string) => {
    if (isLoginMode) {
      const user = users.find(user => user.username === username && user.password === password);
      if (user) {
        setIsLoggedIn(true);
        setLoggedInUsername(username);
      } else {
        setError('Invalid username or password.');
      }
    } else {
      const userExists = users.some(user => user.username === username);
      if (userExists) {
        setError('Username already exists.');
        return;
      }
      setUsers([...users, { username, password }]);
      setIsLoggedIn(true);
      setLoggedInUsername(username);
    }
  };

  const toggleMode = () => {
    setLoginMode(!isLoginMode);
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setUsername('');
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
                onClick={()=>{setModalOpen(false)}}                      >
                <XMarkIcon className="w-4 h-4 text-zinc-700" />
            </button>
            <h2 className="text-lg text-center font-medium mb-4 text-zinc-700">
              {isLoginMode ? 'Log in' : 'Sign up'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAuth(username, password);
              if (!error) closeModal();
            }}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
