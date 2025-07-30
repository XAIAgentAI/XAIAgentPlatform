const fs = require('fs');
const path = require('path');

// 支持的语言列表
const SUPPORTED_LANGUAGES = ['en', 'ja', 'ko'];
const BASE_LANGUAGE = 'zh';
const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// 默认翻译映射
const DEFAULT_TRANSLATIONS = {
  en: {
    common: {
      connect: "Connect Wallet",
      disconnect: "Disconnect",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      search: "Search Agent/Contract Address",
      buy: "Buy",
      sell: "Sell",
      buyAgent: "Buy",
      sellAgent: "Sell",
      stake: "Buy",
      unstake: "Sell",
      timeUnits: {
        days: "Days",
        hours: "Hours",
        minutes: "Minutes",
        seconds: "Seconds"
      },
      social: "Social"
    },
    iaoPool: {
      title: "IAO Pool",
      totalInPool: "Total {symbol} in IAO Pool",
      currentTotal: "Current Total {symbol} in IAO Pool",
      endCountdown: "End Countdown",
      toBeAnnounced: "To Be Announced",
      youSend: "You Send",
      iaoNotStarted: "IAO has not started yet",
      buyAmount: "Purchased {symbol} Amount",
      error: "Error",
      success: "Success",
      connectWalletFirst: "Please connect wallet first",
      enterValidAmount: "Please enter a valid purchase amount",
      buySuccessful: "Purchase successful!",
      buyFailed: "Purchase failed, please try again",
      buyNotStarted: "Purchase not started",
      processing: "Processing...",
      send: "Send",
      loadingData: "Loading data...",
      loading: "Loading...",
      claimAfterCountdown: "Claim available after countdown ends",
      testClaim: "Claim Rewards",
      claimSuccess: "Claim Successful",
      tokenSentToWallet: "XAA Token has been sent to your wallet",
      importTokenAddress: "Please import the Token address in MetaMask to view:",
      poolDynamicTip: "As the amount of $DBC in the IAO pool increases, the corresponding amount of $XAA decreases",
      maxButton: "Max",
      insufficientBalance: "Insufficient balance, maximum available amount: {amount} DBC",
      investedAmount: "Purchased {symbol} Amount",
      investSuccessful: "Purchase successful!",
      investFailed: "Purchase failed, please try again",
      claimableAmount: "Claimable XAA Amount",
      claimedAmount: "Claimed XAA Amount",
      claimed: "Claimed",
      claimSuccessWithAmount: "Successfully claimed {amount} XAA",
      investNotStarted: "Purchase not started"
    },
    datePicker: {
      selectDateTime: "Select Date and Time",
      selectTimezone: "Select Timezone",
      commonTimezones: "Common Timezones",
      time: {
        am: "AM",
        pm: "PM"
      },
      timezones: {
        beijing: "Beijing/Shanghai",
        tokyo: "Tokyo/Seoul",
        singapore: "Singapore/Hong Kong",
        newYork: "New York",
        losAngeles: "Los Angeles",
        london: "London",
        paris: "Paris/Berlin",
        sydney: "Sydney",
        utc: "Coordinated Universal Time"
      }
    }
  },
  ja: {
    common: {
      connect: "ウォレットを接続",
      disconnect: "切断",
      loading: "読み込み中...",
      error: "エラー",
      success: "成功",
      search: "エージェント/コントラクトアドレスを検索",
      buy: "購入",
      sell: "売却",
      buyAgent: "購入",
      sellAgent: "売却",
      stake: "購入",
      unstake: "売却",
      timeUnits: {
        days: "日",
        hours: "時間",
        minutes: "分",
        seconds: "秒"
      },
      social: "ソーシャル"
    },
    iaoPool: {
      title: "IAOプール",
      totalInPool: "IAOプール内の{symbol}の総量",
      currentTotal: "IAOプール内の{symbol}の現在の総量",
      endCountdown: "終了までのカウントダウン",
      toBeAnnounced: "近日発表",
      youSend: "送信する量",
      iaoNotStarted: "IAOはまだ開始されていません",
      buyAmount: "購入済みの{symbol}量",
      error: "エラー",
      success: "成功",
      connectWalletFirst: "先にウォレットを接続してください",
      enterValidAmount: "有効な購入量を入力してください",
      buySuccessful: "購入が成功しました！",
      buyFailed: "購入に失敗しました。もう一度お試しください",
      buyNotStarted: "購入はまだ開始されていません",
      processing: "処理中...",
      send: "送信",
      loadingData: "データを読み込み中...",
      loading: "読み込み中...",
      claimAfterCountdown: "カウントダウン終了後に請求可能",
      testClaim: "報酬をテスト請求",
      claimSuccess: "請求成功",
      tokenSentToWallet: "XAAトークンがウォレットに送信されました",
      importTokenAddress: "MetaMaskでトークンアドレスをインポートして確認してください：",
      poolDynamicTip: "IAOプール内の$DBCの量が増えるにつれて、対応する$XAAの量は減少します",
      maxButton: "最大",
      insufficientBalance: "残高不足、利用可能な最大額：{amount} DBC",
      investedAmount: "購入済みの{symbol}量",
      investSuccessful: "購入が成功しました！",
      investFailed: "購入に失敗しました。もう一度お試しください",
      claimableAmount: "請求可能なXAA数量",
      claimedAmount: "請求済みのXAA数量",
      claimed: "請求済み",
      claimSuccessWithAmount: "{amount} XAAの請求に成功しました",
      investNotStarted: "購入はまだ開始されていません"
    },
    datePicker: {
      selectDateTime: "日付と時刻を選択",
      selectTimezone: "タイムゾーンを選択",
      commonTimezones: "一般的なタイムゾーン",
      time: {
        am: "午前",
        pm: "午後"
      },
      timezones: {
        beijing: "北京/上海",
        tokyo: "東京/ソウル",
        singapore: "シンガポール/香港",
        newYork: "ニューヨーク",
        losAngeles: "ロサンゼルス",
        london: "ロンドン",
        paris: "パリ/ベルリン",
        sydney: "シドニー",
        utc: "協定世界時"
      }
    }
  },
  ko: {
    common: {
      connect: "지갑 연결",
      disconnect: "연결 해제",
      loading: "로딩 중...",
      error: "오류",
      success: "성공",
      search: "에이전트/계약 주소 검색",
      buy: "구매",
      sell: "판매",
      buyAgent: "구매",
      sellAgent: "판매",
      stake: "구매",
      unstake: "판매",
      timeUnits: {
        days: "일",
        hours: "시간",
        minutes: "분",
        seconds: "초"
      },
      social: "소셜"
    },
    iaoPool: {
      title: "IAO 풀",
      totalInPool: "IAO 풀의 총 {symbol} 수량",
      currentTotal: "IAO 풀의 현재 총 {symbol} 수량",
      endCountdown: "종료까지 남은 시간",
      toBeAnnounced: "곧 발표",
      youSend: "입금 수량",
      iaoNotStarted: "IAO가 아직 시작되지 않았습니다",
      buyAmount: "구매한 {symbol} 수량",
      error: "오류",
      success: "성공",
      connectWalletFirst: "먼저 지갑을 연결해주세요",
      enterValidAmount: "유효한 구매 수량을 입력해주세요",
      buySuccessful: "구매 성공!",
      buyFailed: "구매 실패, 다시 시도해주세요",
      buyNotStarted: "구매가 시작되지 않았습니다",
      processing: "처리 중...",
      send: "전송",
      loadingData: "데이터 로딩 중...",
      loading: "로딩 중...",
      claimAfterCountdown: "카운트다운 종료 후 청구 가능",
      testClaim: "보상 테스트 청구",
      claimSuccess: "청구 성공",
      tokenSentToWallet: "XAA 토큰이 지갑으로 전송되었습니다",
      importTokenAddress: "MetaMask에서 토큰 주소를 가져와 확인하세요:",
      poolDynamicTip: "IAO 풀의 $DBC 수량이 증가함에 따라 해당하는 $XAA 수량은 감소합니다",
      maxButton: "최대",
      insufficientBalance: "잔액 부족, 최대 사용 가능 금액: {amount} DBC",
      investedAmount: "구매한 {symbol} 수량",
      investSuccessful: "구매 성공!",
      investFailed: "구매 실패, 다시 시도해주세요",
      claimableAmount: "청구 가능한 XAA 수량",
      claimedAmount: "청구된 XAA 수량",
      claimed: "청구됨",
      claimSuccessWithAmount: "{amount} XAA 청구 성공",
      investNotStarted: "구매가 시작되지 않았습니다"
    },
    datePicker: {
      selectDateTime: "날짜 및 시간 선택",
      selectTimezone: "시간대 선택",
      commonTimezones: "일반 시간대",
      time: {
        am: "오전",
        pm: "오후"
      },
      timezones: {
        beijing: "베이징/상하이",
        tokyo: "도쿄/서울",
        singapore: "싱가포르/홍콩",
        newYork: "뉴욕",
        losAngeles: "로스앤젤레스",
        london: "런던",
        paris: "파리/베를린",
        sydney: "시드니",
        utc: "협정 세계시"
      }
    }
  }
};

