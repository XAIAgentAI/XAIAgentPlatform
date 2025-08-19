/**
 * 请求管理器 - 处理并发请求和状态管理
 * 解决数据竞态条件问题的通用解决方案
 */

type RequestKey = string
type RequestPromise<T> = Promise<T>

interface RequestState<T> {
  promise: RequestPromise<T>
  timestamp: number
}

class RequestManager {
  private requests: Map<RequestKey, RequestState<any>> = new Map()

  /**
   * 执行请求，自动处理竞态条件
   * @param key 请求的唯一标识
   * @param requestFn 请求函数
   * @returns 请求结果，如果被新请求覆盖则返回null
   */
  async execute<T>(key: RequestKey, requestFn: () => RequestPromise<T>): Promise<T | null> {
    const timestamp = Date.now()
    const promise = requestFn()
    
    // 存储当前请求
    this.requests.set(key, { promise, timestamp })
    
    try {
      const result = await promise
      
      // 检查是否是最新的请求
      const currentRequest = this.requests.get(key)
      if (!currentRequest || currentRequest.timestamp !== timestamp) {
        console.log(`Request ${key} was superseded by newer request`)
        return null
      }
      
      return result
    } catch (error) {
      // 检查是否是最新的请求
      const currentRequest = this.requests.get(key)
      if (!currentRequest || currentRequest.timestamp !== timestamp) {
        console.log(`Failed request ${key} was superseded, ignoring error`)
        return null
      }
      
      throw error
    } finally {
      // 只有当前请求才清理
      const currentRequest = this.requests.get(key)
      if (currentRequest && currentRequest.timestamp === timestamp) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * 取消指定的请求
   * @param key 请求标识
   */
  cancel(key: RequestKey): void {
    this.requests.delete(key)
  }

  /**
   * 取消所有请求
   */
  cancelAll(): void {
    this.requests.clear()
  }

  /**
   * 检查指定请求是否还在进行中
   * @param key 请求标识
   */
  isPending(key: RequestKey): boolean {
    return this.requests.has(key)
  }
}

// 全局实例
export const globalRequestManager = new RequestManager()

// Hook工厂函数
export function createRequestManager() {
  return new RequestManager()
}