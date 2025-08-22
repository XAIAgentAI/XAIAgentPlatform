import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, handleError } from '@/lib/error'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({
        code: 400,
        message: 'Address parameter is required'
      }, { status: 400 })
    }

    // 查询该地址创建的所有AI模型
    const agents = await prisma.agent.findMany({
      where: {
        creator: {
          address: address.toLowerCase()
        }
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true,
        avatar: true,
        status: true,
        type: true,
        createdAt: true,
        iaoStartTime: true,
        iaoEndTime: true,
        holdersCount: true,
        marketCap: true,
        creator: {
          select: {
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const models = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      symbol: agent.symbol,
      description: agent.description,
      avatar: agent.avatar,
      status: agent.status || 'PENDING',
      type: agent.type || 'AI Model',
      createdAt: agent.createdAt.toISOString(),
      iaoStartTime: agent.iaoStartTime,
      iaoEndTime: agent.iaoEndTime,
      holdersCount: agent.holdersCount || 0,
      marketCap: agent.marketCap || '$0'
    }))

    return createSuccessResponse(models)

  } catch (error) {
    console.error('Error fetching user models:', error)
    return handleError(error)
  }
}