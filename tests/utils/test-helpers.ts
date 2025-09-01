/**
 * 测试工具函数
 * 提供通用的测试辅助功能
 */

import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { expect } from 'vitest'

const JWT_SECRET = 'xaiagent-jwt-secret-2024'

export interface TestUser {
  id: string
  address: string
  nickname: string | null
  avatar: string | null
}

export interface TestAgent {
  id: string
  name: string
  description: string
  creatorId: string
}

/**
 * 生成测试用的JWT Token
 */
export function generateTestToken(address: string): string {
  return jwt.sign({ address }, JWT_SECRET)
}

/**
 * 创建测试用户
 */
export async function createTestUser(address?: string): Promise<TestUser> {
  const userAddress = address || `0x${Math.random().toString(16).substring(2).padStart(40, '0')}`
  const timestamp = Date.now()
  
  const user = await prisma.user.create({
    data: {
      address: userAddress,
      nickname: `Test User ${timestamp}`,
      // 使用正确的字段名
    }
  })
  
  return user
}

/**
 * 创建测试Agent
 */
export async function createTestAgent(userId: string, name?: string): Promise<TestAgent> {
  const timestamp = Date.now()
  const agentId = `test-agent-${timestamp}`
  
  const agent = await prisma.agent.create({
    data: {
      id: agentId,
      name: name || `Test Agent ${timestamp}`,
      description: `Test agent created at ${timestamp}`,
      category: 'test',
      capabilities: JSON.stringify(['test']),
      creatorId: userId, // 正确的字段名
    }
  })
  
  return agent
}

/**
 * 清理测试数据
 */
export async function cleanupTestData(agentIds: string[], userIds: string[]) {
  try {
    // 删除相关任务
    if (agentIds.length > 0) {
      await prisma.task.deleteMany({
        where: {
          agentId: { in: agentIds }
        }
      })
    }
    
    // 删除Agent
    if (agentIds.length > 0) {
      await prisma.agent.deleteMany({
        where: {
          id: { in: agentIds }
        }
      })
    }
    
    // 删除用户
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: userIds }
        }
      })
    }
  } catch (error) {
    console.warn('清理测试数据时出错:', error)
  }
}

/**
 * 创建测试请求体
 */
export function createTestRequest(url: string, options: {
  method?: string
  token?: string
  body?: any
  headers?: Record<string, string>
} = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }
  
  return new Request(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })
}

/**
 * 等待函数 - 用于测试异步操作
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 验证响应格式
 */
export function validateApiResponse(data: any, expectedCode: number) {
  expect(data).toHaveProperty('code', expectedCode)
  expect(data).toHaveProperty('message')
  
  if (expectedCode === 200) {
    expect(data).toHaveProperty('data')
  }
  
  if (expectedCode >= 400) {
    // 错误响应可能有额外的错误信息
    if (data.errors) {
      expect(Array.isArray(data.errors)).toBe(true)
    }
  }
}

/**
 * 生成随机的以太坊地址
 */
export function generateRandomAddress(): string {
  return `0x${Math.random().toString(16).substring(2).padStart(40, '0')}`
}

/**
 * 验证以太坊地址格式
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * 创建完整的测试环境
 */
export async function setupTestEnvironment(userAddress?: string) {
  const testUser = await createTestUser(userAddress)
  const testAgent = await createTestAgent(testUser.id)
  const authToken = generateTestToken(testUser.address)
  
  return {
    user: testUser,
    agent: testAgent,
    token: authToken,
    cleanup: () => cleanupTestData([testAgent.id], [testUser.id])
  }
}

/**
 * 测试数据常量
 */
export const TEST_CONSTANTS = {
  VALID_ETH_ADDRESS: '0x1234567890123456789012345678901234567890',
  INVALID_ETH_ADDRESS: 'invalid-address',
  EMPTY_STRING: '',
  VALID_PROJECT_NAME: 'Test Mining Project',
  VALID_REWARD_TOKEN: '0x5678901234567890123456789012345678901234',
  
  // 常用的测试请求体
  VALID_DEPLOY_REQUEST: {
    nft: '0x1234567890123456789012345678901234567890',
    owner: '0x1234567890123456789012345678901234567890',
    project_name: 'Test Mining Project',
    reward_token: '0x5678901234567890123456789012345678901234'
  },
  
  INVALID_DEPLOY_REQUEST: {
    nft: 'invalid-address',
    owner: '0x1234567890123456789012345678901234567890',
    project_name: '',
    reward_token: '0x5678901234567890123456789012345678901234'
  }
}