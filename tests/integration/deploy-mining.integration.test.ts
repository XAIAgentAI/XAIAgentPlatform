/**
 * 集成测试：测试 deploy-mining 接口的完整流程
 * 使用真实数据库和新的认证系统
 */

// 优先加载环境变量
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local', override: true })

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { generateTestToken } from '../utils/test-helpers'

// 不Mock mining模块，使用真实功能
// 注意：此测试会调用真实的外部服务，请确保环境变量配置正确

// 测试用的 Agent ID 和用户地址
const TEST_AGENT_ID = 'test-agent-deploy-mining-' + Date.now()
const TEST_USER_ADDRESS = '0x1234567890123456789012345678901234567890'

describe('Deploy Mining Integration Tests', () => {
  let testAgent: any
  let testUser: any
  let authToken: string

  beforeAll(async () => {
    // 检查必要的环境变量
    const requiredEnvVars = ['DATABASE_URL', 'SERVER_WALLET_PRIVATE_KEY']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.warn(`⚠️  缺少环境变量: ${missingVars.join(', ')}`)
      console.warn('请在 .env 文件中配置必要的环境变量')
    }
    // 创建测试用户（使用正确的字段）
    testUser = await prisma.user.upsert({
      where: { address: TEST_USER_ADDRESS },
      update: {},
      create: {
        address: TEST_USER_ADDRESS,
        nickname: 'Test User',
        // 去掉不存在的 name 和 email 字段
      }
    })

    // 使用测试工具生成 Token
    authToken = generateTestToken(TEST_USER_ADDRESS)

    // 创建测试 Agent
    testAgent = await prisma.agent.create({
      data: {
        id: TEST_AGENT_ID,
        name: 'Test Mining Agent',
        description: 'Agent for mining deployment test',
        category: 'test', // 必需字段
        capabilities: JSON.stringify(['mining', 'deployment']), // 必需字段
        creatorId: testUser.id, // 正确的字段名
      }
    })
  })

  afterAll(async () => {
    // 清理测试数据 - 按依赖关系顺序删除
    try {
      await prisma.task.deleteMany({
        where: { agentId: TEST_AGENT_ID }
      })
      
      await prisma.agent.deleteMany({
        where: { id: TEST_AGENT_ID }
      })
      
      await prisma.user.deleteMany({
        where: { address: TEST_USER_ADDRESS }
      })
    } catch (error) {
      console.warn('清理测试数据时出现警告:', error)
    }
  })

  beforeEach(async () => {
    // 每个测试前清理任务
    await prisma.task.deleteMany({
      where: { agentId: TEST_AGENT_ID }
    })
    
    // 重置 Agent 状态 (暂时跳过不存在的字段)
    // 等数据库模型更新后再添加这些字段
    // await prisma.agent.update({
    //   where: { id: TEST_AGENT_ID },
    //   data: {
    //     miningContractAddress: null,
    //     miningContractRegistered: null,
    //     miningRegistrationTxHash: null,
    //   }
    // })
  })

  it('应该成功提交挖矿合约部署任务并执行真实部署', async () => {
    console.log('🚀 开始真实挖矿合约部署测试...')
    
    // 使用真实的测试参数（项目名称不能含空格）
    const realTestParams = {
      nft: '0x07D325030dA1A8c1f96C414BFFbe4fBD539CED45',
      owner: TEST_USER_ADDRESS,
      project_name: 'RealIntegrationTest' + Date.now(), // 移除空格
      reward_amount_per_year: '2000000000000000000000000000',
      reward_token: '0x07D325030dA1A8c1f96C414BFFbe4fBD539CED45'
    }

    // 直接调用API函数，但不Mock任何依赖
    const { POST } = await import('@/app/api/agents/[id]/deploy-mining/route')
    const { NextRequest } = await import('next/server')

    const request = new NextRequest(`http://localhost:3000/api/agents/${TEST_AGENT_ID}/deploy-mining`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(realTestParams)
    })

    console.log('📤 发送部署请求，参数:', realTestParams)
    const response = await POST(request, { params: { id: TEST_AGENT_ID } })
    const data = await response.json()

    console.log('📥 API响应:', data)

    expect(response.status).toBe(200)
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('taskId')

    const taskId = data.data.taskId

    // 验证数据库中创建了任务
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })
    
    expect(task).not.toBeNull()
    expect(task?.type).toBe('DEPLOY_MINING')
    expect(task?.agentId).toBe(TEST_AGENT_ID)

    console.log('📋 任务创建成功，ID:', taskId)
    console.log('📋 任务初始状态:', task?.status)

    // 等待后台任务完成（真实的部署和注册过程）
    console.log('⏳ 等待真实的后台任务处理...')
    let finalTask = task
    let retries = 0
    const maxRetries = 120 // 2分钟

    while (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒
      finalTask = await prisma.task.findUnique({
        where: { id: taskId }
      })
      
      if (finalTask?.status === 'COMPLETED' || finalTask?.status === 'FAILED') {
        break
      }
      
      retries++
      
      if (retries % 10 === 0) {
        console.log(`⏱️  等待中... (${retries}/${maxRetries}秒), 当前状态: ${finalTask?.status}`)
      }
    }

    console.log('📊 最终任务状态:', finalTask?.status)
    if (finalTask?.result) {
      console.log('📋 任务结果:', JSON.parse(finalTask.result))
    }
    if (finalTask?.error) {
      console.log('❌ 任务错误:', finalTask.error)
    }

    // 验证任务处理结果
    expect(finalTask?.status).not.toBe('PENDING') // 确保任务被处理了

    if (finalTask?.status === 'COMPLETED') {
      console.log('✅ 真实挖矿合约部署成功!')
      const result = JSON.parse(finalTask.result || '{}')
      if (result.proxy_address) {
        console.log('📍 合约地址:', result.proxy_address)
        expect(result.proxy_address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      }
      console.log('✅ 真实集成测试完成!')
    } else if (finalTask?.status === 'FAILED') {
      const resultData = finalTask.result ? JSON.parse(finalTask.result) : null
      const errorMessage = finalTask.error || resultData?.error || '未知错误'
      
      console.log('❌ 任务失败，错误信息:', errorMessage)
      console.log('📋 失败的任务结果:', resultData || '无结果数据')
      
      // 如果是参数错误，说明API调用格式有问题
      if (errorMessage.includes('Invalid request parameters') || errorMessage.includes('nowhitespace')) {
        console.log('💡 提示：外部API参数格式有问题')
        console.log('🔍 具体错误：项目名称不能包含空格')
        console.log('📤 发送的参数格式:', realTestParams)
        console.log('🛠️  建议：修改项目名称为不含空格的格式')
      }
      
      // 测试失败，抛出错误
      throw new Error(`挖矿合约部署任务失败: ${errorMessage}`)
    } else {
      // 其他未知状态
      throw new Error(`任务状态异常: ${finalTask?.status}`)
    }
  }, 150000) // 2.5分钟超时

  it('应该拒绝重复部署请求', async () => {
    // 跳过这个测试，因为数据库模型中没有 miningContractAddress 字段
    // TODO: 等数据库模型更新后恢复这个测试
    return

    const response = await fetch(`http://localhost:3000/api/agents/${TEST_AGENT_ID}/deploy-mining`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        nft: '0x1234567890123456789012345678901234567890',
        owner: TEST_USER_ADDRESS,
        project_name: 'Test Project',
        reward_token: '0x5678901234567890123456789012345678901234'
      })
    })

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.code).toBe(400)
    expect(data.message).toBe('挖矿合约已经部署')
    expect(data.miningContractAddress).toBe('0x9999999999999999999999999999999999999999')
  })

  it('应该拒绝并发部署请求', async () => {
    // 先创建一个进行中的任务
    await prisma.task.create({
      data: {
        type: 'DEPLOY_MINING',
        status: 'PROCESSING',
        agentId: TEST_AGENT_ID,
        createdBy: TEST_USER_ADDRESS,
      }
    })

    const { POST } = await import('@/app/api/agents/[id]/deploy-mining/route')
    const { NextRequest } = await import('next/server')

    const request = new NextRequest(`http://localhost:3000/api/agents/${TEST_AGENT_ID}/deploy-mining`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        nft: '0x1234567890123456789012345678901234567890',
        owner: TEST_USER_ADDRESS,
        project_name: 'Test Project',
        reward_token: '0x5678901234567890123456789012345678901234'
      })
    })

    const response = await POST(request, { params: { id: TEST_AGENT_ID } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe(400)
    expect(data.message).toBe('已存在进行中的挖矿合约部署任务，请等待完成')
  })

  it('应该拒绝无效的参数', async () => {
    const { POST } = await import('@/app/api/agents/[id]/deploy-mining/route')
    const { NextRequest } = await import('next/server')

    const request = new NextRequest(`http://localhost:3000/api/agents/${TEST_AGENT_ID}/deploy-mining`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        nft: 'invalid-address',
        owner: TEST_USER_ADDRESS,
        project_name: '',
        reward_token: '0x5678901234567890123456789012345678901234'
      })
    })

    const response = await POST(request, { params: { id: TEST_AGENT_ID } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe(400)
    expect(data.message).toBe('参数验证失败')
    expect(Array.isArray(data.errors)).toBe(true)
  })

  it('应该拒绝未授权的请求', async () => {
    const { POST } = await import('@/app/api/agents/[id]/deploy-mining/route')
    const { NextRequest } = await import('next/server')

    const request = new NextRequest(`http://localhost:3000/api/agents/${TEST_AGENT_ID}/deploy-mining`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // 没有 Authorization header
      },
      body: JSON.stringify({
        nft: '0x1234567890123456789012345678901234567890',
        owner: TEST_USER_ADDRESS,
        project_name: 'Test Project',
        reward_token: '0x5678901234567890123456789012345678901234'
      })
    })

    const response = await POST(request, { params: { id: TEST_AGENT_ID } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.code).toBe(401)
    expect(data.message).toContain('授权') // 匹配实际的错误消息"未授权"
  })
})