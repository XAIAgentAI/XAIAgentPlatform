import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";
import { authAPI, agentAPI, testDuplicateAgentCreation } from '@/services/createAgent';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateTimePicker } from '@/components/ui/time-range-picker';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOST_URL;
const New: React.FC = () => {
    const { open } = useAppKit();
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isManualConnecting, setIsManualConnecting] = useState(false);
    const { address, isConnected, status } = useAppKitAccount();
    const [connectingTimeout, setConnectingTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isTimeout, setIsTimeout] = useState(false);
    const { isAuthenticated, isLoading, error, authenticate } = useAuth()
    const router = useRouter();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [nameExists, setNameExists] = useState(false);
    const containerRef = useRef<HTMLInputElement>(null);
    const [containerShow, setContainerShow] = useState(false);
    const socialRef = useRef<HTMLInputElement>(null)
    const [symbolExists, setSymbolExists] = useState(false);
    const [socialExists, setSocialExists] = useState(false);
    const locale = useLocale();
    const t = useTranslations("create.createAgent");
    const [creating, setCreating] = useState(false);
    const [creationProgress, setCreationProgress] = useState(0);
    const [displayProgress, setDisplayProgress] = useState(0); // Separate state for smooth display
    const [success, setSuccess] = useState(false);
    const [dateRange, setDateRange] = useState<{ 
        range: { 
            from: Date; 
            to: Date | undefined 
        }; 
        rangeCompare?: { 
            from: Date; 
            to: Date | undefined 
        } 
    }>(() => {
        const now = new Date();
        const startDate = new Date(now);
        
        // 设置为当天的早上6点
        const hours = 6;
        startDate.setHours(hours, 0, 0, 0);
        
        // 计算结束日期（3天后的早上6点）
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 3);
        endDate.setHours(hours, 0, 0, 0);
        
        return {
            range: {
                from: startDate,
                to: endDate
            }
        };
    });
    const [sharedTimezone, setSharedTimezone] = useState('Asia/Shanghai');
    // Add new state for generating use cases
    const [generatingUseCases, setGeneratingUseCases] = useState(false);
    const [useCases, setUseCases] = useState<{
        en: string[];
        ja: string[];
        ko: string[];
        zh: string[];
    }>({
        en: [],
        ja: [],
        ko: [],
        zh: []
    });
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
        price: '',
        containerLink: '',
        socialLink: '',
        tokenSupply: '100000000000',
        iaoPercentage: '15%',
        miningRate: `${t("mining")}`,
        userFirst: '',
        userSecond: '',
        userThird: '',
    });

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const CheckWallet = () => {
        if(localStorage.getItem("@appkit/connection_status")==="connected"){
          return true;
        } else {
          handleWalletClick();
        }
    }
    
    // Function to generate use cases
    const generateUseCases = async () => {
        if (!formData.description) {
            alert(t("provideDescriptionFirst"));
            return;
        }

        setGeneratingUseCases(true);
        try {
            const response = await fetch('/api/chat/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: formData.description || "An Agent"
                })
            });
            
            if (response.ok) {
                const translatedCases = await response.json();
                setUseCases(translatedCases);
            } else {
                // Fallback to default cases if API fails
                setUseCases({
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
                });
            }
        } catch (error) {
            console.error('Error generating use cases:', error);
        } finally {
            setGeneratingUseCases(false);
        }
    };

    const currentLangUseCases = useCases[locale as keyof typeof useCases] || useCases.en;

    const handleWalletClick = () => {
        // 使用 address 判断是否已连接
        if (address) {
          open({ view: 'Account' });
        } else {
          // 如果当前状态是connecting，先重置状态
          if (status === 'connecting') {
            if (connectingTimeout) {
              clearTimeout(connectingTimeout);
              setConnectingTimeout(null);
            }
            setIsTimeout(false);
          }
          setIsManualConnecting(true);
          open({ view: 'Connect' });
        }
        setIsMenuOpen(false);
    }  

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
        const validatedValue = uppercaseValue.slice(0, 6);
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
        //检查是否需要连接钱包
        if(!CheckWallet()){
            return;
        }

        //检查https满足否
        const href1 = socialRef.current?.value;
        const href2 = containerRef.current?.value;
        if(href1){
            if(!href1.startsWith('https://')){
                setSocialExists(true);
                socialRef.current?.scrollIntoView({behavior:"smooth",block:"center"});
                return;
            }
        }
        if(href2){
            if(!href2.startsWith('https://')){
                setContainerShow(true);
                containerRef.current?.scrollIntoView({behavior:"smooth",block:"center"});
                return;
            }
        }
        setSocialExists(false)
        setContainerShow(false)

        // 检查是否已存在名字
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
      
          const finalUseCases = currentLangUseCases.length > 0 ? useCases : {
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
      
          setCreationProgress(60);
          setDisplayProgress(60);
      
          // 准备完整数据
          const agentData = {
            name: formData.name,
            description: formData.description || "An Agent",
            category: 'AI Agent',
            capabilities: ['chat', 'information'],
            tokenAmount: '1000000000000000000',
            startTimestamp: Math.floor(dateRange.range.from.getTime() / 1000),
            // endTimestamp: dateRange.range.to 
            //   ? Math.floor(dateRange.range.to.getTime() / 1000) 
            //   : Math.floor(dateRange.range.from.getTime() / 1000) + 24 * 60 * 60 * 7,
            durationHours: dateRange.range.to ? Math.floor((dateRange.range.to.getTime() - dateRange.range.from.getTime()) / (1000 * 60 * 60)) : 24 * 3,
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
            useCases: finalUseCases.en,
            useCasesJA: finalUseCases.ja,
            useCasesKO: finalUseCases.ko,
            useCasesZH: finalUseCases.zh,
            socialLinks: formData.socialLink || 'https://x.com/test, https://github.com/test, https://t.me/test',
            chatEntry: null,
            projectDescription: JSON.stringify({
              en: `1. Total Supply: ${formData.tokenSupply}\n2. ${formData.iaoPercentage} of tokens will be sold through IAO\n3. Project Duration: ${Math.floor((dateRange.range.to?.getTime() || (dateRange.range.from.getTime() + 24 * 60 * 60 * 7 * 1000)) - dateRange.range.from.getTime()) / (24 * 60 * 60 * 1000)} days\n4. Trading pairs will be established on DBCSwap`,
              zh: `1. 总供应量: ${formData.tokenSupply}\n2. ${formData.iaoPercentage} 的代币将通过 IAO 销售\n3. 项目持续时间: ${Math.floor((dateRange.range.to?.getTime() || (dateRange.range.from.getTime() + 24 * 60 * 60 * 7 * 1000)) - dateRange.range.from.getTime()) / (24 * 60 * 60 * 1000)} 天\n4. 将在 DBCSwap 上建立交易对`,
              ja: `1. 総供給量: ${formData.tokenSupply}\n2. トークンの${formData.iaoPercentage}は IAO を通じて販売\n3. プロジェクト期間: ${Math.floor((dateRange.range.to?.getTime() || (dateRange.range.from.getTime() + 24 * 60 * 60 * 7 * 1000)) - dateRange.range.from.getTime()) / (24 * 60 * 60 * 1000)} 日間\n4. DBCSwap に取引ペアを設立`,
              ko: `1. 総供給量: ${formData.tokenSupply}\n2. 토큰의 ${formData.iaoPercentage}는 IAO를 통해 판매\n3. 프로젝트 기간: ${Math.floor((dateRange.range.to?.getTime() || (dateRange.range.from.getTime() + 24 * 60 * 60 * 7 * 1000)) - dateRange.range.from.getTime()) / (24 * 60 * 60 * 1000)} 일\n4. DBCSwap에 거래쌍 설립`
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

          setCreationProgress(80);
          setDisplayProgress(80);
      
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
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleExChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, name, value } = e.target;
        
        // Update useCases - set the item at index (parseInt(id)) in the locale array to value
        setUseCases(prev => {
            // Make sure the locale array exists or provide a default empty array
            const currentLocaleArray = prev[locale as keyof typeof prev] || [];
            
            // Create a new array with the updated value at the specified index
            const updatedArray = [...currentLocaleArray];
            const index = parseInt(id.substring(0,1))-1;
            updatedArray[index] = value;
            
            // Return the new state with the updated array
            return {
                ...prev,
                [locale]: updatedArray
            };
        });
        
        // Update formData as before
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



    // 当时区改变时，保持选择的小时数不变
    const handleTimezoneChange = (newTimezone: string) => {
        setSharedTimezone(newTimezone);
        
        // 保持原始选择的小时数
        const fromHours = dateRange.range.from.getHours();
        const fromMinutes = dateRange.range.from.getMinutes();
        const newStartDate = new Date(dateRange.range.from);
        newStartDate.setHours(fromHours, fromMinutes, 0, 0);
        
        const toHours = dateRange.range.to ? dateRange.range.to.getHours() : fromHours;
        const toMinutes = dateRange.range.to ? dateRange.range.to.getMinutes() : fromMinutes;
        const newEndDate = new Date(dateRange.range.to || newStartDate);
        newEndDate.setHours(toHours, toMinutes, 0, 0);
        
        setDateRange(prev => ({
            ...prev,
            range: {
                from: newStartDate,
                to: newEndDate
            }
        }));
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
                        {point}. {t(`TokenDistribution.points.${point}`, { symbol: data.symbol })}
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

                        <div className="space-y-1">
                            <div className="mb-2">
                                <label className="block mb-1">{t("projectName")}</label>
                                <input
                                    name="name"
                                    ref={nameInputRef}
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("projectNamePlaceholder")}
                                />
                                {nameExists && (
                                    <div className="text-red-500 text-sm mt-1">{t("nameExists")}</div>
                                )}
                            </div>

                            <div className="space-y-1 pb-2">
                                <label className="block">{t("createSymbol")}</label>
                                <input
                                    name="symbol"
                                    value={formData.symbol}
                                    onChange={handleSymbolChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("symbolRule")}
                                    minLength={3}
                                    maxLength={6}
                                    pattern="[A-Z]{3,6}"
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
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg h-16 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("projectDescriptionPlaceholder")}
                                />
                            </div>

                            <div className="pb-2">
                                <label className="block mb-1">{t("price")}</label>
                                <div className="relative">
                                    <div className="flex items-center bg-white dark:bg-[#1a1a1a] p-2 rounded-lg border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
                                        <input
                                            name="price"
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.price}
                                            onChange={(e) => {
                                                // Only allow numbers
                                                const value = e.target.value.replace(/[^0-9.]/g, '').replace(/^\./g, '').replace(/\.+/g, '.');
                                                setFormData(prev => ({ ...prev, price: value }));
                                            }}
                                            className="flex-1 bg-transparent focus:outline-none min-w-0"
                                            placeholder="0"
                                        />
                                        <div className="ml-2 bg-gray-100 dark:bg-card-inner opacity-75 rounded-full px-3 py-1 text-sm whitespace-nowrap">
                                            {formData.symbol || "TOKEN"} / {t("time")}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block mb-1">{t("tokenSupply")}</label>
                                    <input
                                        name="tokenSupply"
                                        value={formData.tokenSupply}
                                        onChange={handleChange}
                                        className="w-full bg-card-inner p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">{t("miningRate")}</label>
                                    <input
                                        name="miningRate"
                                        value={formData.miningRate}
                                        onChange={handleChange}
                                        className="w-full bg-card-inner p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">{t("iaoPercentage")}</label>
                                    <input
                                        name="iaoPercentage"
                                        value={formData.iaoPercentage}
                                        onChange={handleChange}
                                        className="w-full bg-card-inner p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="py-2 flex flex-col space-y-1">
                                <label className="block">{t("container")}</label>
                                <input
                                    name="containerLink"
                                    ref={containerRef}
                                    value={formData.containerLink}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                </input>
                                {containerShow && (
                                    <div className="text-red-500 text-sm mt-1">{t("socialExists")}</div>
                                )}
                            </div>

                            <div className="py-2 flex flex-col space-y-1">
                            <label className="block">{t("socialLink")}</label>
                            <input
                                name="socialLink"
                                ref={socialRef}
                                value={formData.socialLink}
                                onChange={handleChange}
                                className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed placeholder:opacity-50 placeholder:text-transparent"
                                placeholder="X Telegram"
                                style={{
                                backgroundImage: !formData.socialLink ? `
                                    url('data:image/svg+xml;utf8,<svg width="20" height="20" viewBox="0 0 24 24" fill="gray" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'),
                                    url('data:image/svg+xml;utf8,<svg width="20" height="20" viewBox="0 0 24 24" fill="gray" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>')
                                ` : 'none',
                                backgroundPosition: !formData.socialLink ? '10px center, 35px center' : 'unset',
                                backgroundRepeat: 'no-repeat'
                                }}
                            />
                            {socialExists && (
                                <div className="text-red-500 text-sm mt-1">{t("socialExists")}</div>
                            )}
                            </div>

                            <div className="mt-4 pb-8">
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
                                                    strokeWidth={1}
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

                            <div className="py-2 flex flex-col space-y-1">
                                <label className="block">{t("startTime")}</label>
                                <DateTimePicker
                                    value={dateRange.range.from}
                                    onChange={(timestamp: number) => {
                                        const date = new Date(timestamp);
                                        setDateRange(prev => ({
                                            ...prev,
                                            range: {
                                                ...prev.range,
                                                from: date
                                            }
                                        }));
                                    }}
                                    timezone={sharedTimezone}
                                    onTimezoneChange={handleTimezoneChange}
                                />
                            </div>

                            <div className="py-2 flex flex-col space-y-1">
                                <label className="block">{t("endTime")}</label>
                                <DateTimePicker
                                    value={dateRange.range.to || new Date(dateRange.range.from.getTime() + 3 * 24 * 60 * 60 * 1000)}
                                    onChange={(timestamp: number) => {
                                        const date = new Date(timestamp);
                                        setDateRange(prev => ({
                                            ...prev,
                                            range: {
                                                ...prev.range,
                                                to: date
                                            }
                                        }));
                                    }}
                                    timezone={sharedTimezone}
                                    onTimezoneChange={handleTimezoneChange}
                                    showTimezone={false}
                                />
                            </div>

                            {/* Dialog examples section */}
                            <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{t("dialogExample")}</h2>
                            <button
                                onClick={generateUseCases}
                                disabled={generatingUseCases || !formData.description}
                                className="flex items-center space-x-2 bg-primary bg-opacity-10 hover:bg-opacity-20 dark:bg-opacity-20 dark:hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{t("generateExamples")}</span>
                            </button>
                        </div>

                        {/* Example 1 */}
                        <div className="relative mb-8">
                            <div className="flex items-center mb-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold mr-2">
                                    1
                                </div>
                                <h3 className="text-lg font-medium">{t("eg1")}</h3>
                            </div>
                            <textarea
                                id="11111"
                                name="userFirst"
                                onChange={handleExChange}
                                value={currentLangUseCases[0] || ''}
                                className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                placeholder=""
                            />
                        </div>

                        {/* Example 2 */}
                        <div className="relative mb-8">
                            <div className="flex items-center mb-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold mr-2">
                                    2
                                </div>
                                <h3 className="text-lg font-medium">{t("eg2")}</h3>
                            </div>
                            <textarea
                                id="22222"
                                name="userSecond"
                                onChange={handleExChange}
                                value={currentLangUseCases[1] || ''}
                                className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                placeholder=""
                            />
                        </div>

                        {/* Example 3 */}
                        <div className="relative mb-8">
                            <div className="flex items-center mb-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold mr-2">
                                    3
                                </div>
                                <h3 className="text-lg font-medium">{t("eg3")}</h3>
                            </div>
                            <textarea
                                id="33333"
                                name="userThird"
                                onChange={handleExChange}
                                value={currentLangUseCases[2] || ''}
                                className="w-full bg-white dark:bg-[#1a1a1a] p-2 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                placeholder=""
                            />
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