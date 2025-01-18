import Link from 'next/link'
import { Button } from './ui/button'

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">首页</Button>
          </Link>
          <Link href="/model-chat">
            <Button variant="ghost">模型对话</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
} 