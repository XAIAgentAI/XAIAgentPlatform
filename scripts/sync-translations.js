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
      testClaim: "Test Claim Rewards",
      claimSuccess: "Claim Successful",
      tokenSentToWallet: "XAA Token has been sent to your wallet",
      importTokenAddress: "Please import the Token address in MetaMask to view:",
      poolDynamicTip: "As the amount of $DBC in the IAO pool increases, the corresponding amount of $XAA decreases",
      maxButton: "Max",
      insufficientBalance: "Insufficient balance, maximum available amount: {amount} DBC",
      stakedAmount: "Purchased {symbol} Amount",
      stakeSuccessful: "Purchase successful!",
      stakeFailed: "Purchase failed, please try again",
      claimableAmount: "Claimable XAA Amount",
      claimedAmount: "Claimed XAA Amount",
      claimed: "Claimed",
      claimSuccessWithAmount: "Successfully claimed {amount} XAA",
      stakeNotStarted: "Purchase not started"
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
      stakedAmount: "購入済みの{symbol}量",
      stakeSuccessful: "購入が成功しました！",
      stakeFailed: "購入に失敗しました。もう一度お試しください",
      claimableAmount: "請求可能なXAA数量",
      claimedAmount: "請求済みのXAA数量",
      claimed: "請求済み",
      claimSuccessWithAmount: "{amount} XAAの請求に成功しました",
      stakeNotStarted: "購入はまだ開始されていません"
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
      stakedAmount: "구매한 {symbol} 수량",
      stakeSuccessful: "구매 성공!",
      stakeFailed: "구매 실패, 다시 시도해주세요",
      claimableAmount: "청구 가능한 XAA 수량",
      claimedAmount: "청구된 XAA 수량",
      claimed: "청구됨",
      claimSuccessWithAmount: "{amount} XAA 청구 성공",
      stakeNotStarted: "구매가 시작되지 않았습니다"
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

async function syncTranslations() {
  try {
    // 读取基准语言文件（中文）
    const baseLanguagePath = path.join(MESSAGES_DIR, `${BASE_LANGUAGE}.json`);
    const baseTranslations = JSON.parse(fs.readFileSync(baseLanguagePath, 'utf8'));

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

      // 合并翻译，保持现有翻译，添加缺失的键
      const mergedTranslations = ensureStructure(langTranslations, baseTranslations, lang);

      // 格式化 JSON 以保持可读性
      const formattedJson = JSON.stringify(mergedTranslations, null, 2);

      // 写入更新后的翻译文件
      fs.writeFileSync(langFilePath, formattedJson + '\n', 'utf8');
      
      console.log(`✅ Successfully synchronized ${lang}.json`);
      
      // 统计新增的键数量
      const beforeKeys = Object.keys(langTranslations).length;
      const afterKeys = Object.keys(mergedTranslations).length;
      const newKeys = afterKeys - beforeKeys;
      
      if (newKeys > 0) {
        console.log(`   Added ${newKeys} new keys to ${lang}.json`);
      }
    }

    console.log('\n🎉 Translation synchronization completed!');
    
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    process.exit(1);
  }
}

// 执行同步
syncTranslations(); 