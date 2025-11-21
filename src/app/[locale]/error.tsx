'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 将错误记录到错误报告服务
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="w-16 h-16 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">
            Page Loading Error
          </h1>
          <p className="text-text-secondary">
            The application encountered an unexpected error. You can try reloading the page.
          </p>
        </div>

        {/* 开发环境下显示错误详情 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-destructive/10 rounded-lg text-left overflow-auto max-h-48">
            <p className="text-xs font-mono text-destructive break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-text-secondary mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            variant="outline"
          >
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
          >
            Back to Home
          </Button>
        </div>

        <p className="text-xs text-text-secondary mt-4">
          If the problem persists, please contact technical support
        </p>
      </div>
    </div>
  );
}
