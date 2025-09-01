export const config = {
  ws: {
    serverUrl: process.env.NEXT_PUBLIC_WS_SERVER_URL || 'http://127.0.0.1:5000',
    path: process.env.NEXT_PUBLIC_WS_PATH || '/socket.io',
  },
  iao: {
    // IAO开始时间默认值（天数）
    defaultStartDays: 1,
    defaultStartHours: 0,
    // IAO持续时间默认值（天数）
    defaultDurationDays: 5,
    defaultDurationHours: 0,
    // IAO持续时间限制（小时数）
    minDurationHours: 120, // 5天
    maxDurationHours: 240, // 10天
    // IAO开始时间最小延迟（小时数）
    minStartDelayHours: 24, // 1天
  }
} as const 