export interface LocalAgent {
  id: number;
  name: string;
  avatar: string;
  symbol: string;
  type: "Platform" | "Infrastructure" | "AI Agent";
  marketCap: string;
  change24h: string;
  tvl: string;
  holdersCount: number;
  volume24h: string;
  status: string;
  description?: string;
  descriptionJA?: string;
  descriptionKO?: string;
  descriptionZH?: string;
  detailDescription?: string;
  lifetime?: string;
  createdAt?: string;
  creatorAddress?: string;
  tokens?: string;
  descriptionEN?: string;
  totalSupply?: string;
  useCases?: string[];
  useCasesJA?: string[];
  useCasesKO?: string[];
  useCasesZH?: string[];
  socialLinks?: string;
  chatEntry?: string;
  statusJA?: string;
  statusKO?: string;
  statusZH?: string;
}

export const localAgents: LocalAgent[] = [
  {
    id: 1,
    name: "XAIAgent",
    tokens: "0x16d83F6B17914a4e88436251589194CA5AC0f452",
    avatar: "/logo/XAIAgent.png",
    symbol: "XAA",
    type: "Platform",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "IAO in progress.",
    statusJA: "IAOが進行中です。",
    statusKO: "IAO가 진행 중입니다.",
    statusZH: "IAO 进行中。",
    description: "XAIAgent is a decentralized AI agent platform that integrates AI agent creation, usage, deployment and trading.",
    descriptionJA: "XAIAgentは、AIエージェントの作成、使用、デプロイメント、取引を統合した分散型AIエージェントプラットフォームです。",
    descriptionKO: "XAIAgent는 AI Agent의 생성, 활용, 배포 및 거래를 하나로 통합한 블록체인 기반 탈중앙화 AI Agent 플랫폼입니다. 노코드 개발 도구를 통해 일반 사용자는 손쉽게 AI Agent를 만들 수 있고, XAgentScope 프레임워크를 통해 고급 개발자는 더욱 정교한 AI Agent를 개발 및 배포할 수 있으며, DBC 체인의 GPU 채굴 네트워크를 활용해 AI 실행의 완전한 탈중앙화를 보장하면서 데이턄 프라이버시, 높은 성능, 저비용의 장점을 제공하고, 다양한 AI 모델을 내장해 복잡한 작업과 다중 회차 대화를 지원하며, 멀티 토큰 경제 모델을 통해 생태계의 지속적인 성장을 촉진하는 AI와 블록체인의 융합형 올인원 플랫폼입니다.",
    descriptionZH: "XAIAgent是一个基于区块链的去中心化AI Agent平台，集AI Agent的创建、使用、发射与交易于一体。通过零代码开发工具服务普通用户，同时提供XAgentScope框架支持高级开发者。XAIAgent依托DBC链的GPU矿工网络，确保AI运行完全去中心化，具备数据隐私、高性能和低成本优势。平台内置多种AI模型，支持复杂任务和多轮对话场景，多代币经济模型促进生态稳定发展，是AI与区块链融合的全功能平台。",
    createdAt: "4 months ago",
    creatorAddress: "0x1C4C...F463a3",
    totalSupply: "20,000,000,000 XAA",
    useCases: [
      "Help me create an AI Agent",
      "What functions do you have?",
      "What types of AI Agents can you create?",
      "Can you tell me how to use xx as an Agent?"
    ],
    useCasesJA: [
      "AIエージェントの作成を手伝ってください",
      "どんな機能がありますか？",
      "どのようなタイプのAIエージェントを作成できますか？",
      "xxをエージェントとして使用する方法を教えてください"
    ],
    useCasesKO: [
      "AI 에이전트 만들기를 도와주세요",
      "어떤 기능이 있나요?",
      "어떤 유형의 AI 에이전트를 만들 수 있나요?",
      "xx를 에이전트로 사용하는 방법을 알려주시겠어요?"
    ],
    useCasesZH: [
      "帮我创建一个 AI 智能体",
      "你有哪些功能？",
      "你可以创建哪些类型的 AI 智能体？",
      "你能告诉我如何使用 xx 作为智能体吗？"
    ],
    socialLinks: "https://x.com/XAIAgentAI, https://github.com/XAIAgentAI, https://t.me/XAIAgentAI",
  },
  {
    id: 2,
    name: "SuperImage",
    tokens: "0x07D325030dA1A8c1f96C414BFFbe4fBD539CED45",
    avatar: "/logo/SuperImage.png",
    symbol: "SIC",
    type: "Infrastructure",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    statusZH: "即将公布",
    description: "SuperImage is a Decentralized Image Generation AI. SuperImage has multiple latent text-to-image diffusion models of generating photo-realistic images given any text input, cultivates autonomous freedom to produce incredible imagery, empowers billions of people to create stunning art within seconds. SuperImage is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.superimage.ai",
    descriptionJA: "SuperImageは分散型画像生成AIです。SuperImageは、テキスト入力から写実的な画像を生成する複数の潜在的なテキストから画像への拡散モデルを持ち、驚くべき画像を生成する自律的な自由を育み、数十億の人々が数秒で素晴らしいアートを作成することを可能にします。SuperImageはAIエージェントのインフラストラクチャであり、AIエージェントが利用できるAPIインターフェースを提供します。公式ウェブサイト：www.superimage.ai",
    descriptionKO: "SuperImage는 분산형 이미지 생성 AI입니다. SuperImage는 텍스트 입력에서 사실적인 이미지를 생성하는 여러 잠재적 텍스트-이미지 확산 모델을 보유하고 있으며, 놀라운 이미지를 생성하는 자율적 자유를 육성하고, 수십억 명의 사람들이 몇 초 만에 멋진 예술 작품을 만들 수 있게 합니다. SuperImage는 AI 에이전트를 위한 인프라이며, AI 에이전트가 활용할 수 있는 API 인터페이스를 제공합니다. 공식 웹사이트: www.superimage.ai",
    descriptionZH: "SuperImage 是一个去中心化的图像生成 AI。SuperImage 拥有多个潜在的文本到图像扩散模型，可以根据任何文本输入生成照片级真实的图像，培养自主创作令人惊叹图像的自由，使数十亿人能够在几秒钟内创作出令人惊艳的艺术作品。SuperImage 是 AI 智能体的基础设施，为 AI 智能体提供 API 接口。官方网站：www.superimage.ai",
    createdAt: "3 months ago",
    creatorAddress: "0x2D5D...E574b4",
    totalSupply: "5,000,000,000 SIC",
    useCases: [
      "Draw a picture of a girl with festive holiday costume",
      "Red and white striped Christmas hat and clothes",
      "Dark brown hair with delicate makeup",
      "Christmas tree in background",
      "A photorealistic wildlife portrait of a snow leopard"
    ],
    useCasesJA: [
      "お祝いの衣装を着た女の子の絵を描いてください",
      "赤と白のストライプのクリスマス帽子と服",
      "繊細なメイクをした濃い茶色の髪",
      "背景にクリスマスツリー",
      "雪豹の写実的な野生動物の肖像画"
    ],
    useCasesKO: [
      "축제 의상을 입은 소녀의 그림을 그려주세요",
      "빨간색과 흰색 줄무늬 크리스마스 모자와 옷",
      "섬세한 메이크업을 한 진한 갈색 머리",
      "배경에 크리스마스 트리",
      "눈표범의 사실적인 야생동물 초상화"
    ],
    useCasesZH: [
      "画一个穿着节日盛装的女孩",
      "红白条纹的圣诞帽和衣服",
      "深棕色头发配精致妆容",
      "背景是圣诞树",
      "一幅写实的雪豹野生动物肖像"
    ],
    socialLinks: "https://x.com/SuperImageAI, https://t.me/SuperImageAI, https://t.me/SuperImageKorea, https://t.me/SuperImageJapan",
    chatEntry: "https://app.superimage.ai"
  },
  {
    id: 3,
    name: "DecentralGPT",
    tokens: "0x18386F368e7C211E84324337fA8f62d5093272E1",
    avatar: "/logo/DecentralGPT.png",
    symbol: "DGC",
    type: "Infrastructure",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    statusZH: "即将公布",
    description: "DecentralGPT is a Decentralized Large Language Model AI.\nDGPT supports decentralized deployment of various top-tier large language models (LLMs) worldwide, significantly reducing the cost of using LLMs. It is committed to building a safe, privacy-protective, democratic, transparent, open-source, and universally accessible AGI.\nDecentralGPT is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.decentralgpt.org",
    descriptionJA: "DecentralGPTは分散型大規模言語モデルAIです。\nDGPTは世界中の様々なトップティアの大規模言語モデル（LLM）の分散型展開をサポートし、LLMの使用コストを大幅に削減します。安全で、プライバシーを保護し、民主的で、透明性があり、オープンソースで、誰もが利用できるAGIの構築に取り組んでいます。\nDecentralGPTはAIエージェントのインフラストラクチャであり、AIエージェントが利用できるAPIインターフェースを提供します。公式ウェブサイト：www.decentralgpt.org",
    descriptionKO: "DecentralGPT는 분산형 대규모 언어 모델 AI입니다.\nDGPT는 전 세계의 다양한 최상위 대규모 언어 모델(LLM)의 분산 배포를 지원하여 LLM 사용 비용을 크게 줄입니다. 안전하고, 프라이버시를 보호하며, 민주적이고, 투명하며, 오픈 소스이고, 누구나 접근할 수 있는 AGI를 구축하는 데 전념하고 있습니다.\nDecentralGPT는 AI 에이전트를 위한 인프라이며, AI 에이전트가 활용할 수 있는 API 인터페이스를 제공합니다. 공식 웹사이트: www.decentralgpt.org",
    descriptionZH: "DecentralGPT 是一个去中心化的大型语言模型 AI。\nDGPT 支持全球各种顶级大型语言模型（LLM）的去中心化部署，显著降低了使用 LLM 的成本。它致力于构建安全、保护隐私、民主、透明、开源且普遍可访问的 AGI。\nDecentralGPT 是 AI 智能体的基础设施，为 AI 智能体提供 API 接口。官方网站：www.decentralgpt.org",
    createdAt: "5 months ago",
    creatorAddress: "0x3E6E...F685c5",
    totalSupply: "5,000,000,000 DGC",
    useCases: [
      "Write an article about DecentralGPT's features",
      "Help me solve this math problem",
      "Help me optimize the content below to make it concise and easy to understand",
      "Summarize the differences between DecentralGPT and ChatGPT"
    ],
    useCasesJA: [
      "DecentralGPTの機能について記事を書いてください",
      "この数学の問題を解くのを手伝ってください",
      "以下の内容を簡潔で分かりやすく最適化してください",
      "DecentralGPTとChatGPTの違いを要約してください"
    ],
    useCasesKO: [
      "DecentralGPT의 기능에 대한 기사를 작성해주세요",
      "이 수학 문제를 해결하는 것을 도와주세요",
      "아래 내용을 간결하고 이해하기 쉽게 최적화해주세요",
      "DecentralGPT와 ChatGPT의 차이점을 요약해주세요"
    ],
    useCasesZH: [
      "写一篇关于 DecentralGPT 功能的文章",
      "帮我解决这个数学问题",
      "帮我优化下面的内容，使其简洁易懂",
      "总结 DecentralGPT 和 ChatGPT 的区别"
    ],
    socialLinks: "https://x.com/DecentralGPT, https://t.me/DecentralGPT, https://medium.com/@DecentralGPT",
    chatEntry: "https://www.degpt.ai"
  },
  {
    id: 4,
    name: "XPersonity",
    tokens: "",
    avatar: "/logo/XPersonity.png",
    symbol: "XPER",
    type: "AI Agent",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    statusZH: "即将公布",
    description: "XPersonity is a super fun and incredibly useful tool designed to uncover the personality secrets behind any X account! By diving deep into the posting history of X users, it delivers a sharp, witty, and often hilarious personality analysis that's guaranteed to make you smile...",
    descriptionJA: "XPersonityは、Xアカウントの背後にある性格の秘密を明らかにするために設計された、超楽しく信じられないほど便利なツールです！Xユーザーの投稿履歴を深く分析し、鋭く、機知に富み、しばしば笑いを誘う性格分析を提供します...",
    descriptionKO: "XPersonity는 X 계정 뒤에 숨겨진 성격의 비밀을 밝혀내도록 설계된 매우 재미있고 믿을 수 없을 만큼 유용한 도구입니다! X 사용자의 게시 기록을 깊이 분석하여 날카롭고, 재치 있으며, 종종 웃음을 자아내는 성격 분석을 제공합니다...",
    descriptionZH: "XPersonity 是一个超级有趣且非常实用的工具，旨在揭示任何 X 账号背后的性格秘密！通过深入分析 X 用户的发帖历史，它提供了一个尖锐、机智且常常令人捧腹的性格分析，保证能让你会心一笑...",
    createdAt: "2 months ago",
    creatorAddress: "0x4F7F...G796d6",
    totalSupply: "3,000,000,000 XPER",
    useCases: [
      "Analyze @xxxx",
      "Match @xxx and @xxxx",
      "Train my digital twin",
      "Remember the following content: xxxxx"
    ],
    useCasesJA: [
      "@xxxxを分析してください",
      "@xxxと@xxxxをマッチングしてください",
      "私のデジタルツインを訓練してください",
      "以下の内容を記憶してください：xxxxx"
    ],
    useCasesKO: [
      "@xxxx를 분석해주세요",
      "@xxx와 @xxxx를 매칭해주세요",
      "내 디지털 트윈을 훈련시켜주세요",
      "다음 내용을 기억해주세요: xxxxx"
    ],
    useCasesZH: [
      "分析 @xxxx",
      "匹配 @xxx 和 @xxxx",
      "训练我的数字分身",
      "记住以下内容：xxxxx"
    ],
    socialLinks: "https://x.com/XPersonity",
    chatEntry: "None"
  },
  {
    id: 5,
    name: "ASIXT",
    tokens: "",
    avatar: "/logo/ASIXT.png",
    symbol: "ASIXT",
    type: "AI Agent",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    statusZH: "即将公布",
    description: "ASIXT is a smart assistant designed to help investors stay ahead of the game in the ever-changing crypto market...",
    descriptionJA: "ASIXTは、常に変化する暗号資産市場で投資家が先手を打つのを支援するために設計されたスマートアシスタントです...",
    descriptionKO: "ASIXT는 끊임없이 변화하는 암호화폐 시장에서 투자자들이 앞서 나갈 수 있도록 설계된 스마트 어시스턴트입니다...",
    descriptionZH: "ASIXT 是一个智能助手，旨在帮助投资者在不断变化的加密货币市场中保持领先地位...",
    createdAt: "1 month ago",
    creatorAddress: "0x5G8G...H807e7",
    totalSupply: "3,000,000,000 ASIXT",
    useCases: [
      "Top 10 meme coins by trading volume in the last 24 hours",
      "What are the new tokens most mentioned by KOLs in the last 24 hours",
      "Send me hourly email notifications about tokens with obvious upward trends",
      "Instantly notify me of genuine tokens issued by well-known figures"
    ],
    useCasesJA: [
      "過去24時間の取引量によるトップ10のミームコイン",
      "過去24時間でKOLが最も言及した新しいトークン",
      "明らかな上昇トレンドを示すトークンについて1時間ごとにメール通知を送信",
      "著名人が発行した正規のトークンについて即時通知"
    ],
    useCasesKO: [
      "지난 24시간 거래량 기준 상위 10개 밈코인",
      "지난 24시간 동안 KOL이 가장 많이 언급한 새로운 토큰",
      "뚜렷한 상승 추세를 보이는 토큰에 대해 매시간 이메일 알림 전송",
      "유명 인사가 발행한 정품 토큰에 대해 즉시 알림"
    ],
    useCasesZH: [
      "过去24小时交易量最大的前10个迷因币",
      "过去24小时KOL最常提到的新代币有哪些",
      "每小时发送明显上涨趋势代币的邮件通知",
      "知名人士发行的正规代币即时通知"
    ],
    socialLinks: "https://x.com/ASIXTAI",
    chatEntry: "None"
  }
]; 