'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { config } from '@/lib/config';
import { TokenDistributionInfo } from '@/components/ui-custom/token-distribution-info';

import { toast } from '@/components/ui/use-toast';
import { getExplorerUrl } from '@/config/networks';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOST_URL;

interface NewProps {
    mode?: 'create' | 'edit';
    agentId?: string;
}

const New: React.FC<NewProps> = ({ mode = 'create', agentId }) => {
    const { open } = useAppKit();
    const [isManualConnecting, setIsManualConnecting] = useState(false);
    const { address, isConnected, status } = useAppKitAccount();
    const [connectingTimeout, setConnectingTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isTimeout, setIsTimeout] = useState(false);
    const { isAuthenticated, isLoading, error, authenticate } = useAuth()
    const router = useRouter();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const symbolInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const logoInputRef = useRef<HTMLDivElement>(null);
    const startTimeInputRef = useRef<HTMLDivElement>(null);
    const iaoDurationInputRef = useRef<HTMLDivElement>(null);
    const [nameExists, setNameExists] = useState(false);
    const containerRef = useRef<HTMLInputElement>(null);
    const [containerShow, setContainerShow] = useState(false);
    const twitterRef = useRef<HTMLInputElement>(null)
    const telegramRef = useRef<HTMLInputElement>(null)
    const [symbolExists, setSymbolExists] = useState(false);
    const [twitterError, setTwitterError] = useState(false);
    const [telegramError, setTelegramError] = useState(false);

    // 必填字段错误状态
    const [nameError, setNameError] = useState(false);
    const [symbolError, setSymbolError] = useState(false);
    const [descriptionError, setDescriptionError] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [startTimeError, setStartTimeError] = useState(false);
    const [iaoDurationError, setIaoDurationError] = useState(false);
    const locale = useLocale();
    const t = useTranslations("create.createAgent");
    const tMessages = useTranslations('messages');
    const [creating, setCreating] = useState(false);

    // 错误消息映射函数
    const getLocalizedErrorMessage = (serverMessage: string) => {
        const errorMappings: { [key: string]: string } = {
            '缺少必填字段': tMessages('missingRequiredFields'),
            'Agent 名称已存在': tMessages('agentNameExists'),
            'Agent Symbol 已存在': tMessages('agentSymbolExists'),
            'startTimestamp 必须是正整数': tMessages('invalidStartTimestamp'),
            'durationHours 必须是正数': tMessages('invalidDurationHours'),
            '无效的 token': tMessages('invalidToken'),
            '未授权访问': tMessages('unauthorizedAccess'),
            '每个钱包地址只能创建一个 Agent': tMessages('walletLimitOneAgent'),
            // 英文错误消息映射
            'Missing required fields': tMessages('missingRequiredFields'),
            'Agent name already exists': tMessages('agentNameExists'),
            'Agent symbol already exists': tMessages('agentSymbolExists'),
            'Invalid token': tMessages('invalidToken'),
            'Unauthorized access': tMessages('unauthorizedAccess'),
            'Each wallet address can only create one Agent': tMessages('walletLimitOneAgent'),
        };

        return errorMappings[serverMessage] || serverMessage;
    };
    const [creationProgress, setCreationProgress] = useState(0);
    const [displayProgress, setDisplayProgress] = useState(0); // Separate state for smooth display
    const [success, setSuccess] = useState(false);

    // IAO 时间输入状态
    const [iaoStartDays, setIaoStartDays] = useState<number>(config.iao.defaultStartDays);
    const [iaoStartHours, setIaoStartHours] = useState<number>(config.iao.defaultStartHours);
    const [iaoDurationDays, setIaoDurationDays] = useState<number>(config.iao.defaultDurationDays);
    const [iaoDurationHours, setIaoDurationHours] = useState<number>(config.iao.defaultDurationHours);
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
        // 设置开始时间为当前时间+最小延迟时间
        const startDate = new Date(now.getTime() + config.iao.minStartDelayHours * 60 * 60 * 1000);

        // 计算结束日期（开始时间+默认持续时间）
        const defaultDurationHours = config.iao.defaultDurationDays * 24 + config.iao.defaultDurationHours;
        const endDate = new Date(startDate.getTime() + defaultDurationHours * 60 * 60 * 1000);

        return {
            range: {
                from: startDate,
                to: endDate
            }
        };
    });

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
        containerLink: '',
        twitterLink: '',
        telegramLink: '',
        tokenSupply: '100000000000',
        iaoPercentage: '15%',
        miningRate: '5', // 默认每年可挖矿5%的总供应量
        userFirst: '',
        userSecond: '',
        userThird: '',
    });

    // 添加一个用于防抖的ref
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 移除直接保存表单数据的函数，只使用防抖保存

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [iaoContractAddress, setIaoContractAddress] = useState<string | null>(null);

    // 自动计算 IAO 开始和结束时间
    useEffect(() => {
        const now = new Date();
        const startTime = new Date(now.getTime() + (iaoStartDays * 24 + iaoStartHours) * 60 * 60 * 1000);
        const durationInHours = iaoDurationDays * 24 + iaoDurationHours;
        const endTime = new Date(startTime.getTime() + durationInHours * 60 * 60 * 1000);

        setDateRange(prev => ({
            ...prev,
            range: {
                from: startTime,
                to: endTime
            }
        }));
    }, [iaoStartDays, iaoStartHours, iaoDurationDays, iaoDurationHours]);

    // 从localStorage加载表单数据
    useEffect(() => {
        // 只有在创建模式下才从localStorage加载数据
        if (mode === 'create') {
            try {
                const savedFormData = localStorage.getItem('ai_model_form_data');
                if (savedFormData) {
                    const parsedData = JSON.parse(savedFormData);
                    setFormData(parsedData);
                    
                    // 如果有图片URL，也恢复它
                    if (parsedData.imageUrl) {
                        setImageUrl(parsedData.imageUrl);
                    }
                    
                    // 恢复日期范围
                    if (parsedData.dateRange) {
                        const savedRange = parsedData.dateRange;
                        setDateRange({
                            range: {
                                from: new Date(savedRange.from),
                                to: savedRange.to ? new Date(savedRange.to) : undefined
                            }
                        });
                    }
                    
                    // 恢复用例数据
                    if (parsedData.useCases) {
                        setUseCases(parsedData.useCases);
                    }
                }
            } catch (error) {
                console.error('Error loading form data from localStorage:', error);
            }
        }
    }, [mode]);

    // 当表单数据变化时保存到localStorage (防抖处理)
    useEffect(() => {
        // 只有在创建模式下才保存到localStorage
        if (mode === 'create') {
            // 清除之前的计时器
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            
            // 设置新的防抖计时器，延迟300ms保存数据
            debounceTimerRef.current = setTimeout(() => {
                try {
                    const dataToSave = {
                        ...formData,
                        imageUrl,
                        dateRange: {
                            from: dateRange.range.from?.toISOString(),
                            to: dateRange.range.to?.toISOString()
                        },
                        useCases
                    };
                    console.log('保存表单数据到localStorage:', formData.name, formData.symbol);
                    localStorage.setItem('ai_model_form_data', JSON.stringify(dataToSave));
                } catch (error) {
                    console.error('Error saving form data to localStorage:', error);
                }
            }, 300); // 改为300ms的防抖时间，提供更好的响应性
        }
        
        return () => {
            // 组件卸载时清除计时器
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [formData, imageUrl, dateRange, useCases, mode]);

    // 修改 useEffect，确保只在真正成功后才清除localStorage
    useEffect(() => {
        // 只有在创建成功后才清除localStorage，而不是每次刷新页面
        if (success && mode === 'create') {
            localStorage.removeItem('ai_model_form_data');
            console.log('创建成功，已清除表单缓存数据');
        }
    }, [success, mode]);

    const CheckWallet = () => {
        if (localStorage.getItem("@appkit/connection_status") === "connected") {
            return true;
        } else {
            handleWalletClick();
        }
    }

    // 验证必填字段并滚动到第一个错误字段
    const validateRequiredFields = () => {
        // 重置所有错误状态
        setNameError(false);
        setSymbolError(false);
        setDescriptionError(false);
        setLogoError(false);
        setStartTimeError(false);
        setIaoDurationError(false);

        // 按顺序验证字段：AI模型项目名称 → 代币符号 → AI模型描述 → 代币Logo → 开始时间 → IAO持续时间

        // 1. AI模型项目名称
        if (!formData.name.trim()) {
            setNameError(true);
            nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            nameInputRef.current?.focus();
            return false;
        }

        // 2. 代币符号
        if (!formData.symbol.trim()) {
            setSymbolError(true);
            symbolInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            symbolInputRef.current?.focus();
            return false;
        }

        // 3. AI模型描述
        if (!formData.description.trim()) {
            setDescriptionError(true);
            descriptionInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            descriptionInputRef.current?.focus();
            return false;
        }

        // 4. 代币Logo
        if (!imageUrl) {
            setLogoError(true);
            logoInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }

        // 5. 开始时间 (仅在创建模式下验证)
        if (mode !== 'edit' && !dateRange.range.from) {
            setStartTimeError(true);
            startTimeInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }

        // 6. 验证开始时间是否至少为24小时后 (仅在创建模式下验证)
        if (mode !== 'edit') {
            const totalStartHours = iaoStartDays * 24 + iaoStartHours;
            if (totalStartHours < 24) {
                setStartTimeError(true);
                startTimeInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                return false;
            }
        }

        // 7. IAO持续时间验证 (仅在创建模式下验证)
        if (mode !== 'edit') {
            const totalDurationHours = iaoDurationDays * 24 + iaoDurationHours;
            // 持续时间必须在配置的最小和最大值之间
            if (totalDurationHours < config.iao.minDurationHours || totalDurationHours > config.iao.maxDurationHours) {
                setIaoDurationError(true);
                iaoDurationInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                return false;
            }
            // 特殊情况：如果是最小天数，必须至少达到最小小时数
            if (iaoDurationDays === Math.floor(config.iao.minDurationHours / 24) && 
                iaoDurationHours === 0 && 
                totalDurationHours < config.iao.minDurationHours) {
                setIaoDurationError(true);
                iaoDurationInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                return false;
            }
        }

        return true;
    }


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
        // Menu closed
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



    // 修改handleNameChange，移除直接保存逻辑
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const validateValue = value.replace(/[^A-Za-z ]/g, '').slice(0, 20);
        
        // 使用函数式更新确保是新的引用对象
        setFormData(prev => {
            const updated = { ...prev, name: validateValue };
            return updated;
        });
        
        // 清除错误状态
        if (nameError && validateValue.trim()) {
            setNameError(false);
        }
    };

    // 修改handleSymbolChange，移除直接保存逻辑
    const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const uppercaseValue = value.toUpperCase().replace(/[^A-Z]/g, '');
        const validatedValue = uppercaseValue.slice(0, 6);
        
        // 使用函数式更新确保是新的引用对象
        setFormData(prev => {
            const updated = { ...prev, symbol: validatedValue };
            return updated;
        });
        
        // 清除错误状态
        if (symbolError && validatedValue.trim()) {
            setSymbolError(false);
        }
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

    const [isTranslationLoading, setIsTranslationLoading] = useState(false);
    const [translatedDescription, setTranslatedDescription] = useState<{ zh?: string; en?: string; jp?: string }>({});
    const [translationError, setTranslationError] = useState<string | null>(null);

    // 修改描述输入处理，自动请求翻译
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, description: value }));
    };

    // 修改handleCreate，创建时校验翻译状态
    const handleCreate = async () => {
        setIsTranslationLoading(true);
        setTranslationError(null);
        try {
            // 1. 请求翻译接口
            const res = await fetch('/api/chat/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: formData.description,
                    targetLanguages: ['zh', 'en', 'ja', 'ko']
                })
            });
            // if (!res.ok) {
                setIsTranslationLoading(false);
                // setTranslationError('翻译失败，请稍后重试');
                // toast({ variant: 'destructive', description: '翻译失败，请稍后重试' });
                // return;
            // }
            const data = await res.json();
            setTranslatedDescription(data);
            setIsTranslationLoading(false);
            // 2. 翻译成功后，继续后续创建流程
            // 检查必填字段
            if (!validateRequiredFields()) {
                return;
            }
            // 检查钱包连接
            if (!CheckWallet()) {
                return;
            }
            // 设置创建中状态
            setCreating(true);
            setCreationProgress(0);
            setDisplayProgress(0);

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
                    // id: agentId || '',
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
                    containerLink: '', // 容器链接在创建时不填写，后续在详情页面由创建者添加
                    description: translatedDescription.zh || "An Agent", // 使用翻译后的描述
                    category: 'AI Agent',
                    capabilities: ['chat', 'information'],
                    tokenAmount: '1000000000000000000',
                    startTimestamp: Math.floor(dateRange.range.from.getTime() / 1000),
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
                    descriptionJA: translatedDescription.jp || 'AIエージェントの説明',
                    descriptionKO: translatedDescription.zh || 'AI 에이전트 설명',
                    descriptionZH: translatedDescription.zh || 'AI代理描述',
                    // 添加社交链接
                    socialLinks: [
                        formData.twitterLink ? formData.twitterLink : '',
                        formData.telegramLink ? formData.telegramLink : '',
                    ].filter(Boolean).join(','),
                    totalSupply: formData.tokenSupply 
                };

                // 仅在编辑模式下添加对话示例字段
                if (mode === 'edit') {
                    // 添加对话示例字段
                    (agentData as any).useCases = finalUseCases.en;
                    (agentData as any).useCasesJA = finalUseCases.ja;
                    (agentData as any).useCasesKO = finalUseCases.ko;
                    (agentData as any).useCasesZH = finalUseCases.zh;
                    
                    // 添加时间更新信息
                    console.log('[时间更新] 添加时间更新信息到请求...');
                    console.log(`[时间更新] 开始时间: ${Math.floor(dateRange.range.from.getTime() / 1000)}`);
                    console.log(`[时间更新] 结束时间: ${Math.floor((dateRange.range.to?.getTime() || dateRange.range.from.getTime() + 24 * 60 * 60 * 3 * 1000) / 1000)}`);

                    // 使用as any类型断言解决TypeScript错误
                    (agentData as any).updateStartTime = Math.floor(dateRange.range.from.getTime() / 1000);
                    (agentData as any).updateEndTime = Math.floor((dateRange.range.to?.getTime() || dateRange.range.from.getTime() + 24 * 60 * 60 * 3 * 1000) / 1000);
                }

                // 根据模式选择不同的 API 端点
                const endpoint = mode === 'edit'
                    ? `/api/agents/${agentId}`
                    : '/api/agents/new';

                const method = mode === 'edit' ? 'PUT' : 'POST';

                const createResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify(agentData)
                });

                setCreationProgress(80);
                setDisplayProgress(80);

                // 解析响应
                const result = await createResponse.json();

                if (!createResponse.ok) {
                    console.error("API错误:", result);

                    // 获取本地化的错误消息
                    let errorMessage = mode === 'edit' ? t("updateFailed") : t("createFailed");
                    
                    // 特殊处理错误代码 4001 - 一个钱包只能创建一个 agent
                    if (result.code === 4001) {
                        errorMessage = tMessages('walletLimitOneAgent');
                    } else if (result.message) {
                        errorMessage = getLocalizedErrorMessage(result.message);
                    }

                    toast({
                        variant: "destructive",
                        description: errorMessage,
                    });

                    setCreating(false);
                    setCreationProgress(0);
                    setDisplayProgress(0);
                    return;
                }

                // 成功处理
                if (result.code === 200) {
                    setCreationProgress(100);
                    setDisplayProgress(100);

                    // 如果是创建模式，更新data状态中的agent ID
                    if (mode === 'create' && result.data?.agentId) {
                        setData(prev => ({
                            ...(prev || {
                                name: formData.name,
                                symbol: formData.symbol,
                                description: formData.description,
                                useCases: { zh: [], en: [], ko: [], ja: [] }
                            }),
                            id: result.data?.agentId
                        }));
                        

                    }

                    // 更新成功后，如果是编辑模式，可以直接跳转回详情页
                    if (mode === 'edit') {
                        setTimeout(() => {
                            router.push(`/${locale}/agent-detail/${agentId}`);
                        }, 2000);
                    }
                }
            } catch (error) {
                console.error(mode === 'edit' ? '更新失败:' : '创建失败:', error);
                setCreating(false);
                setCreationProgress(0);
                setDisplayProgress(0);

                // 显示本地化的错误toast
                let errorMessage = mode === 'edit' ? t("updateFailed") : t("createFailed");
                if (error instanceof Error) {
                    errorMessage = getLocalizedErrorMessage(error.message);
                }

                toast({
                    variant: "destructive",
                    description: errorMessage,
                });
            } finally {
            }
        } catch (error) {
            setIsTranslationLoading(false);
            setTranslationError('翻译失败，请稍后重试');
            toast({ variant: 'destructive', description: '翻译失败，请稍后重试' });
            return;
        }
    };

    // 修改handleChange，移除直接保存逻辑
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // 使用函数式更新确保是新的引用对象
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            return updated;
        });

        // 清除对应字段的错误状态
        if (name === 'description' && descriptionError && value.trim()) {
            setDescriptionError(false);
        }
    };

    // 修改handleExChange，移除直接保存逻辑
    const handleExChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, name, value } = e.target;

        // Update useCases - set the item at index (parseInt(id)) in the locale array to value
        setUseCases(prev => {
            // Make sure the locale array exists or provide a default empty array
            const currentLocaleArray = prev[locale as keyof typeof prev] || [];

            // Create a new array with the updated value at the specified index
            const updatedArray = [...currentLocaleArray];
            const index = parseInt(id.substring(0, 1)) - 1;
            updatedArray[index] = value;

            // Return the new state with the updated array
            return {
                ...prev,
                [locale]: updatedArray
            };
        });

        // Update formData as before
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            return updated;
        });
    };

    // 修改handleImageUpload，移除直接保存逻辑
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
                // 清除Logo错误状态
                if (logoError) {
                    setLogoError(false);
                }
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
                        {t("created")} <span className="font-mono text-primary">{data.id.substring(0, 10)}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1  gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t("agentDetails")}
                        </h3>
                        <div className=" grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
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

               
                </div>

                <div className="bg-gray-50 dark:bg-[#1a1a1a] p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {t('TokenDistribution.title')}
                    </h3>
                    <TokenDistributionInfo 
                        symbol={formData.symbol} 
                        hours={iaoDurationDays * 24 + iaoDurationHours} 
                        textSize="sm"
                    />
                </div>



                <div className="flex justify-center">
                    <button
                        onClick={() => {
                            router.push(`/${locale}/agent-detail/${data.id}`)
                        }}
                        className="mt-6 opacity-90 hover:opacity-100 bg-primary text-white font-medium py-3 px-6 rounded-lg transition-all"
                    >
                        {t("viewProject")}
                    </button>
                </div>
            </div>
        );
    };

    // 添加获取现有 agent 数据的逻辑
    useEffect(() => {
        const fetchAgentData = async () => {
            if (mode === 'edit' && agentId) {
                try {
                    const response = await fetch(`/api/agents/${agentId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch agent data');
                    }
                    const result = await response.json();

                    if (result.code !== 200 || !result.data) {
                        throw new Error(result.message || 'Failed to fetch agent data');
                    }

                    const agentData = result.data;

                    // 保存IAO合约地址
                    setIaoContractAddress(agentData.iaoContractAddress || null);

                    // 解析社交链接
                    const socialLinks = agentData.socialLinks || '';
                    const links = socialLinks.split(',').map((link: string) => link.trim());
                    const twitterLink = links.find((link: string) => link.includes('x.com') || link.includes('twitter.com')) || '';
                    const telegramLink = links.find((link: string) => link.includes('t.me') || link.includes('telegram')) || '';

                    // 设置表单数据
                    setFormData({
                        name: agentData.name || '',
                        symbol: agentData.symbol || '',
                        description: agentData.description || '',
                        containerLink: agentData.containerLink ? agentData.containerLink.replace('https://', '') : '',  // 移除https://前缀
                        twitterLink: twitterLink,
                        telegramLink: telegramLink,
                        tokenSupply: agentData.totalSupply?.toString() || '100000000000',
                        iaoPercentage: '15%',
                        miningRate: '5', // 默认每年可挖矿5%的总供应量
                        userFirst: '',
                        userSecond: '',
                        userThird: '',
                    });

                    // 设置用例数据
                    try {
                        setUseCases({
                            en: agentData.useCases ? JSON.parse(agentData.useCases) : [],
                            ja: agentData.useCasesJA ? JSON.parse(agentData.useCasesJA) : [],
                            ko: agentData.useCasesKO ? JSON.parse(agentData.useCasesKO) : [],
                            zh: agentData.useCasesZH ? JSON.parse(agentData.useCasesZH) : [],
                        });
                    } catch (e) {
                        console.error('Error parsing use cases:', e);
                        // 如果解析失败，使用空数组
                        setUseCases({
                            en: [],
                            ja: [],
                            ko: [],
                            zh: []
                        });
                    }

                    // 设置图片
                    if (agentData.avatar) {
                        setImageUrl(agentData.avatar);
                    }

                    // 设置开始和结束时间（从时间戳转换）
                    if (agentData.iaoStartTime) {
                        const startDate = new Date(Number(agentData.iaoStartTime) * 1000);
                        const endDate = agentData.iaoEndTime ? new Date(Number(agentData.iaoEndTime) * 1000) : new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

                        setDateRange({
                            range: {
                                from: startDate,
                                to: endDate
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching agent data:', error);
                    toast({
                        description: t("fetchError"),
                    });
                }
            }
        };

        fetchAgentData();
    }, [mode, agentId, t]);

    // 构建区块链浏览器链接
    const getBlockExplorerUrl = () => {
        const baseUrl = getExplorerUrl();
        const lang = locale || 'en';

        if (iaoContractAddress && mode === 'edit') {
            return `${baseUrl}/${lang}/address/${iaoContractAddress}?tab=write_proxy`;
        }

        return `${baseUrl}/${lang}`;
    };

    return (
        <div className="rounded-md inset-0 flex justify-center items-start px-4 sm:px-0">
            <div className="w-full sm:w-[80vw] lg:w-[66vw] max-w-4xl rounded-md">
                {creating && !success ? (
                    <div className="bg-white dark:bg-[#161616] rounded-xl p-8 border border-black dark:border-white border-opacity-10 dark:border-opacity-10 flex flex-col items-center justify-center h-96">
                        <CreationAnimation />
                    </div>
                ) : success ? (
                    <SuccessDisplay />
                ) : (
                    <div className="bg-white dark:bg-[#161616] rounded-xl p-4 sm:p-6 border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
                        <div className="mb-6">
                            {/* 桌面端：水平布局 */}
                            <div className="hidden sm:flex sm:items-center sm:justify-between mb-2">
                                <h1 className="text-2xl font-bold">
                                    {mode === 'edit' ? t("editAIModelProject") : t("createAIModelProject")}
                                </h1>
                                <button
                                    onClick={() => window.open(`/${locale}/create-guide`, '_blank')}
                                    className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    {t("viewGuide")}
                                </button>
                            </div>

                            {/* 移动端：垂直布局 */}
                            <div className="sm:hidden">
                                <h1 className="text-xl font-bold mb-2">
                                    {mode === 'edit' ? t("editAIModelProject") : t("createAIModelProject")}
                                </h1>

                                {/* 免费创建提示 - 移动端 */}
                                {mode === 'create' && (
                                    <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center mb-3">
                                        <svg className="w-4 h-4 text-gray-500 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {t("freeCreationNotice")}
                                    </p>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => window.open(`/${locale}/create-guide`, '_blank')}
                                        className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 w-fit"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        {t("viewGuide")}
                                    </button>
                                </div>
                            </div>

                            {/* 免费创建提示 - 桌面端 */}
                            {mode === 'create' && (
                                <p className="hidden sm:flex text-sm text-gray-500 dark:text-gray-500 items-center">
                                    <svg className="w-4 h-4 text-gray-500 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t("freeCreationNotice")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* 必填字段部分 */}

                            {/* 1. 项目名称 (必填) */}
                            <div>
                                <label className="block mb-2">
                                    {t("projectName")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    ref={nameInputRef}
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    className={`w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border ${nameError ? 'border-red-500' : 'border-black dark:border-white border-opacity-10 dark:border-opacity-10'}`}
                                    placeholder={t("projectNamePlaceholder")}
                                    required
                                />
                                {nameExists && (
                                    <div className="text-red-500 text-sm mt-1">{t("nameExists")}</div>
                                )}
                                {nameError && (
                                    <div className="text-red-500 text-sm mt-1">{t("nameRequired")}</div>
                                )}
                            </div>

                            {/* 2. 代币符号 (必填) */}
                            <div>
                                <label className="block mb-2">
                                    {t("createSymbol")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="symbol"
                                    ref={symbolInputRef}
                                    value={formData.symbol}
                                    onChange={handleSymbolChange}
                                    className={`w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border ${symbolError ? 'border-red-500' : 'border-black dark:border-white border-opacity-10 dark:border-opacity-10'}`}
                                    placeholder={t("symbolRule")}
                                    minLength={3}
                                    maxLength={6}
                                    pattern="[A-Z]{3,6}"
                                    required
                                />
                                {symbolExists && (
                                    <div className="text-red-500 text-sm mt-1">{t("symbolExists")}</div>
                                )}
                                {symbolError && (
                                    <div className="text-red-500 text-sm mt-1">{t("symbolRequired")}</div>
                                )}
                            </div>

                            {/* 3. 项目描述 (必填) */}
                            <div>
                                <label className="block mb-2">
                                    {t("projectDescription")} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    ref={descriptionInputRef}
                                    value={formData.description}
                                    onChange={handleDescriptionChange}
                                    className={`w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg h-16 focus:outline-none border ${descriptionError ? 'border-red-500' : 'border-black dark:border-white border-opacity-10 dark:border-opacity-10'}`}
                                    placeholder={t("projectDescriptionPlaceholder")}
                                    maxLength={500}
                                    required
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <div className="text-gray-500 text-sm">{t("descriptionLimit")}</div>
                                    <div className="text-gray-400 text-sm">
                                        {formData.description.length}/500
                                    </div>
                                </div>
                                <div className="text-gray-400 text-xs mt-1 italic">
                                    {t("descriptionExample")}
                                </div>
                                {descriptionError && (
                                    <div className="text-red-500 text-sm mt-1">{t("descriptionRequired")}</div>
                                )}
                            </div>

                            {/* 4. 代币Logo (必填) */}
                            <div ref={logoInputRef}>
                                <label className="block mb-2">
                                    {t("agentImage")} <span className="text-red-500">*</span>
                                </label>
                                <div className="text-gray-500 text-sm mb-2">{t("logoSizeHint")}</div>
                                <div className={`relative w-24 h-24 ${logoError ? 'ring-2 ring-red-500 rounded-md' : ''}`}>
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
                                {logoError && (
                                    <div className="text-red-500 text-sm mt-1">{t("logoRequired")}</div>
                                )}
                            </div>

                            {/* 仅在编辑模式下显示IAO时间设置 */}
                            {mode === 'edit' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* IAO开始时间 */}
                                    <div ref={startTimeInputRef}>
                                        <label className="block mb-1">
                                            {t("iaoStartTime")} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={iaoStartDays}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 1;
                                                        const clampedValue = Math.max(1, Math.min(30, value));
                                                        setIaoStartDays(clampedValue);
                                                        if (startTimeError) setStartTimeError(false);
                                                    }}
                                                    placeholder="1"
                                                    className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                                                />
                                                <span className="text-gray-500 text-sm">{t("days")}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    value={iaoStartHours}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        const clampedValue = Math.max(0, Math.min(23, value));
                                                        setIaoStartHours(clampedValue);
                                                        if (startTimeError) setStartTimeError(false);
                                                    }}
                                                    placeholder="0"
                                                    className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                                                />
                                                <span className="text-gray-500 text-sm">{t("hours")}</span>
                                            </div>
                                        </div>
                                        <div className="text-gray-500 text-xs mt-1">{t("startTimeHint")}</div>
                                        {startTimeError && (
                                            <div className="text-red-500 text-xs mt-1">{t("startTimeError")}</div>
                                        )}
                                    </div>

                                    {/* IAO持续时间 */}
                                    <div ref={iaoDurationInputRef}>
                                        <label className="block mb-1">
                                            {t("iaoDuration")} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min={Math.floor(config.iao.minDurationHours / 24)}
                                                    max={Math.floor(config.iao.maxDurationHours / 24)}
                                                    value={iaoDurationDays}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || config.iao.defaultDurationDays;
                                                        const clampedValue = Math.max(
                                                            Math.floor(config.iao.minDurationHours / 24), 
                                                            Math.min(Math.floor(config.iao.maxDurationHours / 24), value)
                                                        );
                                                        setIaoDurationDays(clampedValue);
                                                        if (iaoDurationError) setIaoDurationError(false);
                                                    }}
                                                    placeholder={config.iao.defaultDurationDays.toString()}
                                                    className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                                                />
                                                <span className="text-gray-500 text-sm">{t("days")}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    value={iaoDurationHours}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        const clampedValue = Math.max(0, Math.min(23, value));
                                                        setIaoDurationHours(clampedValue);
                                                        if (iaoDurationError) setIaoDurationError(false);
                                                    }}
                                                    placeholder="0"
                                                    className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                                                />
                                                <span className="text-gray-500 text-sm">{t("hours")}</span>
                                            </div>
                                        </div>
                                        <div className="text-gray-500 text-xs mt-1">{t("durationHint", {
                                            min: config.iao.minDurationHours,
                                            max: config.iao.maxDurationHours,
                                            minDays: Math.floor(config.iao.minDurationHours / 24),
                                            maxDays: Math.floor(config.iao.maxDurationHours / 24)
                                        })}</div>
                                        {iaoDurationError && (
                                            <div className="text-red-500 text-xs mt-1">{t("durationError")}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 6. IAO时间信息显示 (仅在编辑模式显示) */}
                            {mode === 'edit' && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg mb-2">
                                    <div className="text-red-500 text-xs">
                                        {t("iaoScheduleInfo", {
                                            startHours: iaoStartDays * 24 + iaoStartHours,
                                            durationHours: iaoDurationDays * 24 + iaoDurationHours,
                                            endTime: dateRange.range.to ? dateRange.range.to.toLocaleString(locale, {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : t("calculating")
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 代币信息展示 */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-sm">
                                    <div className="flex flex-col items-start">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t("tokenSupply")}: </span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{formData.tokenSupply}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t("miningRate")}: </span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{formData.miningRate}%</span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {t("miningRateFormula", {rate: formData.miningRate})}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">{t("iaoPercentage")}: </span>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{formData.iaoPercentage}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. 推特链接 (可选) */}
                            <div>
                                <label className="block mb-2">
                                    {t("twitterLink")} <span className="text-gray-500 text-sm">({t("optional")})</span>
                                </label>
                                <input
                                    name="twitterLink"
                                    ref={twitterRef}
                                    value={formData.twitterLink}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("twitterPlaceholder")}
                                />
                                {twitterError && (
                                    <div className="text-red-500 text-sm mt-1">{t("linkFormatError")}</div>
                                )}
                            </div>

                            {/* 4. Telegram链接 (可选) */}
                            <div>
                                <label className="block mb-2">
                                    {t("telegramLink")} <span className="text-gray-500 text-sm">({t("optional")})</span>
                                </label>
                                <input
                                    name="telegramLink"
                                    ref={telegramRef}
                                    value={formData.telegramLink}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("telegramPlaceholder")}
                                />
                                {telegramError && (
                                    <div className="text-red-500 text-sm mt-1">{t("linkFormatError")}</div>
                                )}
                            </div>

                            {/* 对话示例部分 - 仅在编辑模式下显示 */}
                            {mode === 'edit' && (
                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold" id="examples">{t("dialogExample")}</h2>
                                            <span className="text-gray-500 text-sm">({t("optional")})</span>
                                        </div>
                                    </div>

                                    {/* Example 1 */}
                                    <div id="examples" className="relative mb-6">
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
                                            className="w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg h-16 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                            placeholder=""
                                        />
                                    </div>

                                    {/* Example 2 */}
                                    <div className="relative mb-6">
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
                                            className="w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg h-16 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                            placeholder=""
                                        />
                                    </div>

                                    {/* Example 3 */}
                                    <div className="relative mb-6">
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
                                            className="w-full bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg h-16 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                            placeholder=""
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleCreate}
                                disabled={creating || !formData.name || isTranslationLoading}
                                className="mt-6 w-full opacity-90 hover:opacity-100 bg-primary text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isTranslationLoading ? (
                                    <>
                                        <svg className="inline mr-2 w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                        {t("translatingMultiLang")}
                                    </>
                                ) : (
                                    creating ? t("creating") : mode === 'edit' ? t("update") : t("createNow")
                                )}
                            </button>
                            {isTranslationLoading && (
                                <div className="text-gray-500 text-xs mt-2 text-center">
                                    {t("translatingMultiLangTip")}
                                </div>
                            )}
                            
                            {mode === 'create' && (
                                <div className="text-gray-500 text-sm mt-2 text-center">
                                    {t("additionalSettingsAfterCreation")}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default New;