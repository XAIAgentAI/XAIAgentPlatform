// 代币爬取配置文件
const path = require('path');

// 配置参数
const CONFIG = {
    // 目标代币合约地址
    TOKEN_ADDRESS: '0x16d83F6B17914a4e88436251589194CA5AC0f452',
    // 输出文件路径
    OUTPUT_PATH: path.join(__dirname, '..', 'data', 'xaa_token_holders_pages.json'),
    // 每页数据条数
    ITEMS_COUNT: 50,
    // 请求延迟(ms)
    REQUEST_DELAY: 1000,
    // 是否输出详细日志
    VERBOSE: true,
    // 限制爬取的总数据条数
    MAX_HOLDERS: 10000,
    // 是否排除合约地址（基于is_contract字段），默认true
    EXCLUDE_CONTRACTS: true,
    // 是否将合约地址保存到单独的字段中，默认true
    SAVE_CONTRACTS: true,
    // 需要排除的钱包地址（不区分大小写）
    EXCLUDE_ADDRESSES: [
        '0x0000000000000000000000000000000000000000',
        '0x000000000000000000000000000000000000dEaD',
        '0x0000000000000000000000000000000000000001'    ]
};

module.exports = { CONFIG }; 