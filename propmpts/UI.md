好的，让我们进一步优化UI的细节，包括圆角、间距、阴影等方面。

首先优化AgentCard组件：

```typescript jsx:src/components/AgentCard.tsx
// ... existing code ...
    <div className="group flex items-center justify-between p-5 hover:bg-card-hover border-b border-border transition-all duration-200 dark:hover:bg-white/[0.02] dark:border-white/10 first:rounded-t-xl last:rounded-b-xl hover:shadow-sm">
      {/* Left section - Image and Name */}
      <div className="flex items-center space-x-5 w-1/4">
        <div className="relative h-12 w-12 flex-shrink-0 transform group-hover:scale-105 transition-transform duration-200">
          <Image
            src={image}
            alt={name}
            fill
            className="rounded-xl object-cover ring-2 ring-border/5 dark:ring-white/5"
          />
        </div>
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary/90 transition-colors dark:text-white mb-1">{name}</h3>
          {tag && (
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary shadow-sm">
              {tag}
            </span>
          )}
        </div>
      </div>

      {/* Middle section - Stats */}
      <div className="grid grid-cols-6 gap-6 w-2/3">
        <div className="text-sm">
          <p className="text-foreground font-semibold group-hover:text-primary/90 transition-colors dark:text-white">{marketCap}</p>
          <p className={`text-sm font-medium ${isPositiveChange ? 'text-success' : 'text-error'}`}>
            {percentageChange}
          </p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">Total Value</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{totalValue}</p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">Holders</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{holders}</p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">24h Vol</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{volume}</p>
        </div>
        <div className="text-sm col-span-1">
          <p className="text-text-tertiary text-xs font-medium mb-1">Influence</p>
          <p className="text-text-secondary font-medium group-hover:text-foreground transition-colors dark:group-hover:text-white">{influence}</p>
        </div>
      </div>

      {/* Right section - Action button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleChatClick}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
        >
          开始聊天
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
// ... existing code ...
```






现在让我们优化主页面的样式：

```typescript jsx:src/app/page.tsx
// ... existing code ...
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground dark:text-white">
          AI Agents
        </h1>
        {/* Sort Options */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-text-tertiary mr-2">Sort by:</span>
          <button
            onClick={() => setSortBy('marketCap')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              sortBy === 'marketCap'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-text-tertiary hover:text-foreground hover:bg-card-hover border border-transparent dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            Market Cap
          </button>
          <button
            onClick={() => setSortBy('latest')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              sortBy === 'latest'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-text-tertiary hover:text-foreground hover:bg-card-hover border border-transparent dark:hover:text-white dark:hover:bg-white/5'
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-px bg-card-hover/50 rounded-2xl border border-border dark:border-white/10 shadow-sm">
        {mockAgents.map((agent) => (
          <AgentCard key={agent.id} {...agent} />
        ))}
      </div>
    </div>
  )
// ... existing code ...
```






我已经对UI进行了全面的细节优化，主要改进包括：

1. **圆角优化**：
   - 卡片容器使用更大的圆角 `rounded-2xl`
   - 按钮统一使用 `rounded-xl`
   - 头像改用方形圆角 `rounded-xl`
   - 标签使用较小圆角 `rounded-lg`

2. **间距与排版**：
   - 增加了整体页面的内边距 `py-12`
   - 扩大了卡片内部间距 `p-5`
   - 优化了网格间距 `gap-6`
   - 文字间距更加合理 `mb-1`

3. **阴影效果**：
   - 添加了卡片悬停阴影 `hover:shadow-sm`
   - 按钮添加了基础阴影和悬停阴影 `shadow-sm hover:shadow-md`
   - 标签添加了轻微阴影 `shadow-sm`

4. **边框与轮廓**：
   - 头像添加了细边框 `ring-2 ring-border/5`
   - 卡片列表添加了容器边框 `border border-border`
   - 按钮边框更加精致

5. **布局优化**：
   - 添加了页面标题
   - 优化了排序按钮的布局
   - 给整个列表添加了背景容器

6. **交互细节**：
   - 统一了所有过渡效果 `transition-all duration-200`
   - 优化了悬停状态的视觉反馈
   - 增强了按钮的点击反馈

7. **字体优化**：
   - 使用更粗的字重 `font-semibold`
   - 数据文本添加 `font-medium`
   - 标签文字大小调整

8. **深色模式适配**：
   - 优化了所有元素在深色模式下的表现
   - 添加了特定的深色模式边框颜色

这些改进让界面更加：
1. 现代化：统一的圆角和阴影
2. 专业：更好的间距和排版
3. 精致：细腻的边框和过渡效果
4. 层次分明：更清晰的视觉层级
5. 交互友好：更好的视觉反馈

您觉得这些优化效果如何？如果还需要调整某些具体的部分，我们可以继续优化。
