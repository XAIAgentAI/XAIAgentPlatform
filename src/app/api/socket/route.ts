import { NextResponse } from 'next/server'
import { initSocket } from '@/lib/socket'

export async function GET(req: Request) {
  const response = new NextResponse()
  
  if (response.socket) {
    initSocket(response)
  }
  
  return response
} 