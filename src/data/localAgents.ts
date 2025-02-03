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
  socialLinks?: string;
  chatEntry?: string;
  statusJA?: string;
  statusKO?: string;
}

export const localAgents: LocalAgent[] = [
  {
    id: 1,
    name: "XAIAgent",
    tokens: "0x16d83F6B17914a4e88436251589194CA5AC0f452",
    avatar: "/logo/XAIAgent.png",
    symbol: "XAA",
    type: "Platform",
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "IAO launching soon.",
    statusJA: "IAOが間もなく開始されます。",
    statusKO: "IAO가 곧 시작됩니다.",
    description: `XAIAgent is a blockchain-based decentralized AI agent platform that integrates the creation, use, deployment, and trading of AI agents.\n\n
It offers no-code development tools for everyday users while providing the XAgentScope framework for advanced developers.\n\n
Powered by the GPU miner network on the DBC blockchain, XAIAgent ensures fully decentralized AI operations, offering advantages like data privacy, high performance, and low costs.\n\n
The platform comes preloaded with various AI models, enabling complex tasks and multi-turn conversational scenarios.\n\n
Its multi-token economic model fosters sustainable ecosystem growth, making XAIAgent a comprehensive platform for merging AI and blockchain technologies.`,
    descriptionJA: `XAIAgentは、AIエージェントの作成、使用、展開、取引を統合したブロックチェーンベースの分散型AIエージェントプラットフォームです。\n\n
一般ユーザー向けのノーコード開発ツールを提供する一方、上級開発者向けにXAgentScopeフレームワークを提供します。\n\n
DBCブロックチェーン上のGPUマイナーネットワークを活用し、XAIAgentはデータのプライバシー、高性能、低コストなどの利点を提供する完全に分散化されたAI運用を実現します。\n\n
プラットフォームには様々なAIモデルが搭載されており、複雑なタスクやマルチターンの会話シナリオを可能にします。\n\n
マルチトークン経済モデルにより持続可能なエコシステムの成長を促進し、XAIAgentはAIとブロックチェーン技術を融合する包括的なプラットフォームとなっています。`,
    descriptionKO: `XAIAgent는 AI 에이전트의 생성, 사용, 배포 및 거래를 통합하는 블록체인 기반 분산형 AI 에이전트 플랫폼입니다.\n\n
일반 사용자를 위한 노코드 개발 도구를 제공하는 동시에 고급 개발자를 위한 XAgentScope 프레임워크를 제공합니다.\n\n
DBC 블록체인의 GPU 마이너 네트워크를 활용하여 XAIAgent는 데이터 프라이버시, 고성능, 저비용과 같은 이점을 제공하는 완전히 분산화된 AI 운영을 보장합니다.\n\n
플랫폼에는 다양한 AI 모델이 탑재되어 있어 복잡한 작업과 다중 턴 대화 시나리오를 가능하게 합니다.\n\n
멀티 토큰 경제 모델을 통해 지속 가능한 생태계 성장을 촉진하며, XAIAgent는 AI와 블록체인 기술을 융합하는 종합적인 플랫폼입니다.`,
    createdAt: "4 months ago",
    creatorAddress: "0x1C4C...F463a3",
    totalSupply: "20,000,000,000 XAA",
    useCases: [
      "Help me create an Al Agent",
      "What functions do you have?",
      "What types of Al Agents can you create?",
      "Can you tell me how to use xx as an Agent?",
    ],
    useCasesJA: [
      "AIエージェントの作成を手伝ってください",
      "どのような機能がありますか？",
      "どのようなAIエージェントを作成できますか？",
      "xxをエージェントとして使用する方法を教えてください",
    ],
    useCasesKO: [
      "AI 에이전트 생성을 도와주세요",
      "어떤 기능이 있나요?",
      "어떤 종류의 AI 에이전트를 만들 수 있나요?",
      "xx를 에이전트로 사용하는 방법을 알려주세요",
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
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    description: "SuperImage is a Decentralized Image Generation AI. SuperImage has multiple latent text-to-image diffusion models of generating photo-realistic images given any text input, cultivates autonomous freedom to produce incredible imagery, empowers billions of people to create stunning art within seconds. SuperImage is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.superimage.ai",
    descriptionJA: "SuperImageは分散型画像生成AIです。SuperImageは、テキスト入力から写実的な画像を生成する複数の潜在的なテキストから画像への拡散モデルを持ち、驚くべき画像を生成する自律的な自由を育み、数十億の人々が数秒で素晴らしいアートを作成することを可能にします。SuperImageはAIエージェントのインフラストラクチャであり、AIエージェントが利用できるAPIインターフェースを提供します。公式ウェブサイト：www.superimage.ai",
    descriptionKO: "SuperImage는 분산형 이미지 생성 AI입니다. SuperImage는 텍스트 입력에서 사실적인 이미지를 생성하는 여러 잠재적 텍스트-이미지 확산 모델을 보유하고 있으며, 놀라운 이미지를 생성하는 자율적 자유를 육성하고, 수십억 명의 사람들이 몇 초 만에 멋진 예술 작품을 만들 수 있게 합니다. SuperImage는 AI 에이전트를 위한 인프라이며, AI 에이전트가 활용할 수 있는 API 인터페이스를 제공합니다. 공식 웹사이트: www.superimage.ai",
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
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    description: "DecentralGPT is a Decentralized Large Language Model AI.\nDGPT supports decentralized deployment of various top-tier large language models (LLMs) worldwide, significantly reducing the cost of using LLMs. It is committed to building a safe, privacy-protective, democratic, transparent, open-source, and universally accessible AGI.\nDecentralGPT is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.decentralgpt.org",
    descriptionJA: "DecentralGPTは分散型大規模言語モデルAIです。\nDGPTは世界中の様々なトップティアの大規模言語モデル（LLM）の分散型展開をサポートし、LLMの使用コストを大幅に削減します。安全で、プライバシーを保護し、民主的で、透明性があり、オープンソースで、誰もが利用できるAGIの構築に取り組んでいます。\nDecentralGPTはAIエージェントのインフラストラクチャであり、AIエージェントが利用できるAPIインターフェースを提供します。公式ウェブサイト：www.decentralgpt.org",
    descriptionKO: "DecentralGPT는 분산형 대규모 언어 모델 AI입니다.\nDGPT는 전 세계의 다양한 최상위 대규모 언어 모델(LLM)의 분산 배포를 지원하여 LLM 사용 비용을 크게 줄입니다. 안전하고, 프라이버시를 보호하며, 민주적이고, 투명하며, 오픈 소스이고, 누구나 접근할 수 있는 AGI를 구축하는 데 전념하고 있습니다.\nDecentralGPT는 AI 에이전트를 위한 인프라이며, AI 에이전트가 활용할 수 있는 API 인터페이스를 제공합니다. 공식 웹사이트: www.decentralgpt.org",
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
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    description: "XPersonity is a super fun and incredibly useful tool designed to uncover the personality secrets behind any X account! By diving deep into the posting history of X users, it delivers a sharp, witty, and often hilarious personality analysis that's guaranteed to make you smile...",
    descriptionJA: "XPersonityは、Xアカウントの背後にある性格の秘密を明らかにするために設計された、超楽しく信じられないほど便利なツールです！Xユーザーの投稿履歴を深く分析し、鋭く、機知に富み、しばしば笑いを誘う性格分析を提供します...",
    descriptionKO: "XPersonity는 X 계정 뒤에 숨겨진 성격의 비밀을 밝혀내도록 설계된 매우 재미있고 믿을 수 없을 만큼 유용한 도구입니다! X 사용자의 게시 기록을 깊이 분석하여 날카롭고, 재치 있으며, 종종 웃음을 자아내는 성격 분석을 제공합니다...",
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
    marketCap: "TBA",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
    statusJA: "近日公開",
    statusKO: "출시 예정",
    description: "ASIXT is a smart assistant designed to help investors stay ahead of the game in the ever-changing crypto market...",
    descriptionJA: "ASIXTは、常に変化する暗号資産市場で投資家が先手を打つのを支援するために設計されたスマートアシスタントです...",
    descriptionKO: "ASIXT는 끊임없이 변화하는 암호화폐 시장에서 투자자들이 앞서 나갈 수 있도록 설계된 스마트 어시스턴트입니다...",
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
    socialLinks: "https://x.com/ASIXTAI",
    chatEntry: "None"
  }
]; 