// 深度合并对象
function deepMerge(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        // 如果目标对象中不存在该键，则使用源对象的值
        if (!target.hasOwnProperty(key)) {
          target[key] = source[key];
        }
      }
    }
  }
  return target;
}

// 确保对象具有相同的键结构，并使用默认翻译
function ensureStructure(target, source, lang) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        if (!result[key] || typeof result[key] !== 'object') {
          result[key] = {};
        }
        result[key] = ensureStructure(result[key], source[key], lang);
      } else if (!result.hasOwnProperty(key)) {
        // 如果是缺失的键，先尝试使用默认翻译
        const defaultTranslation = getDefaultTranslation(key, source[key], lang);
        result[key] = defaultTranslation || `[${lang}] ${source[key]}`; // 如果没有默认翻译，添加语言标记
      } else if (typeof result[key] === 'string' && result[key].startsWith(`[${lang}]`)) {
        // 如果有占位符翻译，尝试用默认翻译替换
        const defaultTranslation = getDefaultTranslation(key, source[key], lang);
        if (defaultTranslation) {
          result[key] = defaultTranslation;
        }
      }
    }
  }
  
  return result;
}

// 获取默认翻译
function getDefaultTranslation(key, value, lang) {
  try {
    // 遍历默认翻译对象查找匹配的键
    const defaultLangTranslations = DEFAULT_TRANSLATIONS[lang];
    if (!defaultLangTranslations) return null;

    // 在默认翻译中查找对应的值
    for (const section in defaultLangTranslations) {
      const found = findValueInObject(defaultLangTranslations[section], key);
      if (found !== undefined) {
        return found;
      }
    }
  } catch (error) {
    console.warn(`Warning: Error finding default translation for ${key} in ${lang}`);
  }
  return null;
}

