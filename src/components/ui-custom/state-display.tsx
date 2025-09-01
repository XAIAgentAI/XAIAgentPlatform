import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { useTranslations } from 'next-intl'

interface StateDisplayProps {
  isLoading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyMessage?: string
  children?: React.ReactNode
}

export const StateDisplay = ({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  children
}: StateDisplayProps) => {
  const t = useTranslations('common')

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isEmpty) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <p className="text-muted-foreground">{emptyMessage || t('noData')}</p>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
} 