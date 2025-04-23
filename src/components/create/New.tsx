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
    <div className="fixed top-[120px] md:top-[160px] left-0 right-0 w-screen flex justify-center">
      <div className="w-[80vw] md:w-[67vw] mx-auto md:ml-[26vw]">
        <div className="bg-card-inner dark:bg-[rgba(22,22,22,0.8)] rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-6">创建AI代币项目</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-1">项目名称</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-input dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg"
                placeholder="例如: XAIAgent"
              />
            </div>
            
            <div>
              <label className="block mb-1">项目描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-input dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg h-24"
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
                  className="w-full bg-input dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block mb-1">IAO比例</label>
                <input
                  name="iaoPercentage"
                  value={formData.iaoPercentage}
                  onChange={handleChange}
                  className="w-full bg-input dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block mb-1">挖矿产出</label>
                <input
                  name="miningRate"
                  value={formData.miningRate}
                  onChange={handleChange}
                  className="w-full bg-input dark:bg-[rgba(33,33,33,0.6)] p-3 rounded-lg"
                />
              </div>
            </div>
            
            <GradientBorderButton 
              onClick={handleCreate}
              disabled={creating || !formData.name}
              className="mt-6 w-full"
            >
              {creating ? '创建中...' : '立即创建'}
            </GradientBorderButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New;