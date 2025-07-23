'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Header from '@/components/create/Header'

export default function createGuidePage() {
    const [userName, setUserName] = useState<String | null>("");
    const t = useTranslations("create");
    return (
        <div className="flex flex-col">
           <Header></Header>
        </div>
    )
}
