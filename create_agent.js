// 身份相关参数
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJhN2RmNTg1MS05Mjc3LTQ0NDYtYjdkZS01YTNhNmVhMzE3ODEiLCJhZGRyZXNzIjoiMHhkZTE4NGE2ODA5ODk4ZDgxMTg2ZGVmNWMwODIzZDIxMDdjMDAxZGEyIiwiaWF0IjoxNzU3Mzg4NjM0LCJleHAiOjE3NTc0NzUwMzR9.ABN1P30H7G-E-xg1D6NDFy1Q1rhZf1xUwbwICZtyubA";
const USER_ADDRESS = "0xde184A6809898D81186DeF5C0823d2107c001Da2";
const COOKIE = "_ga=GA1.1.1710894376.1754387073; NEXT_LOCALE=zh; wagmi.recentConnectorId=\"io.metamask\"; wagmi.store={\"state\":{\"connections\":{\"__type\":\"Map\",\"value\":[[\"3627cc2750f\",{\"accounts\":[\"0xde184A6809898D81186DeF5C0823d2107c001Da2\"],\"chainId\":19880818,\"connector\":{\"id\":\"io.metamask\",\"name\":\"MetaMask\",\"type\":\"injected\",\"uid\":\"3627cc2750f\"}}]]},\"chainId\":19880818,\"current\":\"3627cc2750f\"},\"version\":2}; _ga_K5PXZ5QS9P=GS2.1.s1757386910$o49$g1$t1757388638$j42$l0$h0";

// Payload数据
const payload = {
  name: "DecentralGPT",
  containerLink: "",
  description: "DecentralGPT is the world's first decentralized large language model (LLM) inference network. It aims to break the monopoly on AI computing power and build a secure, privacy-preserving, democratic, transparent, and universally accessible general artificial intelligence (AGI) platform. It supports a wide range of open-source and closed-source models, delivers high-performance AI inference services at significantly lower costs, and runs on a globally distributed GPU network, enabling truly decentralized AI.",
  category: "AI Agent",
  capabilities: ["chat", "information"],
  tokenAmount: "100000000000000000000000000",
  startTimestamp: 1757419200,
  durationHours: 24,
  rewardAmount: "1000000000000000000000000000000",
  rewardToken: "0xabcdef123",
  symbol: "DGC",
  avatar: "https://xaiagent.oss-ap-northeast-2.aliyuncs.com/chat/1757388677407_dbidqni.png",
  type: "AI Model",
  marketCap: "$0",
  change24h: "0",
  tvl: "$0",
  holdersCount: 0,
  volume24h: "$0",
  statusJA: "トランザクション可能",
  statusKO: "거래 가능",
  statusZH: "可交易",
  descriptionJA: "DecentralGPTは、世界初の分散型大規模言語モデル（LLM）推論ネットワークです。AI計算能力の独占を打破し、安全で、プライバシーを保護し、民主的で、透明性があり、誰でもアクセス可能な汎用人工知能（AGI）プラットフォームの構築を目指しています。幅広いオープンソースおよびクローズドソースモデルをサポートし、大幅に低いコストで高性能なAI推論サービスを提供し、グローバルに分散されたGPUネットワーク上で動作することで、真に分散型のAIを実現します。",
  descriptionKO: "DecentralGPT는 세계 최초의 분산형 대규모 언어 모델(LLM) 추론 네트워크입니다. AI 컴퓨팅 파워의 독점을 깨고 안전하고 개인정보를 보호하며 민주적이고 투명하며 누구나 접근할 수 있는 범용 인공지능(AGI) 플랫폼 구축을 목표로 합니다. 다양한 오픈소스 및 클로즈드소스 모델을 지원하고, 훨씬 낮은 비용으로 고성능 AI 추론 서비스를 제공하며, 전 세계에 분산된 GPU 네트워크에서 실행되어 진정한 분산형 AI를 구현합니다.",
  descriptionZH: "DecentralGPT是世界上第一个去中心化大语言模型（LLM）推理网络。它旨在打破AI算力垄断，构建一个安全、隐私保护、民主、透明且普遍可及的通用人工智能（AGI）平台。它支持广泛的开源和闭源模型，以显著更低的成本提供高性能AI推理服务，并运行在全球分布式GPU网络上，实现真正的去中心化AI。",
  socialLinks: "https://x.com/DecentralGPT,https://t.me/DecentralGPT",
  totalSupply: "1000000000000"
};

// 发送请求的函数
async function createAgent() {
  try {
    const response = await fetch("http://localhost:3000/api/agents/new", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "authorization": `Bearer ${AUTH_TOKEN}`,
        "cache-control": "no-cache",
        "content-type": "application/json",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": COOKIE,
        "Referer": "http://localhost:3000/zh/create"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Agent创建成功:", result);
      return result;
    } else {
      const error = await response.text();
      console.error("Agent创建失败:", response.status, error);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
  } catch (error) {
    console.error("请求出错:", error);
    throw error;
  }
}

// 执行函数
createAgent()
  .then(result => {
    console.log("操作完成");
  })
  .catch(error => {
    console.error("操作失败:", error);
  });