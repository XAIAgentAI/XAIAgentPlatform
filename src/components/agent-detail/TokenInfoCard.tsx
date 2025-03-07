import { Card } from "@/components/ui/card";
import { useLocale } from 'next-intl';

interface TokenInfoCardProps {
  projectDescription?: string;
}

export function TokenInfoCard({ projectDescription }: TokenInfoCardProps) {
  const locale = useLocale();

  // 解析项目说明JSON字符串，如果解析失败则返回空对象
  const projectDescriptionObj = projectDescription ? 
    (() => {
      try {
        return JSON.parse(projectDescription);
      } catch (e) {
        console.error('Failed to parse projectDescription:', e);
        return {};
      }
    })() : {};

  // 根据当前语言获取项目说明，如果没有对应语言的说明则使用英文（默认）
  const localizedDescription = projectDescriptionObj[locale] || projectDescriptionObj['en'] || '';

  // 如果没有项目说明，则不渲染任何内容
  if (!localizedDescription) {
    return null;
  }

  return (
    <Card className="p-6 bg-card mt-6">
      <div className="space-y-3">
        {localizedDescription.split("\n").map((line: string, index: number) => (
          <p key={index} className="text-sm text-muted-foreground break-words mb-2">
            {line}
          </p>
        ))}
      </div>
    </Card>
  );
} 