// 在对象中递归查找值
function findValueInObject(obj, key) {
  if (obj.hasOwnProperty(key)) {
    return obj[key];
  }

  for (const k in obj) {
    if (typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      const found = findValueInObject(obj[k], key);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
}

// 更新已存在但未翻译的占位符翻译
function updatePlaceholderTranslations(translations, lang) {
  const updated = { ...translations };
  let replacedCount = 0;
  
  function traverse(obj, path = []) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = [...path, key];
        
        if (typeof obj[key] === 'string' && obj[key].startsWith(`[${lang}]`)) {
          // 尝试获取默认翻译
          const defaultTranslation = getDefaultTranslation(key, obj[key].replace(`[${lang}] `, ''), lang);
          if (defaultTranslation) {
            obj[key] = defaultTranslation;
            replacedCount++;
            console.log(`   Replaced placeholder [${currentPath.join('.')}] with default translation`);
          }
        } else if (obj[key] instanceof Object && !Array.isArray(obj[key])) {
          traverse(obj[key], currentPath);
        }
      }
    }
  }
  
  traverse(updated);
  return { translations: updated, replacedCount };
}

// 递归计算对象中的键数量
function countKeys(obj) {
  let count = 0;

  function traverse(o) {
    for (const key in o) {
      if (o.hasOwnProperty(key)) {
        count++;
        if (o[key] instanceof Object && !Array.isArray(o[key])) {
          traverse(o[key]);
        }
      }
    }
  }

  traverse(obj);
  return count;
}

// 检查翻译完整性
function checkTranslationCompleteness(translations, lang) {
  const issues = [];

  function traverse(obj, path = []) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = [...path, key];
        const pathString = currentPath.join('.');

        if (typeof obj[key] === 'string') {
          // 检查是否有未翻译的占位符
          if (obj[key].startsWith(`[${lang}]`)) {
            issues.push({
              type: 'untranslated',
              path: pathString,
              value: obj[key]
            });
          }
          // 检查是否有其他语言的占位符
          else if (obj[key].match(/^\[(?:en|ja|ko|zh)\]/)) {
            issues.push({
              type: 'wrong_language',
              path: pathString,
              value: obj[key]
            });
          }
        } else if (obj[key] instanceof Object && !Array.isArray(obj[key])) {
          traverse(obj[key], currentPath);
        }
      }
    }
  }

  traverse(translations);
  return issues;
}

// 生成翻译报告
function generateTranslationReport(baseTranslations, allTranslations) {
  const report = {
    baseKeys: countKeys(baseTranslations),
    languages: {}
  };

  for (const lang of SUPPORTED_LANGUAGES) {
    const translations = allTranslations[lang] || {};
    const issues = checkTranslationCompleteness(translations, lang);
    const translatedKeys = countKeys(translations);
    const completeness = Math.round((translatedKeys / report.baseKeys) * 100);

    report.languages[lang] = {
      totalKeys: translatedKeys,
      completeness: `${completeness}%`,
      issues: issues.length,
      untranslated: issues.filter(i => i.type === 'untranslated').length,
      wrongLanguage: issues.filter(i => i.type === 'wrong_language').length
    };
  }

  return report;
}

