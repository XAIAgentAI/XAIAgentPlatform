/**
 * 这是一个TypeDoc示例模块，展示如何为类、接口和方法编写文档
 * 
 * @module TypeDocExample
 * @category 工具
 */

/**
 * 用户角色枚举
 * 
 * @enum {string}
 */
export enum UserRole {
  /** 管理员角色 */
  ADMIN = 'admin',
  /** 普通用户角色 */
  USER = 'user',
  /** 访客角色 */
  GUEST = 'guest'
}

/**
 * 用户配置接口
 * 
 * @interface
 */
export interface UserConfig {
  /** 是否启用通知 */
  enableNotifications: boolean;
  /** 主题设置 */
  theme: 'light' | 'dark' | 'system';
  /** 语言设置 */
  language: string;
}

/**
 * 用户模型接口
 * 
 * @interface
 */
export interface User {
  /** 用户唯一标识 */
  id: string;
  /** 用户名 */
  username: string;
  /** 电子邮箱 */
  email: string;
  /** 用户角色 */
  role: UserRole;
  /** 用户配置 */
  config?: UserConfig;
}

/**
 * 用户服务类 - 演示TypeDoc类文档
 * 
 * 该类提供用户管理相关功能，包括用户创建、查询、更新和删除。
 * 
 * @example
 * ```typescript
 * const userService = new UserService();
 * const user = await userService.getUserById('123');
 * ```
 */
export class UserService {
  private users: Map<string, User>;

  /**
   * 创建用户服务实例
   * 
   * @param initialUsers - 可选的初始用户列表
   */
  constructor(initialUsers: User[] = []) {
    this.users = new Map();
    
    // 初始化用户
    initialUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  /**
   * 根据ID获取用户
   * 
   * @param id - 用户ID
   * @returns 用户对象，如果未找到则返回undefined
   * @throws {Error} 如果ID为空
   * 
   * @example
   * ```typescript
   * // 获取特定用户
   * const user = await userService.getUserById('user-123');
   * if (user) {
   *   console.log(`找到用户: ${user.username}`);
   * }
   * ```
   */
  async getUserById(id: string): Promise<User | undefined> {
    if (!id) {
      throw new Error('用户ID不能为空');
    }
    
    // 模拟异步操作
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.users.get(id));
      }, 100);
    });
  }

  /**
   * 创建新用户
   * 
   * @param userData - 用户数据，不包含ID
   * @returns 创建的用户对象
   * @throws {Error} 如果用户名或邮箱已存在
   * 
   * @example
   * ```typescript
   * // 创建新用户
   * const newUser = await userService.createUser({
   *   username: 'newuser',
   *   email: 'user@example.com',
   *   role: UserRole.USER
   * });
   * ```
   */
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    // 检查用户名是否已存在
    const existingUserByUsername = Array.from(this.users.values())
      .find(u => u.username === userData.username);
    
    if (existingUserByUsername) {
      throw new Error(`用户名 ${userData.username} 已存在`);
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = Array.from(this.users.values())
      .find(u => u.email === userData.email);
    
    if (existingUserByEmail) {
      throw new Error(`邮箱 ${userData.email} 已存在`);
    }

    // 创建新用户
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // 模拟异步操作
    return new Promise((resolve) => {
      setTimeout(() => {
        this.users.set(newUser.id, newUser);
        resolve(newUser);
      }, 100);
    });
  }

  /**
   * 更新用户信息
   * 
   * @param id - 用户ID
   * @param userData - 要更新的用户数据
   * @returns 更新后的用户对象
   * @throws {Error} 如果用户不存在
   * 
   * @example
   * ```typescript
   * // 更新用户角色
   * const updatedUser = await userService.updateUser('user-123', {
   *   role: UserRole.ADMIN
   * });
   * ```
   */
  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<User> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      throw new Error(`用户ID ${id} 不存在`);
    }

    // 更新用户
    const updatedUser: User = {
      ...existingUser,
      ...userData
    };

    // 模拟异步操作
    return new Promise((resolve) => {
      setTimeout(() => {
        this.users.set(id, updatedUser);
        resolve(updatedUser);
      }, 100);
    });
  }

  /**
   * 删除用户
   * 
   * @param id - 要删除的用户ID
   * @returns 是否成功删除
   * 
   * @example
   * ```typescript
   * // 删除用户
   * const isDeleted = await userService.deleteUser('user-123');
   * if (isDeleted) {
   *   console.log('用户已删除');
   * }
   * ```
   */
  async deleteUser(id: string): Promise<boolean> {
    // 模拟异步操作
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.users.delete(id));
      }, 100);
    });
  }

  /**
   * 获取所有用户
   * 
   * @returns 用户列表
   * 
   * @example
   * ```typescript
   * // 获取所有用户
   * const allUsers = await userService.getAllUsers();
   * console.log(`总用户数: ${allUsers.length}`);
   * ```
   */
  async getAllUsers(): Promise<User[]> {
    // 模拟异步操作
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Array.from(this.users.values()));
      }, 100);
    });
  }

  /**
   * 根据角色过滤用户
   * 
   * @param role - 用户角色
   * @returns 指定角色的用户列表
   * 
   * @example
   * ```typescript
   * // 获取所有管理员
   * const admins = await userService.getUsersByRole(UserRole.ADMIN);
   * ```
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    // 模拟异步操作
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredUsers = Array.from(this.users.values())
          .filter(user => user.role === role);
        resolve(filteredUsers);
      }, 100);
    });
  }
} 