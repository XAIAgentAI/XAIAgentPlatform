# IAO时间更新逻辑重构

## 🎯 重构目标

将IAO时间更新逻辑从"后端调用合约"改为"前端调用合约成功后，客户端调用接口更新数据库"。

## 🔄 修改前后对比

### 修改前的流程
```
前端 → API接口 → 后端调用合约 → 更新数据库
```

### 修改后的流程
```
前端 → 调用合约 → 合约成功 → 前端调用API → 更新数据库
```

## 📝 具体修改内容

### 1. **前端Hook修改** (`src/hooks/useStakeContract.ts`)

**修改点：**
- `updateIaoTimes` 函数增加 `agentId` 参数
- 合约调用成功后，添加API调用逻辑更新数据库

**关键代码：**
```typescript
const updateIaoTimes = useCallback(async (startTime: number, endTime: number, agentId?: string): Promise<void> => {
  // ... 合约调用逻辑 ...
  
  // 合约调用成功后，调用API更新数据库中的IAO时间
  if (agentId) {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          updateStartTime: startTime,
          updateEndTime: endTime,
        }),
      });
      // ... 错误处理 ...
    } catch (error) {
      // 即使数据库更新失败，合约已经成功，所以不抛出错误
    }
  }
}, [/* ... */]);
```

### 2. **前端组件修改** (`src/components/agent-detail/IaoPool.tsx`)

**修改点：**
- 调用 `updateIaoTimes` 时传入 `agent.id` 参数

**关键代码：**
```typescript
<UpdateIaoTimeModal
  // ...
  onUpdateTimes={(startTime: number, endTime: number) => updateIaoTimes(startTime, endTime, agent.id)}
  // ...
/>
```

### 3. **后端API修改** (`src/app/api/agents/[id]/route.ts`)

**修改点：**
- 移除复杂的合约调用逻辑
- 简化为直接更新数据库
- 移除时间变化检测逻辑

**修改前：**
- 检查时间是否变化
- 调用外部合约API
- 复杂的错误处理

**修改后：**
```typescript
// 如果提供了时间更新参数，直接更新数据库中的IAO时间
if (updateStartTime && updateEndTime) {
  console.log(`[时间更新] 更新数据库中的IAO时间...`);
  
  try {
    // 记录时间更新历史
    await prisma.history.create({
      data: {
        action: 'update_time_from_client',
        result: 'success',
        agentId: params.id,
      },
    });
    
    // 更新Agent记录中的开始和结束时间
    await prisma.agent.update({
      where: { id: params.id },
      data: {
        iaoStartTime: BigInt(updateStartTime),
        iaoEndTime: BigInt(updateEndTime),
      },
    });
    
    console.log(`[时间更新] 数据库IAO时间更新成功`);
  } catch (error) {
    // 错误处理...
  }
}
```

### 4. **文档更新** (`docs/IAO_TIME_ARCHITECTURE.md`)

**修改点：**
- 更新架构图和数据流程
- 修改实现细节说明
- 更新使用方式和注意事项

## ✅ 优势

### 1. **更好的用户体验**
- 前端直接控制合约调用
- 即时的错误反馈
- 更清晰的操作状态

### 2. **简化的后端逻辑**
- 移除复杂的合约调用逻辑
- 减少外部依赖
- 更简单的错误处理

### 3. **更好的错误处理**
- 合约失败时不会影响数据库
- 数据库失败时不会影响合约状态
- 明确的错误边界

## 🔧 测试建议

### 1. **正常流程测试**
- 测试合约调用成功 + 数据库更新成功
- 验证前端状态更新正确

### 2. **异常情况测试**
- 合约调用失败（应该不调用API）
- 合约成功但API调用失败（合约状态保持，数据库不更新）
- 网络异常情况

### 3. **数据一致性测试**
- 验证合约和数据库时间一致性
- 测试并发更新情况

## 🐛 问题修复

### 问题：更新数据库IAO时间失败: 缺少必要参数

**原因：**
API接口的验证逻辑要求所有Agent更新都必须包含 `name`、`description`、`category`、`capabilities` 等必填字段，但IAO时间更新只需要 `updateStartTime` 和 `updateEndTime`。

**解决方案：**
```typescript
// 检测是否只是更新IAO时间
const isTimeUpdateOnly = updateStartTime && updateEndTime && !name && !description && !category && !capabilities;

// 只有在非时间更新时才验证必填字段
if (!isTimeUpdateOnly && (!name || !description || !category || !capabilities)) {
  throw new ApiError(400, '缺少必要参数');
}

// 如果只是更新时间，直接返回成功响应
if (isTimeUpdateOnly) {
  return createSuccessResponse(null, 'IAO时间更新成功');
}
```

## 📋 后续优化建议

1. **添加重试机制**：API调用失败时的重试逻辑
2. **数据同步检查**：定期检查合约和数据库的一致性
3. **用户反馈优化**：更详细的操作状态提示
