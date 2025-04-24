import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button";

const New: React.FC = () => {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tokenSupply: '1000亿',
    iaoPercentage: '15%',
    miningRate: '60亿/年'
  });

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        router.push(`/agent/${data.agentId}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed max-h-[70vh] top-[120px] lg:top-[180px] right-0 w-screen flex justify-center overflow-y-auto">
      <div className="w-[80vw] lg:w-[66vw] mx-auto lg:mr-[6.6vw] overflow:scroll">
        <div className="bg-[rgb(248,248,248)] dark:bg-[rgba(22,22,22,0.8)] rounded-xl p-6 border border-gray-200 dark:border-none">
          <h1 className="text-2xl font-bold mb-6">创建AI代币项目</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-1">项目名称</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg focus:outline-none border border-gray-200 dark:border-none"
                placeholder="例如: XAIAgent"
              />
            </div>
            
            <div>
              <label className="block mb-1">项目描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg h-24 focus:outline-none border border-gray-200 dark:border-none"
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
                  className="w-full bg-white dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg focus:outline-none border border-gray-200 dark:border-none"
                />
              </div>
              
              <div>
                <label className="block mb-1">IAO比例</label>
                <input
                  name="iaoPercentage"
                  value={formData.iaoPercentage}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg focus:outline-none border border-gray-200 dark:border-none"
                />
              </div>
              
              <div>
                <label className="block mb-1">挖矿产出</label>
                <input
                  name="miningRate"
                  value={formData.miningRate}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg focus:outline-none border border-gray-200 dark:border-none"
                />
              </div>
            </div>
            
            <button
              onClick={handleCreate}
              disabled={creating || !formData.name}
              className="mt-6 w-full opacity-[.60] hover:opacity-[.90] bg-primary text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? '创建中...' : '立即创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New;