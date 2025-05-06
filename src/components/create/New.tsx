import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";

const New: React.FC = () => {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations("createAgent");
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState(false);
    const [data, setData] = useState<{
        id: string;
        name: string;
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
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleCreate = async () => {
        setCreating(true);
        try {
            // First call translate API to get useCases
            const translateResponse = await fetch('/api/chat/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: formData.description
                })
            });
    
            if (!translateResponse.ok) {
                throw new Error('Failed to generate use cases');
            }
    
            const useCases = await translateResponse.json();
    
            // Then call create API with all data including useCases
            const createResponse = await fetch('/api/agents/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    imageUrl,
                    useCases
                })
            });
    
            const result = await createResponse.json();
            if (result.success) {
                setData(result.data);
                setSuccess(true);
            }
        } catch (error) {
            console.error('Creation failed:', error);
            // You might want to add error handling UI here
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

    const CreationAnimation = () => (
        <div className="flex flex-col items-center justify-center space-y-4">
            <svg width="120" height="120" viewBox="0 0 120 120" className="animate-pulse">
                <circle cx="60" cy="60" r="50" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                <circle cx="60" cy="60" r="50" stroke="#3B82F6" strokeWidth="8" fill="none"
                    strokeLinecap="round" strokeDasharray="314" strokeDashoffset="314"
                    className="origin-center -rotate-90 transition-all duration-1000">
                    <animate attributeName="stroke-dashoffset" values="314;0" dur="2s" repeatCount="indefinite" />
                </circle>
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
        </div>
    );

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
                        {t("created")} <span className="font-mono text-primary">{data.id}</span>
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
            </div>
        );
    };

    return (
        <div className="fixed rounded-md inset-0 max-lg:max-h-[calc(100vh-130px)] lg:max-h-[calc(100vh-170px)] top-[70px] lg:top-[100px] flex justify-center items-start overflow-y-auto">
            <div className="w-[80vw] lg:w-[66vw] max-w-4xl rounded-md">
                {creating ? (
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
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                                    placeholder={t("projectNamePlaceholder")}
                                />
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
                                        className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">{t("iaoPercentage")}</label>
                                    <input
                                        name="iaoPercentage"
                                        value={formData.iaoPercentage}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 disabled:opacity-75 disabled:cursor-not-allowed"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">{t("miningRate")}</label>
                                    <input
                                        name="miningRate"
                                        value={formData.miningRate}
                                        onChange={handleChange}
                                        className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
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