'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export default function createPage() {
    const [userName, setUserName] = useState<String | null>("");
    const t = useTranslations("create");
    const handleAuth = async () => {
        const response = await fetch('/api/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            thing: 'signup',
          })
        });
    
        const data = await response.json();
        const username = data.message;
        
        if (data.success) {
          setUserName(username); // 更新用户名
          localStorage.setItem('create-username', username); // 存储用户名到localStorage
        }
      };
    
      useEffect(() => {
        if (!localStorage.getItem('create-username')) {
          handleAuth();
        } else {
          setUserName(localStorage.getItem('create-username'));
        }
      }, []); 
    return (
        <div className="flex flex-col"></div>
    )
}