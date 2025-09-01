'use client';

import { useEffect } from 'react';

/**
 * VConsole 组件
 * 在测试环境中条件性地启用 VConsole 移动端调试工具
 * 通过环境变量 NEXT_PUBLIC_ENABLE_VCONSOLE 控制是否启用
 */
export default function VConsole() {
  useEffect(() => {
    // 只在客户端且启用环境变量时加载 VConsole
    if (
      typeof window !== 'undefined' && 
      process.env.NEXT_PUBLIC_ENABLE_VCONSOLE === 'true'
    ) {
      // 动态导入 VConsole 以避免服务端渲染问题
      import('vconsole').then((VConsoleModule) => {
        const VConsole = VConsoleModule.default;
        
        // 检查是否已经初始化过 VConsole
        if (!(window as any).vConsole) {
          const vConsole = new VConsole({
            theme: 'dark', // 使用深色主题
            defaultPlugins: ['system', 'network', 'element', 'storage'], // 启用的插件
            maxLogNumber: 1000, // 最大日志数量
          });
          
          // 将实例保存到 window 对象，避免重复初始化
          (window as any).vConsole = vConsole;
          
          console.log('VConsole 已启用 - 测试环境调试工具');
        }
      }).catch((error) => {
        console.error('VConsole 加载失败:', error);
      });
    }
  }, []);

  // 这个组件不渲染任何内容
  return null;
}
