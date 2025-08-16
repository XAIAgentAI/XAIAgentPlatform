// 原生币爬取配置文件
const path = require('path');

const CONFIG = {
    // 输出文件路径
    OUTPUT_PATH: path.join(__dirname, '../data/native_holders_pages.json'),
    
    // 扫描器配置
    SCANNER_URL: 'https://www.dbcscan.io',
    
    // 爬取配置
    ITEMS_COUNT: 50,           // 每页数据条数
    REQUEST_DELAY: 200,       // 请求间隔延迟(ms)
    MAX_HOLDERS: 10000,         // 最大爬取持有者数量
    
    // 数据过滤配置
    EXCLUDE_CONTRACTS: true,   // 是否排除合约地址（基于is_contract字段）
    SAVE_CONTRACTS: true,      // 是否将合约地址保存到单独的字段中，默认true
    EXCLUDE_ADDRESSES: [
        '0x0000000000000000000000000000000000000000',
        '0x000000000000000000000000000000000000dEaD',
        '0x0000000000000000000000000000000000000001'   
    ]      
    
    // 注意：现在使用响应中的is_contract字段来判断是否排除地址
    // 如果is_contract为true，则排除该地址
    // 系统会自动补充更多地址以达到MAX_HOLDERS目标数量
};

module.exports = { CONFIG }; 