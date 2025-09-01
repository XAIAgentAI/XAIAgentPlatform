import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { name, symbol } = await request.json()

    const existingAgent = await prisma.agent.findFirst({
      where: {
        OR: [
          { name },
          { symbol }
        ]
      }
    })

    return NextResponse.json({
      exists: existingAgent !== null,
      nameExists: existingAgent?.name === name,
      symbolExists: existingAgent?.symbol === symbol
    })
  } catch (error) {
    console.error('Error checking agent existence:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}