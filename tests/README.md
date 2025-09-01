# 测试文档

本项目采用三层测试架构，确保代码质量和功能完整性。

## 🏗️ 测试架构

### 1. 单元测试 (Unit Tests)
**位置**: `tests/api/`  
**目的**: 测试业务逻辑，隔离外部依赖  
**特点**:
- 使用 Mock 模拟所有外部依赖
- 运行速度快
- 专注于业务逻辑验证

### 2. 集成测试 (Integration Tests)  
**位置**: `tests/integration/`  
**目的**: 测试完整接口流程  
**特点**:
- 使用真实数据库
- 模拟外部 API 调用
- 验证数据库操作和业务流程

### 3. 端到端测试 (E2E Tests)
**位置**: `scripts/test-*-e2e.ts`  
**目的**: 测试完整用户场景  
**特点**:
- 真实环境运行
- 完整的用户流程测试
- 可用于生产环境验证

## 🚀 运行测试

### 单独运行
```bash
# 单元测试
pnpm run test:unit

# 集成测试  
pnpm run test:integration

# 端到端测试
pnpm run test:e2e

# 测试观察模式
pnpm run test:watch
```

### 批量运行
```bash
# 运行所有测试
pnpm run test:all

# 交互式测试界面
pnpm run test:ui
```

## 📁 目录结构

```
tests/
├── api/                    # 单元测试
│   └── deploy-mining.test.ts
├── integration/            # 集成测试
│   └── deploy-mining.integration.test.ts
├── utils/                  # 测试工具
│   └── test-helpers.ts
└── README.md

scripts/
└── test-deploy-mining-e2e.ts  # 端到端测试
```

## 🛠️ 测试工具

### 测试辅助函数
`tests/utils/test-helpers.ts` 提供：
- JWT Token 生成
- 测试用户/Agent 创建
- 数据清理功能
- 请求构建工具
- 响应验证工具

### 使用示例
```typescript
import { setupTestEnvironment, TEST_CONSTANTS } from '../utils/test-helpers'

const { user, agent, token, cleanup } = await setupTestEnvironment()
// 使用测试环境
await cleanup() // 清理数据
```

## 🔧 配置文件

- `vitest.config.ts` - 单元测试配置
- `vitest.integration.config.ts` - 集成测试配置

## 📋 测试清单

### deploy-mining 接口测试

#### 单元测试覆盖
- [x] 成功创建部署任务
- [x] 无 Token 认证失败
- [x] 无效 Token 认证失败  
- [x] Agent 不存在
- [x] 权限验证（非创建者）
- [x] 参数验证失败
- [x] 重复部署检查
- [x] 并发任务检查

#### 集成测试覆盖
- [x] 完整部署流程
- [x] 数据库操作验证
- [x] 真实环境错误处理

#### E2E测试覆盖
- [x] 端到端部署流程
- [x] 真实API调用
- [x] 数据持久化验证

## 💡 最佳实践

### 测试数据管理
- 使用唯一标识符避免数据冲突
- 测试后及时清理数据
- 使用事务确保数据一致性

### Mock 策略
- 单元测试：Mock 所有外部依赖
- 集成测试：Mock 外部 API，保留数据库
- E2E测试：最小化 Mock，使用真实环境

### 测试命名
- 使用描述性测试名称
- 遵循 "应该[期望行为]当[条件]时" 格式
- 分组相关测试用例

## 🐛 调试测试

### 查看测试详情
```bash
# 详细输出
pnpm test -- --reporter=verbose

# 只运行特定测试
pnpm test -- --grep "部署任务"
```

### 常见问题
1. **数据库连接问题**: 检查 `.env` 配置
2. **端口冲突**: 确保测试端口未被占用
3. **权限问题**: 验证测试用户权限设置

## 📈 测试报告

运行测试后会生成：
- 控制台输出报告
- 覆盖率报告（如果配置）
- 测试结果文件

## 🔄 CI/CD 集成

测试命令适合集成到 CI/CD 流水线：
```yaml
# GitHub Actions 示例
- name: Run Tests
  run: |
    pnpm run test:unit
    pnpm run test:integration
```