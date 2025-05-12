import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";
import { authAPI, agentAPI, testDuplicateAgentCreation } from '@/services/createAgent';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOST_URL;
const New: React.FC = () => {
    const router = useRouter();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [nameExists, setNameExists] = useState(false);
    const [symbolExists, setSymbolExists] = useState(false);
    const locale = useLocale();
    const t = useTranslations("createAgent");
    const [creating, setCreating] = useState(false);
    const [creationProgress, setCreationProgress] = useState(0);
    const [displayProgress, setDisplayProgress] = useState(0); // Separate state for smooth display
    const [success, setSuccess] = useState(false);
    const [data, setData] = useState<{
        id: string;
        name: string;
        symbol: string;
        description: string;
        useCases: {
            zh: string[];
            ja: string[];
            ko: string[];
            en: string[];
        };
    } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        description: '',
        tokenSupply: '5000000000',
        iaoPercentage: '15%',
        miningRate: `${t("mining")}`,
        userFirst: '',
        agentFirst: '',
        userSecond: '',
        agentSecond: '',
        userThird: '',
        agentThird: ''
    });
    const [showTimeOptions, setShowTimeOptions] = useState(false);
    const [iaoStartTime, setIaoStartTime] = useState('7_days'); // Default option
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Effect for smooth progress animation
    useEffect(() => {
        if (!creating) return;

        const interval = setInterval(() => {
            setDisplayProgress(prev => {
                if (prev >= creationProgress) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 30); // Adjust speed of progress animation here

        return () => clearInterval(interval);
    }, [creating, creationProgress]);

    // Effect to handle success state when progress reaches 100%
    useEffect(() => {
        if (displayProgress === 100 && creationProgress === 100) {
            setTimeout(() => {
                setSuccess(true);
            }, 500); // Small delay for smooth transition
        }
    }, [displayProgress, creationProgress]);

    const checkAgentExistence = async (name: string, symbol: string) => {
        try {
          const response = await fetch('/api/agents/repeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, symbol }),
          })
      
          if (!response.ok) {
            throw new Error('Failed to check agent existence')
          }
      
          const data = await response.json()
          if(data.exists&&nameInputRef.current){
            nameInputRef.current.scrollIntoView({behavior:"smooth",block:"center"})
          }
          return data
        } catch (error) {
          console.error('Error checking agent existence:', error)
          return { exists: false, nameExists: false, symbolExists: false }
        }
      }

    const getRealToken = async () => {
        // 检查是否有token
        if(localStorage.getItem("token")){
            return localStorage.getItem("token");
        }
        // 认证流程
        const nonceData = await authAPI.getNonce();
        setCreationProgress(20);
        const authData = await authAPI.generateSignature(nonceData.message);
        setCreationProgress(40);
        const token = await authAPI.getToken(authData);
        setCreationProgress(60);
        return token;
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const validateValue = value.replace(/[^A-Za-z ]/g, '').slice(0,20);
        setFormData(prev => ({ ...prev, name: validateValue }));
      };
      
    const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const uppercaseValue = value.toUpperCase().replace(/[^A-Z]/g, '');
        const validatedValue = uppercaseValue.slice(0, 5);
        setFormData(prev => ({ ...prev, symbol: validatedValue }));
    };

    type AgentData = {
        id: string;
        name: string;
        symbol: string;
        description: string;
        useCases: {
          zh: string[];
          ja: string[];
          ko: string[];
          en: string[];
        };
      };
      
      const handleCreate = async () => {
        // 检查是否已存在
        const { exists, nameExists: nameExist, symbolExists: symbolExist } = 
          await checkAgentExistence(formData.name, formData.symbol);
      
        if (exists) {
          setNameExists(nameExist);
          setSymbolExists(symbolExist);
          return;
        }
      
        setCreating(true);
        try {
          // 重置状态
          setNameExists(false);
          setSymbolExists(false);
          setCreationProgress(20);
          setDisplayProgress(20);
      
          // 初始化数据
          const initialData: AgentData = {
            id: "1",
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description || "",
            useCases: { zh: [], en: [], ko: [], ja: [] }
          };
          setData(initialData);
      
          // 获取token
          const token = await getRealToken();
          setCreationProgress(40);
          setDisplayProgress(40);
      
          // 翻译用例
          let useCases = {
            en: [
              "Help me brainstorm creative ideas for my project",
              "Assist me in analyzing market trends for my business",
              "Guide me through setting up a new productivity system"
            ],
            ja: [
              "プロジェクトの創造的なアイデアをブレインストーミングするのを手伝ってください",
              "ビジネスのための市場動向を分析するのを支援してください",
              "新しい生産性システムの設定を案内してください"
            ],
            ko: [
              "프로젝트를 위한 창의적인 아이디어를 브레인스토밍하는 것을 도와주세요",
              "비즈니스를 위한 시장 동향 분석을 지원해 주세요",
              "새로운 생산성 시스템 설정을 안내해 주세요"
            ],
            zh: [
              "帮我为项目进行创意头脑风暴",
              "协助我分析业务的市场趋势",
              "指导我建立新的效率系统"
            ]
          };
      
          try {
            const translateResponse = await fetch('/api/chat/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                description: formData.description || "An Agent"
              })
            });
            
            if (translateResponse.ok) {
              useCases = await translateResponse.json();
            }
          } catch (error) {
            console.log('使用默认用例:', error);
          }
      
          setCreationProgress(60);
          setDisplayProgress(60);
      
          // 更新数据
          setData(prev => ({
            ...(prev || initialData),
            id: token,
            useCases: {
              zh: useCases.zh || (prev?.useCases.zh || []),
              ja: useCases.ja || (prev?.useCases.ja || []),
              ko: useCases.ko || (prev?.useCases.ko || []),
              en: useCases.en || (prev?.useCases.en || [])
            }
          }));
      
          setCreationProgress(80);
          setDisplayProgress(80);
      
          // 准备完整数据
          const agentData = {
            name: formData.name,
            description: formData.description || "An Agent",
            category: 'AI Agent',
            capabilities: ['chat', 'information'],
            tokenAmount: '1000000000000000000',
            startTimestamp: getStartTimestamp(),
            durationHours: 24*7,
            rewardAmount: '2000000000000000000000000000',
            rewardToken: '0xabcdef123',
            symbol: formData.symbol || 'AGT',
            avatar: imageUrl || 'http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/LogoLift.png',
            type: 'AI Agent',
            marketCap: '$0',
            change24h: '0',
            tvl: '$0',
            holdersCount: 0,
            volume24h: '$0',
            statusJA: 'トランザクション可能',
            statusKO: '거래 가능',
            statusZH: '可交易',
            descriptionJA: formData.description || 'AIエージェントの説明',
            descriptionKO: formData.description || 'AI 에이전트 설명',
            descriptionZH: formData.description || 'AI智能体描述',
            detailDescription: formData.description || 'Detailed description of the AI agent',
            lifetime: '',
            totalSupply: 100000000000,
            marketCapTokenNumber: 100000000000,
            useCases: useCases.en,
            useCasesJA: useCases.ja,
            useCasesKO: useCases.ko,
            useCasesZH: useCases.zh,
            socialLinks: 'https://x.com/test, https://github.com/test, https://t.me/test',
            chatEntry: null,
            projectDescription: JSON.stringify({
              en: `1. Total Supply: ${formData.tokenSupply}\n2. ${formData.iaoPercentage} of tokens will be sold through IAO\n3. 14-day IAO period\n4. Trading pairs will be established on DBCSwap`,
              zh: `1. 总供应量: ${formData.tokenSupply}\n2. ${formData.iaoPercentage} 的代币将通过 IAO 销售\n3. 14天 IAO 期间\n4. 将在 DBCSwap 上建立交易对`,
              ja: `1. 総供給量: ${formData.tokenSupply}\n2. トークンの${formData.iaoPercentage}は IAO を通じて販売\n3. 14日間の IAO 期間\n4. DBCSwap に取引ペアを設立`,
              ko: `1. 総供給量: ${formData.tokenSupply}\n2. 토큰의 ${formData.iaoPercentage}는 IAO를 통해 판매\n3. 14일간의 IAO 기간\n4. DBCSwap에 거래쌍 설립`
            }),
            iaoTokenAmount: 20000000000,
            miningRate: '0.1%'
          };
      
          // 创建请求
          const createResponse = await fetch(`${API_BASE_URL}/api/agents/new`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(agentData)
          });
      
          if (!createResponse.ok) {
            throw new Error('创建失败');
          }
      
          const result = await createResponse.json();
          if (result.code === 200) {
            setCreationProgress(100);
            setDisplayProgress(100);
          }
        } catch (error) {
          console.error('创建失败:', error);
          setCreating(false);
          setCreationProgress(0);
          setDisplayProgress(0);
        } finally {
          setCreating(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/image', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.imageUrl) {
                setImageUrl(data.imageUrl);
            }
        } catch (error) {
            console.error('Image upload failed:', error);
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = () => {
        setImageUrl(null);
    };

    const TIME_OPTIONS = [
        { value: '7_hours', label: t("7hour") },
        { value: '24_hours', label: t("1day") },
        { value: '3_days', label: t("3day") },
        { value: '7_days', label: t("7day") },
        { value: '14_days', label: t("14day")},
        { value: '1_month', label: t("1month")}
    ];

    // Add this helper function to calculate timestamp
    const getStartTimestamp = () => {
        const now = Math.floor(Date.now() / 1000);
        switch (iaoStartTime) {
        case '7_hours': return now + 3600 * 7;
        case '24_hours': return now + 3600 * 24;
        case '3_days': return now + 3600 * 24 * 3;
        case '7_days': return now + 3600 * 24 * 7;
        case '14_days': return now + 3600 * 24 * 14;
        case '1_month': return now + 3600 * 24 * 30;
        default: return now + 3600 * 7 * 24; // default to 7 days
        }
    };

    const handleTimeSelect = (value: string) => {
        setIaoStartTime(value);
        setShowTimeOptions(false);
    };

    const CreationAnimation = () => {
        const circumference = 2 * Math.PI * 50;
        const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <svg width="120" height="120" viewBox="0 0 120 120" className="animate-pulse">
                    <circle cx="60" cy="60" r="50" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                    <circle cx="60" cy="60" r="50" stroke="#3B82F6" strokeWidth="8" fill="none"
                        strokeLinecap="round" strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset}
                        className="origin-center -rotate-90 transition-all duration-300" />
                    <g className="origin-center animate-spin" style={{ animationDuration: '4s' }}>
                        <path d="M40,60 A20,20 0 0,1 80,60" stroke="#10B981" strokeWidth="4" fill="none" />
                        <path d="M80,60 A20,20 0 0,1 40,60" stroke="#F59E0B" strokeWidth="4" fill="none" />
                    </g>
                    <circle cx="60" cy="60" r="6" fill="#3B82F6" />
                    <circle cx="30" cy="40" r="3" fill="#10B981">
                        <animate attributeName="cy" values="40;45;40" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="90" cy="80" r="3" fill="#F59E0B">
                        <animate attributeName="cx" values="90;85;90" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="70" cy="30" r="2" fill="#3B82F6">
                        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
                    </circle>
                </svg>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{formData.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                    {t("creationProcessMessage")}
                </p>
                <p className="text-sm font-medium text-primary">{displayProgress}%</p>
            </div>
        );
    };
    
    const SuccessDisplay = () => {
        if (!data) return null;
        return (
            <div className="bg-white dark:bg-[#161616] rounded-xl p-8 border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                        <svg className="w-24 h-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="absolute -inset-4 rounded-full bg-green-500 opacity-10 -z-10"></div>
                    </div>
                    <h2 className="text-2xl font-bold mt-6 text-center">{t("createSuccess")}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
                        {t("created")} <span className="font-mono text-primary">{data.id.substring(0,10)}</span>
                    </p>
                </div>
    
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t("agentDetails")}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t("projectName")}</p>
                                <p className="font-medium">{data.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t("createSymbol")}</p>
                                <p className="font-medium">{data.symbol}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t("projectDescription")}</p>
                                <p className="font-medium">{data.description}</p>
                            </div>
                        </div>
                    </div>
    
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {t("useCases")}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">English</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {data.useCases.en.map((useCase, index) => (
                                        <li key={`en-${index}`} className="text-sm">{useCase}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">日本語</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {data.useCases.ja.map((useCase, index) => (
                                        <li key={`ja-${index}`} className="text-sm">{useCase}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">한국어</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {data.useCases.ko.map((useCase, index) => (
                                        <li key={`ko-${index}`} className="text-sm">{useCase}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">中文</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {data.useCases.zh.map((useCase, index) => (
                                        <li key={`zh-${index}`} className="text-sm">{useCase}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
    
                <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {t('TokenDistribution.title')}
                </h3>
                <div className="space-y-3 text-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((point) => (
                    <p key={point}>
                        {point}. {t(`TokenDistribution.points.${point}`, { symbol:data.symbol })}
                    </p>
                    ))}
                </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => {
                            window.location.href=`/${locale}`
                        }}
                        className="mt-6 opacity-90 hover:opacity-100 bg-primary text-white font-medium py-3 px-6 rounded-lg transition-all"
                    >
                        {t("viewProject")}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed rounded-md inset-0 max-lg:max-h-[calc(100vh-130px)] lg:max-h-[calc(100vh-170px)] top-[70px] lg:top-[100px] flex justify-center items-start overflow-y-auto">
            <div className="w-[80vw] lg:w-[66vw] max-w-4xl rounded-md">
                {creating && !success ? (
                    <div className="bg-white dark:bg-[#161616] rounded-xl p-8 border border-black dark:border-white border-opacity-10 dark:border-opacity-10 flex flex-col items-center justify-center h-96">
                        <CreationAnimation />
                    </div>
                ) : success ? (
                    <SuccessDisplay />
                ) : (
                    <div className="bg-white dark:bg-[#161616] rounded-xl p-6 border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
                        <h1 className="text-2xl font-bold mb-6">{t("createAIProject")}</h1>

                        <div className="space-y-4">
                            <div>
                                <label className="block mb-1">{t("projectName")}</label>
                                <input
                                    name="name"
                                    ref={nameInputRef}
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("projectNamePlaceholder")}
                                />
                                {nameExists && (
                                    <div className="text-red-500 text-sm mt-1">{t("nameExists")}</div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="block mb-1">{t("createSymbol")}</label>
                                <input
                                    name="symbol"
                                    value={formData.symbol}
                                    onChange={handleSymbolChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("symbolRule")}
                                    minLength={3}
                                    maxLength={5}
                                    pattern="[A-Z]{3,5}"
                                />
                                {symbolExists && (
                                    <div className="text-red-500 text-sm mt-1">{t("symbolExists")}</div>
                                )}
                            </div>

                            <div>
                                <label className="block mb-1">{t("projectDescription")}</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("projectDescriptionPlaceholder")}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block mb-1">{t("tokenSupply")}</label>
                                    <input
                                        name="tokenSupply"
                                        value={formData.tokenSupply}
                                        onChange={handleChange}
                                        className="w-full bg-card-inner p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">{t("iaoPercentage")}</label>
                                    <input
                                        name="iaoPercentage"
                                        value={formData.iaoPercentage}
                                        onChange={handleChange}
                                        className="w-full bg-card-inner p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">{t("miningRate")}</label>
                                    <input
                                        name="miningRate"
                                        value={formData.miningRate}
                                        onChange={handleChange}
                                        className="w-full bg-card-inner p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block mb-1">{t("agentImage")}</label>
                                <div className="relative w-24 h-24">
                                    <label className={`absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-black dark:border-white border-opacity-20 dark:border-opacity-20 cursor-pointer hover:bg-opacity-5 dark:hover:bg-opacity-5 hover:bg-black dark:hover:bg-white transition-colors ${imageUrl ? 'opacity-0 hover:opacity-100 z-10' : ''}`}>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                        />
                                        {uploadingImage ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                                        ) : (
                                            <svg
                                                className="w-10 h-10 text-gray-500 dark:text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                />
                                            </svg>
                                        )}
                                    </label>
                                    {imageUrl && (
                                        <div className="absolute inset-0 rounded-md overflow-hidden group">
                                            <img
                                                src={imageUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={removeImage}
                                                className="absolute top-0 right-0 m-1 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dialog examples section */}
                            <div className="mt-6">
                                <h2 className="text-xl font-bold mb-4">{t("dialogModel")}</h2>

                                <div className="relative mb-8">
                                    <div className="flex items-center mb-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold mr-2">
                                            1
                                        </div>
                                        <h3 className="text-lg font-medium">{t("dialogExample")}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <textarea
                                                name="userFirst"
                                                value={formData.userFirst}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                                placeholder={t("userQuestion")}
                                            />
                                        </div>

                                        <div>
                                            <textarea
                                                name="agentFirst"
                                                value={formData.agentFirst}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                                placeholder={t("agentResponse")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative mb-8">
                                    <div className="flex items-center mb-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold mr-2">
                                            2
                                        </div>
                                        <h3 className="text-lg font-medium">{t("dialogExample")}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <textarea
                                                name="userSecond"
                                                value={formData.userSecond}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                                placeholder={t("userQuestion")}
                                            />
                                        </div>

                                        <div>
                                            <textarea
                                                name="agentSecond"
                                                value={formData.agentSecond}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                                placeholder={t("agentResponse")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative mb-8">
                                    <div className="flex items-center mb-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold mr-2">
                                            3
                                        </div>
                                        <h3 className="text-lg font-medium">{t("dialogExample")}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <textarea
                                                name="userThird"
                                                value={formData.userThird}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                                placeholder={t("userQuestion")}
                                            />
                                        </div>

                                        <div>
                                            <textarea
                                                name="agentThird"
                                                value={formData.agentThird}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                                placeholder={t("agentResponse")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={creating || !formData.name}
                                className="mt-6 w-full opacity-90 hover:opacity-100 bg-primary text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? t("creating") : t("createNow")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default New;