// 显示翻译报告
function displayTranslationReport(report) {
  console.log('\n📊 Translation Completeness Report');
  console.log('=====================================');
  console.log(`Base language (${BASE_LANGUAGE}) keys: ${report.baseKeys}`);
  console.log('');

  for (const [lang, data] of Object.entries(report.languages)) {
    console.log(`${lang.toUpperCase()}:`);
    console.log(`  Keys: ${data.totalKeys}/${report.baseKeys} (${data.completeness})`);
    if (data.issues > 0) {
      console.log(`  Issues: ${data.issues} total`);
      if (data.untranslated > 0) {
        console.log(`    - ${data.untranslated} untranslated`);
      }
      if (data.wrongLanguage > 0) {
        console.log(`    - ${data.wrongLanguage} wrong language markers`);
      }
    } else {
      console.log(`  ✅ No issues found`);
    }
    console.log('');
  }
}

// 递归收集所有 value 为“需要配置”的字段，结构和zh一致
function collectPendingTranslations(zhObj, langObj) {
  if (Array.isArray(zhObj)) return undefined;
  if (typeof zhObj !== 'object' || zhObj === null) return undefined;
  const result = {};
  for (const key of Object.keys(zhObj)) {
    if (langObj && langObj[key] === '需要配置') {
      result[key] = '需要配置';
    } else if (typeof zhObj[key] === 'object' && zhObj[key] !== null) {
      const child = collectPendingTranslations(zhObj[key], langObj ? langObj[key] : undefined);
      if (child && Object.keys(child).length > 0) result[key] = child;
    }
  }
  return result;
}

// 递归批量写回翻译
function applyTranslations(langObj, pendingObj, translatedObj) {
  if (Array.isArray(langObj)) return langObj;
  if (typeof langObj !== 'object' || langObj === null) return langObj;
  const result = { ...langObj };
  for (const key of Object.keys(langObj)) {
    // 只要 pendingObj 有该 key，并且 translatedObj 有内容，就写回
    if (pendingObj && typeof pendingObj[key] !== 'undefined' && typeof translatedObj?.[key] !== 'undefined') {
      result[key] = translatedObj[key];
    } else if (typeof langObj[key] === 'object' && langObj[key] !== null) {
      result[key] = applyTranslations(langObj[key], pendingObj ? pendingObj[key] : undefined, translatedObj ? translatedObj[key] : undefined);
    }
  }
  return result;
}

