// 用于同步 messages/xx.json 的 key 结构和顺序与 messages/zh.json 保持一致（value优先用原有内容，无则“需要配置”）
// 支持 en、ja、ko 多语言批量同步
const fs = require('fs');
const path = require('path');

const targetLangs = ['en', 'ja', 'ko'];
const baseDir = path.join(__dirname, 'messages');
const zhPath = path.join(baseDir, 'zh.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// 递归同步结构和顺序，收集新增key路径
function syncKeys(zhObj, langObj, pathArr = [], addedKeys = []) {
  if (Array.isArray(zhObj)) {
    return Array.isArray(langObj) ? langObj : zhObj;
  }
  if (typeof zhObj !== 'object' || zhObj === null) {
    if (langObj !== undefined) return langObj;
    addedKeys.push(pathArr.join('.'));
    return '需要配置';
  }
  const result = {};
  for (const key of Object.keys(zhObj)) {
    result[key] = syncKeys(zhObj[key], langObj ? langObj[key] : undefined, [...pathArr, key], addedKeys);
  }
  return result;
}

function main() {
  const zh = readJson(zhPath);
  targetLangs.forEach(lang => {
    const filePath = path.join(baseDir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`文件不存在: ${filePath}，跳过`);
      return;
    }
    const langJson = readJson(filePath);
    const addedKeys = [];
    const synced = syncKeys(zh, langJson, [], addedKeys);
    writeJson(filePath, synced);
    if (addedKeys.length > 0) {
      console.log(`【${lang}.json】以下key为zh.json新增，${lang}.json中原本不存在，已自动填为“需要配置”：`);
      addedKeys.forEach(k => console.log('  ' + k));
    } else {
      console.log(`【${lang}.json】没有新增key。`);
    }
    console.log(`【${lang}.json】结构和顺序已与zh.json同步，value优先保留原有内容。`);
  });
}

main(); 