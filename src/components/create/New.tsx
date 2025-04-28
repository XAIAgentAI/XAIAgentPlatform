import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations} from 'next-intl';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";

const New: React.FC = () => {
  const router = useRouter();
  const locale = useLocale();
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tokenSupply: '1000亿',
    iaoPercentage: '15%',
    miningRate: '60亿/年'
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAgentId(data.agentId);
        setSuccess(true);
        setTimeout(() => {
          router.push(`/agent/${data.agentId}`);
        }, 1500);
      }
    } finally {
      setSuccess(true);
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

  return (
    <div className="fixed inset-0 max-h-[80vh] top-[120px] lg:top-[180px] flex justify-center items-start overflow-y-auto">
      <div className="w-[80vw] lg:w-[66vw] max-w-4xl">
        {success ? (
          <div className="bg-white dark:bg-[#161616] rounded-xl p-8 border border-black dark:border-white border-opacity-10 dark:border-opacity-10 flex flex-col items-center justify-center h-96">
            <svg className="w-24 h-24 text-green-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-2xl font-bold mb-2 text-center">创建成功!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">AI代币项目已成功创建</p>
            <GradientBorderButton onClick={() => router.push(`/${locale}`)}>
              查看项目
            </GradientBorderButton>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#161616] rounded-xl p-6 border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
            <h1 className="text-2xl font-bold mb-6">创建AI代币项目</h1>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-1">项目名称</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                  placeholder="例如: XAIAgent"
                />
              </div>
              
              <div>
                <label className="block mb-1">项目描述</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg h-24 focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                  placeholder="描述你的AI项目功能"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">代币总量</label>
                  <input
                    name="tokenSupply"
                    value={formData.tokenSupply}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                  />
                </div>
                
                <div>
                  <label className="block mb-1">IAO比例</label>
                  <input
                    name="iaoPercentage"
                    value={formData.iaoPercentage}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                  />
                </div>
                
                <div>
                  <label className="block mb-1">挖矿产出</label>
                  <input
                    name="miningRate"
                    value={formData.miningRate}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-[#1a1a1a] p-3 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block mb-1">Agent图片</label>
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
              
              <button
                onClick={handleCreate}
                disabled={creating || !formData.name}
                className="mt-6 w-full opacity-90 hover:opacity-100 bg-primary text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? '创建中...' : '立即创建'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default New;