// 导出所有待翻译对象
function exportPendingTranslations() {
  const zhPath = path.join(MESSAGES_DIR, `${BASE_LANGUAGE}.json`);
  const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  SUPPORTED_LANGUAGES.forEach(lang => {
    const langPath = path.join(MESSAGES_DIR, `${lang}.json`);
    if (!fs.existsSync(langPath)) {
      console.warn(`文件不存在: ${langPath}，跳过`);
      return;
    }
    const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const pending = collectPendingTranslations(zh, langJson);
    const outPath = path.join(MESSAGES_DIR, `pending-translation.${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(pending, null, 2) + '\n', 'utf8');
    console.log(`已导出待翻译对象: ${outPath}`);
  });
}

// 导入翻译并批量写回
function importPendingTranslations() {
  const zhPath = path.join(MESSAGES_DIR, `${BASE_LANGUAGE}.json`);
  const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  SUPPORTED_LANGUAGES.forEach(lang => {
    const langPath = path.join(MESSAGES_DIR, `${lang}.json`);
    const pendingPath = path.join(MESSAGES_DIR, `pending-translation.${lang}.json`);
    const translatedPath = path.join(MESSAGES_DIR, `pending-translation.${lang}.translated.json`);
    // 优先用 translated.json，没有就用 pending-translation.xx.json
    let translatedFileToUse = translatedPath;
    if (!fs.existsSync(translatedFileToUse) && fs.existsSync(pendingPath)) {
      translatedFileToUse = pendingPath;
    }
    if (!fs.existsSync(langPath) || !fs.existsSync(pendingPath) || !fs.existsSync(translatedFileToUse)) {
      console.warn(`缺少 ${lang}.json 或 pending-translation 文件，跳过`);
      return;
    }
    const langJson = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
    const translated = JSON.parse(fs.readFileSync(translatedFileToUse, 'utf8'));
    const updated = applyTranslations(langJson, pending, translated);
    fs.writeFileSync(langPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
    console.log(`已批量写回翻译到: ${langPath}`);
  });
}

async function syncTranslations() {
  try {
    console.log('🔄 Starting translation synchronization...\n');

    // 读取基准语言文件（中文）
    const baseLanguagePath = path.join(MESSAGES_DIR, `${BASE_LANGUAGE}.json`);
    const baseTranslations = JSON.parse(fs.readFileSync(baseLanguagePath, 'utf8'));

    // 存储所有翻译以生成报告
    const allTranslations = {};

    // 同步每种语言
    for (const lang of SUPPORTED_LANGUAGES) {
      const langFilePath = path.join(MESSAGES_DIR, `${lang}.json`);
      let langTranslations = {};

      // 如果语言文件存在，读取它
      if (fs.existsSync(langFilePath)) {
        try {
          langTranslations = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
        } catch (error) {
          console.error(`Error reading ${lang}.json:`, error);
          continue;
        }
      }

      // 首先更新已存在但未翻译的占位符
      const { translations: updatedTranslations, replacedCount } = updatePlaceholderTranslations(langTranslations, lang);
      langTranslations = updatedTranslations;

      // 合并翻译，保持现有翻译，添加缺失的键
      const mergedTranslations = ensureStructure(langTranslations, baseTranslations, lang);

      // 格式化 JSON 以保持可读性
      const formattedJson = JSON.stringify(mergedTranslations, null, 2);

      // 写入更新后的翻译文件
      fs.writeFileSync(langFilePath, formattedJson + '\n', 'utf8');

      // 存储翻译以生成报告
      allTranslations[lang] = mergedTranslations;

      console.log(`✅ Successfully synchronized ${lang}.json`);

      // 统计新增的键数量
      const beforeKeys = countKeys(langTranslations);
      const afterKeys = countKeys(mergedTranslations);
      const newKeys = afterKeys - beforeKeys;

      if (newKeys > 0) {
        console.log(`   Added ${newKeys} new keys to ${lang}.json`);
      }

      if (replacedCount > 0) {
        console.log(`   Replaced ${replacedCount} placeholder translations with defaults`);
      }
    }

    // 生成并显示翻译报告
    const report = generateTranslationReport(baseTranslations, allTranslations);
    displayTranslationReport(report);

    console.log('🎉 Translation synchronization completed!');

  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    process.exit(1);
  }
}

// 添加命令行参数支持
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    checkOnly: false,
    verbose: false,
    exportPending: false,
    importPending: false
  };

  for (const arg of args) {
    switch (arg) {
      case '--check':
      case '-c':
        options.checkOnly = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--export-pending':
        options.exportPending = true;
        break;
      case '--import-pending':
        options.importPending = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Translation Sync Tool

Usage: node sync-translations.js [options]

Options:
  -c, --check           Only check translation completeness, don't sync
  -v, --verbose         Show detailed information
  --export-pending      Export all fields that need translation to pending-translation.xx.json
  --import-pending      Import translated fields from pending-translation.xx.translated.json and write back
  -h, --help            Show this help message

Examples:
  node sync-translations.js --export-pending
  node sync-translations.js --import-pending
  node sync-translations.js           # Sync all translations
  node sync-translations.js --check   # Only check completeness
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// 仅检查翻译完整性的函数
async function checkTranslations() {
  try {
    console.log('🔍 Checking translation completeness...\n');

    const baseLanguagePath = path.join(MESSAGES_DIR, `${BASE_LANGUAGE}.json`);
    const baseTranslations = JSON.parse(fs.readFileSync(baseLanguagePath, 'utf8'));

    const allTranslations = {};

    for (const lang of SUPPORTED_LANGUAGES) {
      const langFilePath = path.join(MESSAGES_DIR, `${lang}.json`);
      if (fs.existsSync(langFilePath)) {
        try {
          allTranslations[lang] = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
        } catch (error) {
          console.error(`Error reading ${lang}.json:`, error);
          allTranslations[lang] = {};
        }
      } else {
        allTranslations[lang] = {};
      }
    }

    const report = generateTranslationReport(baseTranslations, allTranslations);
    displayTranslationReport(report);

  } catch (error) {
    console.error('❌ Error during check:', error);
    process.exit(1);
  }
}

// 主执行函数
async function main() {
  const options = parseArguments();
  if (options.exportPending) {
    exportPendingTranslations();
    return;
  }
  if (options.importPending) {
    importPendingTranslations();
    return;
  }
  if (options.checkOnly) {
    await checkTranslations();
  } else {
    await syncTranslations();
  }
}

// 执行主函数
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});