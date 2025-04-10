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
  totalSupply?: number;
  useCases?: string[];
  useCasesJA?: string[];
  useCasesKO?: string[];
  useCasesZH?: string[];
  socialLinks?: string;
  chatEntry?: string | null;
  statusJA?: string;
  statusKO?: string;
  statusZH?: string;
  tokenAddress?: string;
  iaoContractAddress?: string;
  tokenAddressTestnet?: string;
  iaoContractAddressTestnet?: string;
  projectDescription?: string;
  marketCapTokenNumber?: number;
  iaoTokenAmount?: number;
}

export const localAgents: LocalAgent[] = [
  {
    id: 1,
    name: "XAIAgent",
    tokenAddress: process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true" ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a" : "0x16d83F6B17914a4e88436251589194CA5AC0f452",
    iaoContractAddress: "0x5AeF02893F05D5422eD0c3bD1D7502Ec6bd6195e",
    tokenAddressTestnet: "0x8dAb697D931B342e80354A4BED2d8d5d5Ee9003E",
    iaoContractAddressTestnet: "0x82B7e10Ed1453FBf60c98aFbDeD94159A5E13973",

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/XAIAgent.png",
    symbol: "XAA",
    type: "Platform",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "Tradable",
    statusJA: "トランザクション可能",
    statusKO: "거래 가능",
    statusZH: "可交易",
    description: `XAIAgent is a blockchain-based decentralized AI agent platform that integrates the creation, use, deployment, and trading of AI agents.\n
It offers no-code development tools for everyday users while providing the XAgentScope framework for advanced developers.\n
Powered by the GPU miner network on the DBC blockchain, XAIAgent ensures fully decentralized AI operations, offering advantages like data privacy, high performance, and low costs.\n
The platform comes preloaded with various AI models, enabling complex tasks and multi-turn conversational scenarios.\n
Its multi-token economic model fosters sustainable ecosystem growth, making XAIAgent a comprehensive platform for merging AI and blockchain technologies.`,
    descriptionJA: "XAIAgentは、AIエージェントの作成、使用、デプロイメント、取引を統合した分散型AIエージェントプラットフォームです。",
    descriptionKO: "XAIAgent는 AI Agent의 생성, 활용, 배포 및 거래를 하나로 통합한 블록체인 기반 탈중앙화 AI Agent 플랫폼입니다. 노코드 개발 도구를 통해 일반 사용자는 손쉽게 AI Agent를 만들 수 있고, XAgentScope 프레임워크를 통해 고급 개발자는 더욱 정교한 AI Agent를 개발 및 배포할 수 있으며, DBC 체인의 GPU 채굴 네트워크를 활용해 AI 실행의 완전한 탈중앙화를 보장하면서 데이턄 프라이버시, 높은 성능, 저비용의 장점을 제공하고, 다양한 AI 모델을 내장해 복잡한 작업과 다중 회차 대화를 지원하며, 멀티 토큰 경제 모델을 통해 생태계의 지속적인 성장을 촉진하는 AI와 블록체인의 융합형 올인원 플랫폼입니다.",
    descriptionZH: "XAIAgent是一个基于区块链的去中心化AI Agent平台，集AI Agent的创建、使用、发射与交易于一体。通过零代码开发工具服务普通用户，同时提供XAgentScope框架支持高级开发者。XAIAgent依托DBC链的GPU矿工网络，确保AI运行完全去中心化，具备数据隐私、高性能和低成本优势。平台内置多种AI模型，支持复杂任务和多轮对话场景，多代币经济模型促进生态稳定发展，是AI与区块链融合的全功能平台。",
    createdAt: "4 months ago",
    creatorAddress: "0x1C4C...F463a3",
    totalSupply: 100000000000,
    marketCapTokenNumber: 100000000000,
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
    socialLinks: "https://x.com/XAIAgentAI, https://github.com/XAIAgentAI, https://t.me/XAIAgentAI/1",
    projectDescription: JSON.stringify({
      en: "1. Total Supply: 100 billion XAA\n2. 20% of tokens will be sold through IAO, accepting only $DBC. Investors will receive $XAA proportional to their $DBC investment.\n3. During the 14-day IAO period, 50% of $DBC will be allocated to the project team's ecosystem development, and the remaining 50% will be allocated to on-chain liquidity pools, never to be revoked.\n4. After IAO ends, $XAA and $DBC trading pairs will be immediately established on DBCSwap, enabling free trading of $XAA.",
      zh: "1. XAA 总供应量：1000亿\n2. 20% 的代币将通过 IAO 销售，仅接受 $DBC。投资者将根据其 $DBC 投资比例获得 $XAA。\n3. 在为期14天的 IAO 期间，50% 的 $DBC 将分配给项目团队的生态系统开发，其余 50% 将分配给链上流动性池，且永不撤销。\n4. IAO 结束后，$XAA 和 $DBC 将立即在 DBCSwap 上建立交易对，实现 $XAA 的自由交易。",
      ja: "1. 総供給量：1000億 XAA\n2. トークンの20%は IAO を通じて販売され、$DBC のみを受け付けます。投資家は $DBC 投資額に比例して $XAA を受け取ります。\n3. 14日間の IAO 期間中、$DBC の50%はプロジェクトチームのエコシステム開発に、残りの50%はオンチェーン流動性プールに永続的に割り当てられます。\n4. IAO 終了後、$XAA と $DBC の取引ペアが DBCSwap に即時に設立され、$XAA の自由取引が可能になります。",
      ko: "1. 총 공급량: 1000억 XAA\n2. 토큰의 20%는 IAO를 통해 판매되며, $DBC만 받습니다. 투자자는 $DBC 투자 비율에 따라 $XAA를 받게 됩니다.\n3. 14일간의 IAO 기간 동안, $DBC의 50%는 프로젝트 팀의 생태계 개발에, 나머지 50%는 온체인 유동성 풀에 영구적으로 할당됩니다.\n4. IAO 종료 후, $XAA와 $DBC 거래쌍이 DBCSwap에 즉시 설립되어 $XAA의 자유로운 거래가 가능해집니다."
    }),
    iaoTokenAmount: 20000000000

  },
  {
    id: 2,
    name: "StyleID",
    iaoTokenAmount: 10000000000,

    tokenAddress: "0x2282D5DA5f39Bb7B90cef532341FBB998A1d0965",
    iaoContractAddress: "0xc21155334688e2c1cf89d4ab09d38d30002717dd",
    tokenAddressTestnet: "0xe581200f8b3c623322392857250c2bc71b9a5122",
    iaoContractAddressTestnet: "0xcc6c5b583dd03a900dbf850449d50cec8833273f",


    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/StyleID.png",
    symbol: "STID",
    type: "Infrastructure",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    // status: "IAO ongoing",
    status: "Tradable",
    statusJA: "トランザクション可能",
    statusKO: "거래 가능",
    statusZH: "可交易",
    description: "Generate task photos, users only need to provide one photo to quickly obtain their own unique personal photos that support multiple styles. Capable of achieving unlimited style photography and fixed template photography with both controllability and ID retention capabilities",
    descriptionZH: "生成人物写真，用户仅需要提供一张照片即可快速获得独属于自己的个人写真支持多种风格。可实现兼具可控性与ID保持能力的无限风格写真与固定模板写真功能",
    descriptionKO: "작업 사진을 생성하여 한 장의 사진만 제공하면 다양한 스타일을 지원하는 나만의 개인 사진을 빠르게 얻을 수 있습니다.)컨트롤 및 ID 보존 기능을 갖춘 무제한 스타일링 및 고정 템플릿 포토 기능 제공",
    descriptionJA: "タスク写真を生成し、ユーザーは1枚の写真を提供するだけで、自分だけの個人写真のサポートを迅速に得ることができます）。制御性とID保持能力を兼ね備えた無限スタイル写真と固定テンプレート写真機能を実現できる",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574id",
    totalSupply: 100000000000,
    marketCapTokenNumber: 100000000000,
    useCases: [
      "I want to generate a vintage style photo. Can you help me design the style and background",
      "Can I adjust my expression and posture in this photo?",
      "If I want to generate a set of photos, such as Japanese, fresh, and sci-fi styles, how do I do it?",
      "Can this AI keep my appearance consistent? For example, I can maintain my characteristics in different styles"
    ],
    useCasesJA: [
      "レトロ調の写真を生成したいのですが、スタイルや背景をデザインしてもらえますか？",
      "似たようなセレブの衣装を探す",
      "ファッションウィークのトレンドを追跡",
      "パーソナライズされたスタイル推薦を取得"
    ],
    useCasesKO: [
      "빈티지 스타일의 화보를 만들고 싶은데 스타일과 배경을 디자인해 주시겠어요?",
      "비슷한 셀럽 의상 찾기",
      "패션위크 트렌드 추적",
      "개인화된 스타일 추천 받기"
    ],
    useCasesZH: [
      "我想生成一张复古风格的写真，能帮我设计一下风格和背景吗",
      "我能在这张写真里调整我的表情和姿势吗?",
      "如果我想生成一组写真，比如日系、小清新和科幻风格，怎么操作?",
      "这个AI可以保持我的相貌一致吗？比如不同风格下都能保持我的特征"
    ],
    socialLinks: "",
    chatEntry: null,
    projectDescription: JSON.stringify({
      en: `1. $STID Total Supply: 100 billion

2. 10% of tokens will be sold through IAO, accepting only $XAA. Investors will receive $STID proportional to their $XAA investment.

3. After the 72-hour IAO ends, 95% of $XAA will be allocated to on-chain liquidity pools, never to be revoked, with liquidity LP certificates sent to a black hole address. 5% of $XAA will be burned.

4. After the IAO ends, 10% of $STID and $XAA will immediately establish a liquidity pool on DBCSwap, enabling free trading of $STID.

5. The team owns 30% of $STID, which begins unlocking after the IAO ends, with linear unlocking over 2000 days.

6. 48% of $STID is generated through mining, halving every 4 years. In the first 4 years, 6 billion $STID will be mined annually. Of the mined $STID, 40% is received immediately, and 60% is linearly unlocked over 120 days.

7. 1% of $STID will be airdropped to the first 10,000 holders of $XAA and $DBC, and 1% of $STID will be airdropped to holders of XAA node NFTs.`,
      zh: `1.$STID 总供应量：1000亿

2.10% 的代币将通过IAO销售，仅接受$XAA。投资者将根据其$XAA投资比例获得 $STID

3.在为期72小时的IAO结束后，95%的$XAA将分配给链上流动性池，永不撤销，流动性LP凭证被打入黑洞地址。5%的$XAA会被销毁

4.IAO 结束后，10%的$STID和$XAA将立即在DBCSwap上建立流动性池，实现$STID的自由交易

5.团队拥有30%的$STID,IAO结束后开始解锁，分2000天线性解锁

6.48%的$STID挖矿产生，每4年减半一次，首个4年，每年挖矿产生60亿枚$STID，挖矿产生的$STID，40%立刻获得，60%分120天线性解锁

7.1%的$STID空投给$XAA和$DBC前10000名持有者，1%$STID空投给XAA的节点NFT持有者`,
      ja: `1. $STID 総供給量：1000億。
2. トークンの10%はIAOを通じて販売され、$XAAのみ受け付けます。投資家は$XAA投資比率に応じて$STIDを受け取ります。
3. 72時間のIAO終了後、$XAAの95%はオンチェーン流動性プールに割り当てられ、撤回されることはなく、流動性LP証明書はブラックホールアドレスに送られます。$XAAの5%は焼却されます。
4. IAO終了後、$STIDと$XAAの10%はすぐにDBCSwapで流動性プールを確立し、$STIDの自由取引を可能にします。
5. チームは$STIDの30%を所有し、IAO終了後に解除が始まり、2000日間にわたって線形解除されます。
6. $STIDの48%はマイニングによって生成され、4年ごとに半減します。最初の4年間は、年間60億$STIDがマイニングされます。マイニングされた$STIDの40%はすぐに受け取り、60%は120日間にわたって線形解除されます。
7. $STIDの1%は$XAAと$DBCの最初の10,000人の保有者にエアドロップされ、$STIDの1%はXAAのノードNFT保有者にエアドロップされます。`,
      ko: "1. 총 공급량: 1000억 XAA\n2. 토큰의 20%는 IAO를 통해 판매되며, $DBC만 받습니다. 투자자는 $DBC 투자 비율에 따라 $XAA를 받게 됩니다.\n3. 14일간의 IAO 기간 동안, $DBC의 50%는 프로젝트 팀의 생태계 개발에, 나머지 50%는 온체인 유동성 풀에 영구적으로 할당됩니다.\n4. IAO 종료 후, $XAA와 $DBC 거래쌍이 DBCSwap에 즉시 설립되어 $XAA의 자유로운 거래가 가능해집니다."
    })
  },
  {
    id: 12,
    name: "FaceSwap",
    iaoTokenAmount: 5000000000,

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/FaceSwap.png",
    symbol: "FASW",
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
    description: "Face changing function, supports image and video face changing, supports multiple different face changing modes: face selection, gender filtering, etc., supports face enlargement/restoration function",
    descriptionZH: "换脸功能，支持图片和视频换脸，支持多种不同的换脸模式：人脸选择、按性别筛选等等，支持人脸放大/修复功能",
    descriptionKO: "얼굴 바꾸기 기능, 그림과 동영상 얼굴 바꾸기 지원, 다양한 얼굴 바꾸기 모드 지원: 얼굴 선택, 성별 선별 등, 얼굴 확대/복구 기능 지원",
    descriptionJA: "顔を変える機能、画像とビデオの顔を変えることを支持して、多種の異なる顔を変えるモードを支持します：人の顔の選択、性別によって選別するなど、人の顔の拡大/修復機能を支持します",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574fa",
    totalSupply: 5000000000,
    useCases: [
      "I want to change my face in this photo. Can you help me choose the most suitable face shape?",
      "I want to switch to a female character in this video. Can you help me screen for suitable female faces?",
      "This photo is a bit blurry. Can you help me fix and enhance its clarity while changing my face?",
      "Can I replace myself with the face of a movie character? Can you recommend a few suitable roles?"
    ],
    useCasesJA: [
      "私はこの写真を顔を変えたいのですが、最適な顔を選んでもらえますか？",
      "この動画で女性キャラクターに変えたいのですが、適切な女性の顔を選んでもらえますか？",
      "この写真は少しぼやけていますが、顔を変えながら鮮明さを修復してくれませんか。",
      "自分を映画のキャラクターの顔に変えてもいいですか。あなたはいくつかの適した役を推薦することができますか。"
    ],
    useCasesKO: [
      "이 사진 얼굴 바꾸고 싶은데 가장 잘 어울리는 얼굴형을 골라 주시겠어요?",
      "이 영상에서 여자 캐릭터로 바꾸고 싶은데 적절한 여자 얼굴을 선별해 주시겠어요?",
      "이 사진은 좀 흐릿한데, 당신은 얼굴을 바꾸는 동시에 나를 도와 선명도를 고치고 강화할 수 있습니까?",
      "제가 영화 캐릭터의 얼굴로 바꿀 수 있을까요?너는 적합한 배역을 몇 개 추천할 수 있니?"
    ],
    useCasesZH: [
      "我想换脸这张照片，可以帮我选择最适合的脸型吗",
      "我想在这个视频里换成女性角色，你可以帮我筛选合适的女性脸吗",
      "这张照片有点模糊，你可以在换脸的同时帮我修复和增强清晰度吗?",
      "我能把自己换成电影角色的脸吗？你可以推荐几个适合的角色吗？"
    ],
    socialLinks: "",
    chatEntry: null
  },
  {
    id: 10,
    name: "PicSpan",
    iaoTokenAmount: 5000000000,

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/PicSpan.png",
    symbol: "PIS",
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
    description: "Expand the image to any desired scale",
    descriptionZH: "扩展图片，可以按照想要的比例进行任意的图片扩展",
    descriptionKO: "원하는 비율로 원하는 그림을 확장할 수 있는 확장",
    descriptionJA: "拡張ピクチャ、任意のピクチャ拡張を希望する割合で行うことができます",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574pi",
    totalSupply: 5000000000,
    useCases: [
      "Can you help me expand the left and bottom of this image while maintaining its original style?",
      "Can you expand this image to a 16:9 widescreen ratio while keeping the subject centered?",
      "Can we make the extended parts more creative, such as adding some details related to the original image?",
      "Can the expanded image blend more naturally? If there are any inconsistencies, can you optimize them?"
    ],
    useCasesJA: [
      "私はこの画像の左側と底部を拡張して、元のスタイルを維持したいのですが、あなたは私を助けることができますか？",
      "この画像を16:9のワイドスクリーンスケールに拡大して、本体の中央を維持することができますか。",
      "原図に関連する詳細を追加するなど、拡張された部分をよりクリエイティブにすることはできますか。",
      "拡張された画像はより自然に融合できますか？もし違和感があれば、最適化できますか。"
    ],
    useCasesKO: [
      "나는 이 그림의 왼쪽과 아래쪽을 확장하여 원래의 스타일을 유지하고 싶은데, 당신은 나를 도와 할 수 있습니까?",
      "당신은 이 그림을 16: 9의 와이드스크린 비율로 확장할 수 있으며, 동시에 본체를 가운데로 유지할 수 있습니까?",
      "원래 그림과 관련된 세부 사항을 추가하는 등 확장된 부분을 더 창의적으로 만들 수 있습니까?",
      "확장된 그림은 더욱 자연스럽게 융합될 수 있습니까?만약 조화롭지 못한 점이 있다면, 당신은 최적화할 수 있습니까?"
    ],
    useCasesZH: [
      "我想扩展这张图片的左侧和底部，保持原有风格，你能帮我做到吗？",
      "你能把这张图片扩展成16:9的宽屏比例，同时保持主体居中吗？",
      "能不能让扩展的部分更有创意，比如增加一些与原图相关的细节？",
      "扩展后的图片可以更自然地融合吗？如果有不协调的地方，你能优化吗？"
    ],
    socialLinks: "",
    chatEntry: null
  },
  {
    id: 5,
    name: "LogoLift",
    iaoTokenAmount: 5000000000,

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/LogoLift.png",
    symbol: "LOGO",
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
    description: "Logo generation, various styles of logos can be generated through text dialogue",
    descriptionZH: "Logo生成，通过文字对话可以生成各种样式的Logo",
    descriptionKO: "로고 생성, 문자 대화를 통해 다양한 스타일의 로고 생성",
    descriptionJA: "Logo生成、文字対話による様々なスタイルのLogo生成",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574lo",
    totalSupply: 5000000000,
    useCases: [
      "I want a logo with a strong sense of technology, mainly in blue and purple colors, with a futuristic feel. Can you help me design one?",
      "Please design a minimalist style logo for me, with black and white color scheme and abstract letter 'X', suitable for blockchain projects",
      "I hope the logo can embody the concepts of decentralization and artificial intelligence. Can we try several different design styles?",
      "Can you generate a logo with dynamic visual effects that is suitable for social media avatars?"
    ],
    useCasesJA: [
      "私は科学技術感のあるロゴがほしいです。色は青と紫を中心にして、未来感があります。あなたは私にデザインしてくれませんか。",
      "ブロックチェーンプロジェクトに適した抽象的なアルファベット「X」を持つシンプルなロゴをデザインしてください",
      "私はLogoが脱中心化と人工知能の概念を体現していることを望んで、いくつかの異なるデザインスタイルを試してみてもいいですか？",
      "動的な視覚効果を持つロゴを生成して、ソーシャルメディアのアイコンの使用に適していますか？"
    ],
    useCasesKO: [
      "나는 과학기술감이 넘치는 로고를 원한다. 색갈은 푸른색과 보라색을 위주로 하고 미래감이 있다. 당신은 나를 도와 하나를 설계할수 있는가?",
      "저에게 미니멀한 스타일의 로고를 설계해 주십시오. 흑백 배색, 추상적인 알파벳'X'가 있어 블록체인 프로젝트에 적합합니다.",
      "나는 로고가 탈중심화와 인공지능의 개념을 구현할 수 있기를 바란다. 몇 가지 다른 디자인 스타일을 시도할 수 있을까?",
      "동적 시각적 효과를 가진 로고를 생성하고 소셜 미디어 프로필 사진에 적합합니까?"
    ],
    useCasesZH: [
      "我想要一个科技感十足的Logo，颜色以蓝色和紫色为主，有未来感，你能帮我设计一个吗？",
      "请给我设计一个极简风格的Logo，黑白配色，带有抽象的字母'X'，适合区块链项目",
      "我希望Logo能体现去中心化和人工智能的概念，可以尝试几种不同的设计风格吗？",
      "能给我生成一个带有动态视觉效果的Logo，并且适合社交媒体头像使用吗？"
    ],
    socialLinks: "",
    chatEntry: null
  },
  {
    id: 6,
    name: "LiveEmoji",
    iaoTokenAmount: 5000000000,

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/LiveEmoji.png",
    symbol: "LEMO",
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
    description: "Emoji making AI can create various emojis, create specific emojis based on character images, support human and animal modes, and support video editing",
    descriptionZH: "表情包制作AI，可以制作各种表情，给定人物图像制作特定表情，支持人类模式和动物模式，支持视频的编辑",
    descriptionKO: "이모티콘 제작 AI, 다양한 이모티콘 제작 가능, 캐릭터 이미지에 특정 이모티콘 제작, 인간 모드와 동물 모드 지원, 동영상 편집 지원",
    descriptionJA: "表情パックはAIを作成し、さまざまな表情を作成することができ、人物画像を与えて特定の表情を作成し、人間モードと動物モードをサポートし、ビデオの編集をサポートする",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574le",
    totalSupply: 5000000000,
    useCases: [
      "I have a photo of a friend, can you help me turn his expression into a funny exaggerated laughter expression?",
      "Can you generate an emoji of a Shiba Inu for me, making it look like it's thinking about life?",
      "Can you create a cartoon cat emoji with exaggerated expressions of surprise and add 'Is it real or fake?!' The text?",
      "Make the second photo the same emoji as the first one"
    ],
    useCasesJA: [
      "友達の写真を持っていますが、彼の表情を笑いの大笑い顔に変えてもらえますか？",
      "人生を考えているように見えるように、柴犬の表情パックを生成してくれませんか？",
      "誇張された驚きの表情をしたキャラクター猫の表情パックを作ることができ、「マジ？！」の文字ですか？",
      "2枚目の写真を1枚目と同じ表情パックにする"
    ],
    useCasesKO: [
      "친구 사진이 있는데 그 친구 표정을 웃긴 오버 웃음 이모티콘으로 바꿔줄래?",
      "시바견 이모티콘을 만들어서 인생에 대해 생각하는 것처럼 보이게 할 수 있을까?",
      "만화 고양이 이모티콘을 만들 수 있다. 과장된 놀란 표정과 함께'진짜?!'문자요?",
      "두 번째 사진을 첫 번째 사진과 같은 이모티콘으로 만들어볼게요."
    ],
    useCasesZH: [
      "我有一张朋友的照片，能帮我把他的表情变成搞笑的夸张大笑表情吗？",
      "能给我生成一只柴犬的表情包，让它看起来像在思考人生？",
      "能做一个卡通猫的表情包，带有夸张的惊讶表情，并加上'真的假的？！'的文字吗？",
      "把第二张照片制作成和第一张一样的表情包"
    ],
    socialLinks: "",
    chatEntry: null
  },
  {
    id: 7,
    name: "Qreator",
    iaoTokenAmount: 5000000000,

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/Qreator.png",
    symbol: "QREA",
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
    description: "A QR code generation AI that can generate various styles of QR codes, which are beautiful and unique. They can be task images or landscape maps",
    descriptionZH: "二维码生成AI，可以生成各种风格的二维码，美观奇特，可以是任务图像，可以是风景图",
    descriptionKO: "QR코드는 AI를 생성하여 각종 스타일의 QR코드를 생성할 수 있으며, 미관이 특이하고, 임무 이미지일 수도 있고, 풍경도일 수도 있다",
    descriptionJA: "二次元コードはAIを生成して、各種の風格の二次元コードを生成することができて、美観は奇抜で、任務の画像であることができて、風景図であることができます",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574qr",
    totalSupply: 5000000000,
    useCases: [
      "I want to generate a technology style QR code that incorporates some cyberpunk elements, with blue purple as the main color. Is that okay?",
      "Can you create a QR code that looks like a mountain scenery but can still be scanned?",
      "I hope the QR code can integrate with my avatar, making it creative yet functional. Can you help me design one?",
      "Can you create a cartoon style QR code with a pixel art background that looks a bit cute?"
    ],
    useCasesJA: [
      "私は科学技術スタイルのQRコードを生成したいのですが、中にはいくつかのサイボパンク要素が溶け込んでいて、色は青紫色を中心にしていますが、よろしいでしょうか。",
      "山脈の風景のように見えるようにQRコードを作ってもスキャンできますか？",
      "QRコードに私の顔を融合させて、クリエイティブになりながらも普通に使えるようにしてほしいのですが、デザインしてもらえますか。",
      "背景がピクセルアート風で、少し可愛く見えるキャラクター風のQRコードを作ってもらえませんか。"
    ],
    useCasesKO: [
      "나는 과학기술풍격의 QR코드를 생성하려고 하는데 그속에는 일부 싸이보펑크원소가 융합되여있고 색갈은 람자색을 위주로 하는데 괜찮겠는가?",
      "산맥 풍경처럼 보이지만 여전히 스캔할 수 있는 QR코드를 만들 수 있습니까?",
      "나는 QR코드가 나의 두상을 융합시켜 창의적이지만 정상적으로 사용할수 있도록 하기를 바란다. 당신은 나를 도와 하나를 설계할수 있는가?",
      "만화 스타일의 QR코드를 만들 수 있습니까? 배경은 픽셀 예술 스타일이고 좀 귀엽게 보일 수 있습니까?"
    ],
    useCasesZH: [
      "我想生成一个科技风格的二维码，里面融入一些赛博朋克元素，颜色以蓝紫色为主，可以吗？",
      "能不能做一个二维码，让它看起来像一座山脉风景，但仍然可以扫描？",
      "我希望二维码能融合我的头像，让它变得有创意但又能正常使用，你能帮我设计一个吗？",
      "能不能做一个卡通风格的二维码，背景是像素艺术风格，并且能让它看起来有点可爱？"
    ],
    socialLinks: "",
    chatEntry: null
  },
  {
    id: 8,
    name: "Oldify",
    iaoTokenAmount: 5000000000,

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/Oldify.png",
    symbol: "OLD",
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
    description: "Turning black and white photos into color photos can transform various old photos into colorful ones. Almost completely eliminating faults and artifacts. The skin effect is more natural (reducing zombie feel), the details are richer, the rendering is more realistic, and the 'blue deviation' is significantly reduced",
    descriptionZH: "黑白照片变彩色照片，可以把各种老照片变成色彩丰富的照片。几乎完全消除了故障和伪影。皮肤效果更自然（减少僵尸感），细节更加丰富，渲染更逼真，显著降低\"蓝色偏差\"",
    descriptionKO: "흑백 사진을 컬러 사진으로 바꾸면 각종 오래된 사진을 색채가 풍부한 사진으로 바꿀 수 있다.고장과 가짜를 거의 완전히 없앴다.피부 효과는 더욱 자연스럽고 (좀비감 감소), 디테일은 더욱 풍부하며 렌더링은 더욱 사실적이며\"파란색 편차\"를 현저하게 낮춘다",
    descriptionJA: "白黒写真をカラー写真に変えることで、さまざまな古い写真をカラフルな写真に変えることができます。障害やアーティファクトはほとんど完全に解消されました。肌の効果がより自然に（ゾンビ感を減らす）、ディテールがより豊富になり、レンダリングがよりリアルになり、\"青偏差\"を大幅に低減",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574ol",
    totalSupply: 5000000000,
    useCases: [
      "I have a black and white photo from the 1930s. Can you help me intelligently color it to make it look more natural and closer to real colors?",
      "This black and white photo is of my grandfather when he was young. Can you help me repair and color it to make my skin look more natural?",
      "I want to turn this historical photo into color, but I don't want the color to be too blue. Can I adjust it to be more realistic?",
      "This old photo has many scratches and noise. Can you help me repair them while coloring to make the details richer?"
    ],
    useCasesJA: [
      "私は1930年代の白黒写真を持っています。スマートに色を塗って、より自然でリアルな色に近づけるようにしてもらえますか。",
      "この白黒の写真は祖父の若い頃の写真ですが、修復して色を塗って、肌を自然に見せることができますか。",
      "この歴史写真をカラーにしたいのですが、色が青くなってほしくないので、もう少しリアルに調整できますか？",
      "この古い写真には傷やノイズがたくさんありますが、色を塗りながら修復して、細部を豊かにしてもらえますか。"
    ],
    useCasesKO: [
      "나는 20세기 30년대의 흑백사진이 있는데 당신은 나를 도와 지능적으로 색칠을 하여 더욱 자연스럽고 더욱 진실한 색채에 접근하게 할수 있는가?",
      "이 흑백 사진은 우리 할아버지의 젊은 시절 사진인데, 피부를 더 자연스럽게 보이게 복원하고 색칠해 줄 수 있습니까?",
      "나는 이 역사 사진을 컬러로 바꾸고 싶지만, 색깔이 파란색인 것을 원하지 않는다. 좀 더 사실적으로 조정할 수 있을까?",
      "이 오래된 사진은 스크래치와 노이즈가 많은데, 색을 칠하는 동시에 나를 도와 복구하여 디테일을 더욱 풍부하게 할 수 있습니까?"
    ],
    useCasesZH: [
      "我有一张上世纪30年代的黑白照片，你能帮我智能上色，让它看起来更自然、更接近真实色彩吗？",
      "这张黑白合影是我祖父年轻时的照片，能不能帮我修复并上色，让皮肤看起来更自然？",
      "我想把这张历史照片变成彩色的，但不希望颜色偏蓝，能调整得更真实一些吗？",
      "这张旧照片有很多划痕和噪点，能在上色的同时帮我修复，让细节更丰富吗？"
    ],
    socialLinks: "",
    chatEntry: null
  },
  {
    id: 9,
    name: "SuperPixel",
    iaoTokenAmount: 5000000000,

    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/SuperPixel.png",
    symbol: "SPIX",
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
    description: "With the help of SuperPixel's cutting-edge artificial intelligence technology, experience a higher level of image processing, which can enhance image resolution by 16 times.",
    descriptionZH: "借助SuperPixel尖端人工智能技术，体验更高水平的图像处理，可以将图像分辨率增强16倍。",
    descriptionKO: "슈퍼픽셀의 첨단 인공지능 기술로 더 높은 수준의 이미지 처리를 경험하면 이미지 해상도를 16배 향상시킬 수 있다.",
    descriptionJA: "SuperPixelの先端人工知能技術を用いて、より高いレベルの画像処理を体験し、画像解像度を16倍に高めることができる。",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574su",
    totalSupply: 5000000000,
    useCases: [
      "I have an old photo with a very low resolution. Can you help me increase the clarity by 16 times and enhance the details?",
      "Can this blurry screenshot be processed into a high-definition version to make both text and images clearer?",
      "I want to enlarge this small-sized illustration by 16 times, but I don't want to lose details or become blurry. Can you optimize it?",
      "I have a still frame screenshot of an old movie. Can you increase the resolution and reduce noise to make it closer to 4K quality?"
    ],
    useCasesJA: [
      "解像度の低い古い写真を持っていますが、解像度を16倍にして、詳細を強化してもらえますか。",
      "このぼやけたスクリーンショットをハイビジョン版に処理して、文字も画像も鮮明にすることができますか？",
      "この小さいサイズのイラストを16倍に拡大したいのですが、細部を失ったりぼやけたりしたくないので、最適化できますか。",
      "古い映画の静止画のスクリーンショットを持っていますが、解像度を上げてノイズを減らして、4 K画質に近づけてもらえませんか。"
    ],
    useCasesKO: [
      "해상도가 매우 낮은 오래된 사진이 있는데 16배의 선명도를 높이고 디테일을 강화할 수 있습니까?",
      "이 흐릿한 스크린샷은 고화질 버전으로 처리되어 문자와 이미지를 더욱 선명하게 할 수 있습니까?",
      "나는 이 작은 사이즈의 삽화를 16배 확대하고 싶지만, 디테일을 잃거나 흐려지는 것을 원하지 않는다. 당신은 최적화할 수 있습니까?",
      "나는 오래된 영화의 정적 프레임 스크린샷을 가지고 있는데, 해상도를 높이고 노이즈를 줄여 4K 화질에 더 가깝게 할 수 있습니까?"
    ],
    useCasesZH: [
      "我有一张分辨率很低的老照片，能帮我提升16倍清晰度，并增强细节吗？",
      "这张模糊的截图能不能处理成高清版本，让文字和图像都更清晰？",
      "我想把这张小尺寸的插画放大16倍，但不希望失去细节或变得模糊，你能优化吗？",
      "我有一张老电影的静帧截图，能不能提升分辨率并减少噪点，让它更接近4K画质？"
    ],
    socialLinks: "",
    chatEntry: null
  },
  {
    id: 4,
    name: "SuperImage",
    avatar: "/logo/SuperImage.png",
    symbol: "SIC",

    tokenAddress: "0x07D325030dA1A8c1f96C414BFFbe4fBD539CED45",
    // tokenAddress: "0x511F015c477317fBD8427179B8C8d80bd4624277",
    iaoContractAddress: "0x56605228bc99219cf48fc8e80ff9c1601d70cd40",
    tokenAddressTestnet: "0x511F015c477317fBD8427179B8C8d80bd4624277",
    iaoContractAddressTestnet: "0x238d01d57a964ea07fe9f33a1a4853247a3ffada",
   

    type: "Infrastructure",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    
    status: "Tradable",
    statusJA: "トランザクション可能",
    statusKO: "거래 가능",
    statusZH: "可交易",
    
    description: "SuperImage is a Decentralized Image Generation AI. SuperImage has multiple latent text-to-image diffusion models of generating photo-realistic images given any text input, cultivates autonomous freedom to produce incredible imagery, empowers billions of people to create stunning art within seconds. SuperImage is the infrastructure for AI Agents, providing API interfaces for AI Agents to utilize. Official website address: www.superimage.ai",
    descriptionJA: "SuperImageは分散型画像生成AIです。SuperImageは、テキスト入力から写実的な画像を生成する複数の潜在的なテキストから画像への拡散モデルを持ち、驚くべき画像を生成する自律的な自由を育み、数十億の人々が数秒で素晴らしいアートを作成することを可能にします。SuperImageはAIエージェントのインフラストラクチャであり、AIエージェントが利用できるAPIインターフェースを提供します。公式ウェブサイト：www.superimage.ai",
    descriptionKO: "SuperImage는 분산형 이미지 생성 AI입니다. SuperImage는 텍스트 입력에서 사실적인 이미지를 생성하는 여러 잠재적 텍스트-이미지 확산 모델을 보유하고 있으며, 놀라운 이미지를 생성하는 자율적 자유를 육성하고, 수십억 명의 사람들이 몇 초 만에 멋진 예술 작품을 만들 수 있게 합니다. SuperImage는 AI 에이전트를 위한 인프라이며, AI 에이전트가 활용할 수 있는 API 인터페이스를 제공합니다. 공식 웹사이트: www.superimage.ai",
    descriptionZH: "SuperImage 是一个去中心化的图像生成 AI。SuperImage 拥有多个潜在的文本到图像扩散模型，可以根据任何文本输入生成照片级真实的图像，培养自主创作令人惊叹图像的自由，使数十亿人能够在几秒钟内创作出令人惊艳的艺术作品。SuperImage 是 AI 智能体的基础设施，为 AI 智能体提供 API 接口。官方网站：www.superimage.ai",
    createdAt: "12 months ago",
    creatorAddress: "0x2D5D...E574b4",
    totalSupply: 100000000000,
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
    chatEntry: "https://app.superimage.ai",
    iaoTokenAmount: 1000000000,
projectDescription: JSON.stringify({
      'zh': `1. $SIC 8年内总供应量：1000亿，8年后每年挖矿产出50亿
2. 20亿枚的$SIC将通过IAO销售,仅接受$XAA,
投资者将根据其$XAA投资比例获得$SIC。
3.持有不同等级的XAA NFT可提升投资额度：Starter NFT使100万$XAA等效103万（+3%），Pro NFT提升至5%，Master NFT最高加成10%（等效110万）。最终分配的$SIC代币数量由IAO池总量和所有参与者的加权投资额度（NFT类型/等级决定加成比例）共同动态计算得出，并非直接按个人加成比例线性分配。
4. 在为期72小时的IAO结束后，95%的$XAA将分配给链上流动性池，永不撤销，流动性LP凭证被打入黑洞地址。5%的$XAA会被销毁。 
5. IAO 结束后，10亿枚$SIC和$XAA将立即在DBCSwap上建立流动性池，实现$SIC的自由交易`,
      'en': `1. $SIC total supply in 8 years: 100 billion, with 5 billion annual mining output after 8 years
2. 2 billion $SIC will be sold through IAO, only accepting $XAA. Investors will receive $SIC based on their $XAA investment ratio.
3. Different levels of XAA NFT can increase investment allocation: Starter NFT makes 1 million $XAA equivalent to 1.03 million (+3%), Pro NFT increases to 5%, Master NFT maximum bonus 10% (equivalent to 1.1 million). The final distribution of $SIC tokens is dynamically calculated based on the total IAO pool and all participants' weighted investment amounts (NFT type/level determines bonus ratio), not directly distributed according to individual bonus ratios.
4. After the 72-hour IAO ends, 95% of $XAA will be allocated to the on-chain liquidity pool, never to be revoked, and the liquidity LP certificate will be sent to the black hole address. 5% of $XAA will be destroyed.
5. After IAO, 1 billion $SIC and $XAA will immediately establish a liquidity pool on DBCSwap, enabling free trading of $SIC.`,
      'ja': `1. $SIC 8年間の総供給量：1000億、8年後は年間50億の採掘産出
2. 20億枚の$SICがIAOを通じて販売され、$XAAのみを受け付けます。投資家は$XAAの投資比率に応じて$SICを受け取ります。
3. 異なるレベルのXAA NFTで投資枠を増加：Starter NFTは100万$XAAを103万相当（+3%）に、Pro NFTは5%増加、Master NFTは最大10%ボーナス（110万相当）。最終的な$SICトークンの配分は、IAOプール総額と参加者全員の重み付け投資額（NFTタイプ/レベルによるボーナス率）に基づいて動的に計算され、個人のボーナス率に応じた直線的な配分ではありません。
4. 72時間のIAO終了後、95%の$XAAがオンチェーン流動性プールに割り当てられ、永久に取り消されることはなく、流動性LP証明書がブラックホールアドレスに送信されます。5%の$XAAは破壊されます。
5. IAO終了後、10億枚の$SICと$XAAは直ちにDBCSwapで流動性プールを確立し、$SICの自由取引を可能にします。`,
      'ko': `1. $SIC 8년 내 총 공급량: 1000억, 8년 후 매년 채굴 산출량 50억
2. 20억 개의 $SIC가 IAO를 통해 판매될 것이며, $XAA만 받습니다. 투자자는 $XAA 투자 비율에 따라 $SIC를 받게 됩니다.
3. 다양한 등급의 XAA NFT로 투자 한도 증가: Starter NFT는 100만 $XAA를 103만 상당(+3%)으로, Pro NFT는 5% 증가, Master NFT는 최대 10% 보너스(110만 상당). 최종 $SIC 토큰 분배는 IAO 풀 총액과 모든 참가자의 가중 투자액(NFT 유형/등급에 따른 보너스 비율)을 기반으로 동적으로 계산되며, 개인 보너스 비율에 따른 선형 분배가 아닙니다.
4. 72시간의 IAO 종료 후, 95%의 $XAA가 온체인 유동성 풀에 할당되어 영구적으로 취소되지 않으며, 유동성 LP 증명서가 블랙홀 주소로 전송됩니다. 5%의 $XAA는 소각됩니다.
5. IAO 종료 후, 10억 개의 $SIC와 $XAA는 즉시 DBCSwap에 유동성 풀을 구축하여 $SIC의 자유로운 거래를 가능하게 합니다.`
    })
  },

  {
    id: 11,
    name: "DecentralGPT",
    tokenAddress: "0x18386F368e7C211E84324337fA8f62d5093272E1",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/DecentralGPT.png",
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
    createdAt: "12 months ago",
    creatorAddress: "0x3E6E...F685c5",
    totalSupply: 5000000000,
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
    chatEntry: "https://www.degpt.ai",
    iaoTokenAmount: 5000000000
  },

  {
    id: 3,
    name: "DeepLink",
    tokenAddress: "0x6f8F70C74FE7d7a61C8EAC0f35A4Ba39a51E1BEe",
    iaoContractAddress: "0xcc6c5b583dd03a900dbf850449d50cec8833273f",
    tokenAddressTestnet: "0x4aF0632B0E63EE55e69e76c912E376731EECdbc5",
    iaoContractAddressTestnet: "0xb65ecab181c3298adea95e13d4a70377ea6db074",
    iaoTokenAmount: 50000000,


    avatar: "/logo/DeepLink.png",
    symbol: "DLC",
    type: "AI Agent",
    marketCap: "$0",
    change24h: "0",
    lifetime: "",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "Tradable",
    statusJA: "トランザクション可能",
    statusKO: "거래 가능",
    statusZH: "可交易",
    description: `DeepLink is a decentralized cloud gaming protocol driven by AI and blockchain technology. It integrates artificial intelligence, gaming, GPU, and decentralized physical infrastructure network (DePIN) to create a brand new Web3 gaming ecosystem.

DeepLink adopts ultra-low latency game rendering technology, supporting a wide range of application scenarios, including cloud esports, cloud internet cafes, cloud 3A games, blockchain games, and cloud VR/AR/XR. The DeepLink protocol combined with AI technology can significantly improve game graphics and clarity, providing players with the ultimate cloud gaming experience.

DeepLink's AI agent is named Dee and provides the following core features:

AI Agent Driven Intelligent Gaming Experience:

1. Real time interaction:
-AI agents can be activated on demand, recognize users' game interfaces, and provide real-time guidance and strategy recommendations.

2. Automated game control:
-The functions of AI agents are constantly evolving, gradually improving from basic operations to advanced operations:
-Basic tasks: resource collection, task guidance.
-Intermediate tasks: optimizing combat strategies and executing complex tasks.
-Advanced tasks: Global planning, handling high difficulty game scenes.

3. Voice command support:
-Users can control AI agents to perform in-game tasks through voice commands, simplifying interaction and reducing learning costs.`,
    descriptionJA: `DeepLinkはAIとブロックチェーン技術によって駆動される非中心化クラウドゲームプロトコルである。人工知能、ゲーム、GPUと非中心化物理インフラネットワーク（DePIN）を融合させ、新しいWeb 3ゲーム生態を構築した。

DeepLinkは超低遅延のゲームレンダリング技術を採用し、クラウドeスポーツ、クラウドネットカフェ、クラウド3 Aゲーム、ブロックチェーンゲーム及びクラウドVR/AR/XRなどの幅広い応用シーンをサポートしている。DeepLinkプロトコルはAI技術を結合し、ゲームの画質と鮮明さを大幅に向上させ、プレイヤーに究極のクラウドゲーム体験を提供することができる。

DeepLinkのAIエージェント名はDeeで、次のコア機能を提供します。

AIエージェントによるスマートゲーム体験：

1.リアルタイム対話：
-AIエージェントは必要に応じてアクティブ化し、ユーザーのゲームインタフェースを識別し、リアルタイムのガイダンスとポリシーアドバイスを提供します。

2.自動化ゲーム操作：
-AIエージェントの機能は進化し続け、基礎操作から高度な操作まで徐々に向上：
-基本タスク：リソース収集、タスクガイド。
-中級タスク：戦闘戦略の最適化、複雑なタスクの実行。
-高度なタスク：高難易度のゲームシーンをグローバルに計画し、処理します。

3.音声命令サポート：
-ユーザーは音声コマンドを通じてAIエージェントを操作してゲーム内のタスクを実行することができ、インタラクション方式を簡略化し、学習コストを削減することができる。`,
    descriptionKO: `DeepLink는 AI와 블록체인 기술로 구동되는 탈중심화 클라우드 게임 프로토콜이다.인공지능, 게임, GPU, 탈중심화된 물리적 인프라 네트워크 (DePIN) 를 융합해 새로운 Web3 게임 생태계를 만들었다.

DeepLink는 초저지연의 게임 렌더링 기술을 사용하여 클라우드 e스포츠, 클라우드 PC방, 클라우드 3A 게임, 블록체인 게임 및 클라우드 VR/AR/XR 등을 포함한 광범위한 응용 장면을 지원한다.DeepLink 프로토콜은 AI 기술을 결합하여 게임 화질과 선명도를 크게 향상시키고 게이머에게 최고의 클라우드 게임 경험을 제공합니다.

DeepLink의 AI Agent 이름은 Dee이며 다음 핵심 기능을 제공합니다.

AI Agent 기반 스마트 게임 환경:

1.실시간 상호 작용:
- AI Agent를 필요에 따라 활성화하고 사용자의 게임 인터페이스를 식별하며 실시간 지침 및 정책 제안을 제공합니다.

2. 게임 조작 자동화:
- AI Agent의 기능은 기본 작업에서 고급 작업으로 진화하고 있습니다.
- 기본 작업: 리소스 수집, 작업 지침
- 중급 임무: 전투 전략 최적화, 복잡한 임무 수행.
- 고급 작업: 고난도 게임 시나리오를 전체적으로 계획하고 처리합니다.

3. 음성 명령 지원:
- 사용자는 음성 명령을 통해 AI Agent를 조작하여 게임 내 작업을 수행할 수 있으며, 상호 작용을 간소화하고 학습 비용을 절감할 수 있습니다.`,
    descriptionZH: `DeepLink 是一个由AI和区块链技术驱动的去中心化云游戏协议。它融合了人工智能、游戏、GPU和去中心化物理基础设施网络（DePIN），打造了一个全新的 Web3 游戏生态。

DeepLink 采用 超低延迟的游戏渲染技术，支持广泛的应用场景，包括云电竞、云网吧、云端 3A 游戏、区块链游戏以及云 VR/AR/XR 等。DeepLink协议结合AI技术，可显著提升游戏画质和清晰度，为玩家提供极致的云游戏体验。

DeepLink的AI Agent名为Dee，并提供以下核心功能：  

AI Agent 驱动的智能游戏体验：

1. 实时交互： 
- AI Agent 可按需激活，识别用户的游戏界面，并提供实时指导与策略建议。  

2. 自动化游戏操控：  
- AI Agent 的功能不断进化，从基础操作到高级操作逐步提升：  
- 基础任务： 资源收集、任务指引。  
- 中级任务： 战斗策略优化、执行复杂任务。  
- 高级任务： 全局规划、处理高难度游戏场景。  

3. 语音指令支持： 
- 用户可通过语音指令操控 AI Agent 执行游戏内任务，简化交互方式，降低学习成本。`,
    createdAt: "12 months ago",
    creatorAddress: "0x6f8F...BEe",
    totalSupply: 100000000000,
    marketCapTokenNumber: 100000000000,
    useCases: [
      "Help me increase the volume a bit",
      "How to break the level of Wukong Huangfengling in the Black Myth",
      "What new 3A games have been released recently?",
      "When will GTA6 be released?"
    ],
    useCasesJA: [
      "声を大きくしてください",
      "黒神話悟空黄風嶺この関はどうする",
      "最近出てきた新しい3 Aゲームは何ですか。",
      "GTA 6はいつ発表されますか。"
    ],
    useCasesKO: [
      "소리 좀 키워주세요",
      "흑신화 오공 황풍령 이 관문 어떻게 하나",
      "최근에 새로운 3A 게임 뭐가 나왔어요",
      "GTA6는 언제 출시됩니까?"
    ],
    useCasesZH: [
      "帮我把声音调大一些",
      "黑神话悟空黄风岭这关怎么破",
      "最近出来什么新的3A游戏",
      "GTA6什么时候发布？"
    ],
    // 英文推特： https://x.com/DeepLinkGlobal
    //   日文推特：https://x.com/DeepLinkJapan
    //   英文电报：https://t.me/deeplinkglobal 
    //   youtube：https://www.youtube.com/@deeplinkglobal
    //   日文电报： https://t.me/DeepLinkJapan
    socialLinks: "https://x.com/DeepLinkGlobal, https://x.com/DeepLinkJapan, https://t.me/deeplinkglobal, https://www.youtube.com/@deeplinkglobal, https://t.me/DeepLinkJapan",
    chatEntry: null,
    projectDescription: JSON.stringify({
      'zh': `1. $DLC总供应量：1000亿。
2. 5000万枚的$DLC将通过IAO销售,仅接受$XAA,投资者将根据其$XAA投资比例获得$DLC。
3. 在为期7天的IAO结束后，95%的$XAA将分配给链上流动性池，永不撤销，流动性LP凭证被打入黑洞地址。5%的$XAA会被销毁。 
4. IAO 结束后，1000万枚$DLC和$XAA将立即在DBCSwap上建立流动性池，实现$DLC的自由交易`,
      'en': `1. $DLC total supply: 100 billion.
2. 50 million $DLC will be sold through IAO, only accepting $XAA.Investors will receive $DLC based on their $XAA investment ratio.
3. After 7 days of IAO, 95% of $XAA will be allocated to the on-chain liquidity pool, never revoked, and the liquidity LP certificate will be sent to the black hole address. 5% of $XAA will be destroyed. 
4. After IAO, 10 million $DLC and $XAA will be immediately listed on DBCSwap, enabling free trading of $DLC.`,
      'ja': `1. $DLC総供給量：1000億。
2. 5000万枚の$SICがIAOで販売され、$XAAのみを受け入れます。投資家は、$XAAの投資比率に応じて$SICを受け取ります。
3. IAO終了後、7日間で95%の$XAAがオンチェーン流動性プールに割り当てられ、流動性LP証券がブラックホールアドレスに送信されます。5%の$XAAは破壊されます。
4. IAO終了後、1000万枚の$SICと$XAAはすぐにDBCSwapで流動性プールを作成し、$SICの自由取引を可能にします。`,
      'ko': `1. $DLC 총 공급량: 1000억.
2. 5000만 개의 $SIC가 IAO를 통해 판매될 것입니다. 단, $XAA만 받습니다.
3. IAO 종료 후 7일 동안 95%의 $XAA가 온체인 유동성 풀에 할당되어 영구적으로 취소되지 않고, 유동성 LP 증명서가 블랙홀 주소로 전송됩니다. 5%의 $XAA는 소각됩니다.
4. IAO 종료 후 1000만 개의 $DLC와 $XAA는 즉시 DBCSwap에 상장되어 $DLC의 자유 거래를 가능하게 합니다.`,
    })

  },
  {
    id: 13,
    name: "XPersonity",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/XPersonity.png",
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
    description: `XPersonity is a super fun and incredibly useful tool designed to uncover the personality secrets behind any X account! By diving deep into the posting history of X users, it delivers a sharp, witty, and often hilarious personality analysis that's guaranteed to make you smile.  

But that's not all—XPersonity also lets you "matchmake" two X accounts to see how compatible their personalities are, like having your very own personality pairing expert. And the coolest part? It can create a one-of-a-kind "digital twin" based on your own posting history! This digital twin learns your style, gets better over time, and can even post, reply to fans, and handle tasks for you on platforms like X, Discord, and Telegram.

Whether you're looking to uncover some laughs, match up friends, or build your personal digital twin, XPersonity has you covered. Give it a try and take your X social game to the next level!`,
    descriptionJA: `XPersonityは、Xアカウントの背後にある性格の秘密を明らかにする、超楽しく信じられないほど便利なツールです！ユーザーの投稿履歴を深く分析し、鋭く、機知に富み、思わず笑ってしまうような性格分析を提供します。

それだけではありません。XPersonityは、まるで専属の相性診断士のように、2つのXアカウント間の性格の相性を診断することもできます。さらに最も魅力的な機能は、あなたの投稿履歴に基づいてユニークな「デジタルツイン」を作成できること！このデジタルツインは、あなたのスタイルを学習し、時間とともに進化し、X、Discord、Telegramなどのプラットフォームで投稿やファンへの返信、タスク処理までこなすことができます。

楽しい発見を求めている人も、友達との相性を確かめたい人も、自分専用のデジタルツインを作りたい人も、XPersonityがすべてサポートします。さあ、試してみて、あなたのソーシャルライフを次のレベルへ引き上げましょう！`,
    descriptionKO: `XPersonity는 X 계정 뒤에 숨겨진 성격의 비밀을 밝혀내는 매우 재미있고 믿을 수 없을 만큼 유용한 도구입니다! 사용자의 게시 기록을 깊이 분석하여 날카롭고, 재치 있으며, 웃음을 자아내는 성격 분석을 제공합니다.

하지만 이게 전부가 아닙니다. XPersonity는 마치 개인 성격 매칭 전문가처럼 두 X 계정의 성격 궁합도 진단할 수 있습니다. 가장 멋진 점은? 당신의 게시 기록을 바탕으로 세상에 하나뿐인 '디지털 트윈'을 만들 수 있다는 것입니다! 이 디지털 트윈은 당신의 스타일을 학습하고 시간이 지날수록 발전하며, X, Discord, Telegram 등의 플랫폼에서 게시물 작성, 팬들과의 소통, 작업 처리까지 가능합니다.

재미있는 발견을 원하든, 친구들과의 궁합을 확인하고 싶든, 개인 디지털 트윈을 만들고 싶든 XPersonity가 도와드립니다. 지금 시작하고 당신의 소셜 라이프를 한 단계 업그레이드하세요!`,
    descriptionZH: `XPersonity 是一个超级有趣且非常实用的工具，专门用来揭示任何 X 账号背后的性格秘密！通过深入分析用户的发帖历史，它能提供一个尖锐、机智且常常令人捧腹的性格分析，保证能让你会心一笑。

但这还不是全部——XPersonity 还能像一个专业的性格配对专家一样，帮你分析两个 X 账号，看看他们的性格有多匹配。最酷的是什么？它可以基于你的发帖历史创建一个独一无二的"数字分身"！这个数字分身会学习你的风格，随时间不断进步，甚至能在 X、Discord 和 Telegram 等平台上为你发帖、回复粉丝、处理任务。

无论你是想发掘一些欢乐，为朋友做性格配对，还是打造你的专属数字分身，XPersonity 都能满足你。快来试试，让你的社交体验更上一层楼！`,
    createdAt: "2 months ago",
    creatorAddress: "0x4F7F...G796d6",
    totalSupply: 5000000000,
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
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
  {
    id: 14,
    name: "ASIXT",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/ASIXT.png",
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
    totalSupply: 5000000000,
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
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
  {
    id: 15,
    name: "ArgusAI",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/ArgusAI.png",
    symbol: "ARGU",
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
    description: "A cryptocurrency trading AI that autonomously analyzes market strategies and trades digital currencies on the DBC chain.\nInitial Fund:\n- 50% of XAA raised from $ARGU\n- Serves as a reference example to show investors the AI's effectiveness\n- 30-day settlement cycle with complete token buyback and burn\nInvestment Plans:\n1. 7-Day Settlement Fund\n- Maximum investment: 100,000 XAA per investor\n- Weekly settlement\n- Principal returned in XAA\n- Profits distributed in ARGU with 10% burn\n2. 30-Day Settlement Fund\n- Maximum investment: 100,000 XAA per investor\n- Monthly settlement\n- Principal returned in XAA\n- Profits distributed in ARGU with 10% burn\nRisk Notice: In case of loss, returns are proportional to XAA investment.",
    descriptionZH: "炒币AI，AI自主分析市场策略，根据不同来源的宏观和微观信息，在DBC链上自主买卖数字货币，定期会将利润回购代币进行销毁。\n原始资金：用50%的$ARGU募集到的XAA，作为参照样例，让投资者看到AI的效果。这个30天结算一次，会将利润购买$ARGUS并且全部销毁。\n投资方案：\n1. 7天结算基金\n- 每个投资者最多投资10万个$XAA\n- 7天结算一次\n- 本金以$XAA的形式返回\n- 利润回购成$ARGU分配给投资者，其中10%的$ARGU会被销毁\n2. 30天结算基金\n- 每个投资者最多投资10万个$XAA\n- 1个月结算一次\n- 本金以$XAA的形式返回\n- 利润回购成$ARGU分配给投资者，其中10%的$ARGUS会被销毁\n风险说明：如果到期亏损，也是按照投资的$XAA比例返回。",
    descriptionKO: "ArgusAI는 DBC 체인상에서 디지털 통화를 자율적으로 거래하는 암호화폐 트레이딩 AI입니다.\n초기 자금:\n- $ARGU에서 모금한 XAA의 50%\n- 투자자들에게 AI의 효과를 보여주는 참조 사례로 사용\n- 30일 주기로 정산되며 토큰 전량 매입 및 소각\n투자 계획:\n1. 7일 정산 펀드\n- 투자자당 최대 투자: 100,000 XAA\n- 주간 정산\n- 원금은 XAA로 반환\n- 수익은 ARGU로 분배되며 10% 소각\n2. 30일 정산 펀드\n- 투자자당 최대 투자: 100,000 XAA\n- 월간 정산\n- 원금은 XAA로 반환\n- 수익은 ARGU로 분배되며 10% 소각\n리스크 공지: 손실 발생 시 XAA 투자 비율에 따라 반환됩니다.",
    descriptionJA: "ArgusAIはDBCチェーン上でデジタル通貨を自主的に取引する仮想通貨取引AIです。\n初期資金:\n- $ARGUから調達したXAAの50%\n- 投資家にAIの効果を示す参考例として使用\n- 30日周期で決算し、トークンを全量買戻して焼却\n投資プラン:\n1. 7日決算ファンド\n- 投資家あたりの最大投資額: 100,000 XAA\n- 週次決算\n- 元本はXAAで返還\n- 利益はARGUで分配され、10%が焼却\n2. 30日決算ファンド\n- 投資家あたりの最大投資額: 100,000 XAA\n- 月次決算\n- 元本はXAAで返還\n- 利益はARGUで分配され、10%が焼却\nリスク通知: 損失が発生した場合、XAA投資比率に応じて返還されます。",
    createdAt: "1 month ago",
    creatorAddress: "0x6H9H...I918f8",
    totalSupply: 5000000000,
    useCases: [
      "Show me the 7-day fund performance",
      "What's the current profit of the 30-day fund",
      "What's the total amount of ARGU burned",
      "Show me the trading history of the AI"
    ],
    useCasesJA: [
      "7日間ファンドのパフォーマンスを表示",
      "30日間ファンドの現在の利益を確認",
      "焼却されたARGUの総額を確認",
      "AIの取引履歴を表示"
    ],
    useCasesKO: [
      "7일 펀드 성과 보기",
      "30일 펀드의 현재 수익 확인",
      "소각된 ARGU 총액 확인",
      "AI의 거래 기록 보기"
    ],
    useCasesZH: [
      "显示7天基金的表现",
      "查看30天基金的当前收益",
      "查看已销毁的ARGU总量",
      "显示AI的交易历史"
    ],
    socialLinks: "",
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
  {
    id: 17,
    name: "AutoKol",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/AutoKol.png",
    symbol: "AKOL",
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
    description: "AutoKol provides one-stop social media automation support for KOLs and project teams, helping them promote brands, attract fans, and enhance market influence more efficiently.",
    descriptionZH: "为 KOL 和项目方提供一站式的社交媒体自动化运营支持，帮助他们更高效地推广品牌、吸引粉丝，并提升市场影响力。\n核心功能：\n1. 智能内容创作\n- 自动整理白皮书、官网信息和最新动态\n- 生成优质的文字、图片或视频内容\n- 一键发布到 X 等社交平台，让宣传更简单高效\n2. 智能互动与推广\n- 自动回复评论、精准发现潜在用户\n- 通过多个 AI 账号互动推广\n- 提高曝光度和品牌影响力\n3. 活动运营与奖励发放\n- 轻松发起空投、游戏等互动活动\n- 自动完成奖励分发\n- 激活社群，提升用户参与度和忠诚度\n4. 数据驱动增长\n- 实时分析用户反馈\n- 不断优化内容和推广策略\n- 实现粉丝的持续增长和高效转化\n解决方案价值：大幅降低运营成本，让 KOL 和项目方在激烈竞争中快速崛起，建立强大的品牌影响力，并最大化社交媒体营销的价值。",
    descriptionKO: "KOL과 프로젝트 팀을 위한 원스톱 소셜 미디어 자동화 지원.\n핵심 기능:\n1. 지능형 콘텐츠 제작\n- 백서, 웹사이트 정보 및 업데이트 자동 정리\n- 고품질 텍스트, 이미지, 비디오 콘텐츠 생성\n- X 등 플랫폼에 원클릭 게시\n2. 스마트 상호작용 & 프로모션\n- 자동 댓글 응답\n- 정확한 잠재 사용자 발굴\n- 다중 AI 계정 상호작용\n3. 캠페인 운영 & 보상\n- 손쉬운 에어드롭 및 게임 이벤트 시작\n- 자동화된 보상 분배\n- 커뮤니티 활성화 및 참여\n4. 데이터 기반 성장\n- 실시간 사용자 피드백 분석\n- 지속적인 콘텐츠 및 프로모션 최적화\n- 지속 가능한 팬 성장 및 전환",
    descriptionJA: "KOLとプロジェクトチームのためのワンストップソーシャルメディア自動化サポート。\n主要機能:\n1. インテリジェントコンテンツ作成\n- ホワイトペーパー、ウェブサイト情報、更新の自動整理\n- 高品質なテキスト、画像、動画コンテンツの生成\n- Xなどのプラットフォームへのワンクリック投稿\n2. スマートインタラクション & プロモーション\n- 自動コメント応答\n- 正確な潜在ユーザーの発掘\n- マルチAIアカウントインタラクション\n3. キャンペーン運営 & 報酬\n- 簡単なエアドロップとゲームイベントの開始\n- 自動化された報酬配布\n- コミュニティの活性化と参加\n4. データ駆動型成長\n- リアルタイムユーザーフィードバック分析\n- 継続的なコンテンツとプロモーションの最適化\n- 持続可能なファン成長と転換",
    createdAt: "1 month ago",
    creatorAddress: "0x7I0I...J029g9",
    totalSupply: 5000000000,
    useCases: [
      "Create a promotional campaign for my new NFT collection",
      "Generate and schedule social media content for the next week",
      "Analyze my social media performance",
      "Set up an airdrop campaign"
    ],
    useCasesJA: [
      "新しいNFTコレクションのプロモーションキャンペーンを作成",
      "来週のソーシャルメディアコンテンツを生成してスケジュール設定",
      "ソーシャルメディアのパフォーマンスを分析",
      "エアドロップキャンペーンを設定"
    ],
    useCasesKO: [
      "새로운 NFT 컬렉션을 위한 프로모션 캠페인 생성",
      "다음 주 소셜 미디어 콘텐츠 생성 및 일정 관리",
      "소셜 미디어 성과 분석",
      "에어드롭 캠페인 설정"
    ],
    useCasesZH: [
      "为我的新NFT系列创建推广活动",
      "生成并安排下周的社交媒体内容",
      "分析我的社交媒体表现",
      "设置空投活动"
    ],
    socialLinks: "",
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
  {
    id: 18,
    name: "LingXi",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/LingXi.png",
    symbol: "LINGXI",
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
    description: "The world's first immersive dating social platform based on deep AI analysis, creating efficient, precise, and interesting intelligent dating experiences through multi-modal data fusion and Token economic system.",
    descriptionZH: "定位：全球首款基于深度AI分析的沉浸式婚恋社交平台，通过多模态数据融合和Token经济系统，打造高效、精准、有趣的智能婚恋体验。\n一句话slogan：'比你自己更懂你想要的爱情'——灵犀AI，从200个维度计算你的命中注定。\nAI数据维度全面升级：\n1. 基因级用户画像\n- 识别整合公开资料\n- 人脸识别、动态行为（如聊天语气、互动频率）\n- 第三方权威认证\n- 构建超过200项个人特征标签\n2. 情绪与价值观分析\n- 通过智能对话中的微表情识别（视频聊天时）\n- 语义情感分析\n- 判断用户隐性需求（如'是否接受丁克'或'家庭责任感'权重）\n3. 动态匹配引擎\n- 用户数据实时更新（如职业变动、兴趣迁移）\n- AI每天重新计算匹配度\n- 推送'缘分波动提示'",
    descriptionKO: "심층 AI 분석 기반의 세계 최초 몰입형 데이팅 소셜 플랫폼으로, 멀티모달 데이터 융합과 토큰 경제 시스템을 통해 효율적이고 정확하며 재미있는 지능형 데이팅 경험을 제공합니다.\n슬로건: '당신보다 더 잘 아는 당신의 사랑' - 링시 AI가 200가지 차원에서 당신의 운명을 계산합니다.\nAI 데이터 차원 업그레이드:\n1. 유전자 수준 사용자 프로필링\n- 공개 정보 통합\n- 얼굴 인식 및 행동 역학\n- 제3자 권위 인증\n- 200+ 개인 특성 태그\n2. 감정 & 가치관 분석\n- 화상 채팅 중 미세 표정 인식\n- 의미론적 감정 분석\n- 숨겨진 요구 사항 평가\n3. 동적 매칭 엔진\n- 실시간 사용자 데이터 업데이트\n- 일일 AI 호환성 재계산\n- 인연 변동 알림",
    descriptionJA: "深層AI分析に基づく世界初の没入型デーティングソーシャルプラットフォームで、マルチモーダルデータ融合とトークン経済システムを通じて、効率的で正確かつ面白いインテリジェントなデーティング体験を提供します。\nスローガン：'あなた以上にあなたの愛を理解する' - 霊犀AIが200次元であなたの運命を計算します。\nAIデータ次元のアップグレード:\n1. 遺伝子レベルのユーザープロファイリング\n- 公開情報の統合\n- 顔認識と行動力学\n- 第三者機関認証\n- 200+個人特性タグ\n2. 感情 & 価値観分析\n- ビデオチャット中の微表情認識\n- 意味論的感情分析\n- 潜在的ニーズ評価\n3. 動的マッチングエンジン\n- リアルタイムユーザーデータ更新\n- 日次AI互換性再計算\n- 縁の変動通知",
    createdAt: "1 month ago",
    creatorAddress: "0x10L3L...M352j2",
    totalSupply: 5000000000,
    useCases: [
      "Find my perfect match",
      "Analyze my dating preferences",
      "Get personality compatibility report",
      "Receive daily match recommendations"
    ],
    useCasesJA: [
      "理想のパートナーを見つける",
      "デート傾向を分析",
      "性格相性レポートを取得",
      "デイリーマッチング推薦を受け取る"
    ],
    useCasesKO: [
      "나의 완벽한 매치 찾기",
      "데이팅 선호도 분석",
      "성격 궁합 리포트 받기",
      "일일 매치 추천 받기"
    ],
    useCasesZH: [
      "找到我的完美匹配",
      "分析我的约会偏好",
      "获取性格匹配报告",
      "接收每日匹配推荐"
    ],
    socialLinks: "",
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
  {
    id: 19,
    name: "Satori",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/Satori.png",
    symbol: "SATORI",
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
    description: "Satori AI investment analysis assistant integrates various information sources to conduct comprehensive project analysis and generate easy-to-understand investment reports, helping investors quickly understand project value, reduce investment risks, and provide real-time updates and dynamic consulting services.",
    descriptionZH: "AI 投资分析助手能够整合各类信息来源，对项目进行全面分析，并形成简明易懂的投资报告，帮助投资者快速理解项目价值，降低投资风险，同时提供实时更新和动态咨询服务。\n核心功能：\n1. 多渠道信息采集\n- 官网：解析项目官网的技术文档、路线图、团队信息、合作伙伴等\n- 社交媒体：监控 Twitter、Discord、Telegram、Reddit 等，分析社群活跃度、关注者增长、KOL 评价等\n- 新闻资讯：自动抓取加密货币和区块链行业的新闻，判断项目是否有正面或负面报道\n- GitHub/代码库：分析代码更新频率、贡献者数量、代码质量等，判断技术活跃度\n- 链上数据：追踪代币持仓分布、交易量变化、大户买入卖出情况等\n- 论坛 & 研究报告：提取 Messari、TokenInsight、CoinGecko 等研究机构的数据，结合 AI 进行分析",
    descriptionKO: "AI 투자 분석 어시스턴트는 다양한 정보 소스를 통합합니다.\n핵심 기능:\n1. 다중 채널 정보 수집\n- 웹사이트: 기술 문서, 로드맵, 팀 정보 파싱\n- 소셜 미디어: Twitter, Discord, Telegram, Reddit 모니터링\n- 뉴스: 암호화폐 및 블록체인 산업 뉴스 자동 캡처\n- GitHub: 코드 업데이트, 기여자, 품질 분석\n- 온체인 데이터: 토큰 분배, 거래량 추적\n- 포럼 & 리서치: Messari, TokenInsight, CoinGecko 데이터 추출\n2. 스마트 분석 & 등급\n- 상세한 근거와 함께 프로젝트 점수 산정\n- 리스크 평가 및 조기 경보\n- 시장 트렌드 예측\n3. 자동화된 투자 보고서\n- 일간/주간 업데이트\n- 종합적인 프로젝트 분석\n- AI 기반 트렌드 예측",
    descriptionJA: "AI投資分析アシスタントは、様々な情報源を統合します。\n主要機能:\n1. マルチチャネル情報収集\n- ウェブサイト: 技術文書、ロードマップ、チーム情報の解析\n- ソーシャルメディア: Twitter、Discord、Telegram、Redditの監視\n- ニュース: 暗号資産とブロックチェーン業界のニュース自動キャプチャ\n- GitHub: コード更新、貢献者、品質の分析\n- オンチェーンデータ: トークン分配、取引量の追跡\n- フォーラム & リサーチ: Messari、TokenInsight、CoinGeckoのデータ抽出\n2. スマート分析 & 格付け\n- 詳細な根拠を伴うプロジェクトスコアリング\n- リスク評価と早期警告\n- 市場トレンド予測\n3. 自動化された投資レポート\n- 日次/週次更新\n- 包括的なプロジェクト分析\n- AI駆動のトレンド予測",
    createdAt: "1 month ago",
    creatorAddress: "0x8J1J...K130h0",
    totalSupply: 5000000000,
    useCases: [
      "Analyze the latest DeFi project",
      "Track the performance of my portfolio",
      "Alert me about potential risks in my investments",
      "Generate a comprehensive report for project X"
    ],
    useCasesJA: [
      "最新のDeFiプロジェクトを分析",
      "ポートフォリオのパフォーマンスを追跡",
      "投資の潜在的リスクについて警告",
      "プロジェクトXの包括的なレポートを生成"
    ],
    useCasesKO: [
      "최신 DeFi 프로젝트 분석",
      "내 포트폴리오 성과 추적",
      "투자의 잠재적 위험 알림",
      "프로젝트 X에 대한 종합 보고서 생성"
    ],
    useCasesZH: [
      "分析最新的DeFi项目",
      "追踪我的投资组合表现",
      "提醒我投资中的潜在风险",
      "生成项目X的综合报告"
    ],
    socialLinks: "",
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
  {
    id: 20,
    name: "MeetMind",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/MeetMind.png",
    symbol: "MEET",
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
    description: "MeetMind is a comprehensive intelligent meeting AI Agent that handles pre-meeting preparation, real-time collaboration, dynamic knowledge management, and advanced intelligent analysis.",
    descriptionZH: "MeetMind 全流程智能会议AI Agent\n1. 会前准备系统\n- 议程自动生成（基于历史会议内容智能建议）\n- AI虚拟主持（支持个性化角色设定：部门例会模式/客户会议模式/头脑风暴模式）\n- 跨平台日程同步（自动抓取邮件/钉钉/Teams的会议邀请）\n2. 实时协作中枢\n- 多模态记录（同时记录语音转录、聊天区信息）\n- 智能发言人追踪（声纹识别+视频分析，自动标注发言归属）\n- 实时标注系统（对关键决策/待办事项进行即时打标）\n3. 动态知识管理系统\n- 分权式记忆库：按项目/部门/保密等级建立独立记忆单元\n- 语义关系图谱：自动构建议题-决策-责任人关联网络\n- 多维度溯源：支持通过关键词/时间线/参与人进行立体检索\n4. 进阶智能分析\n- 沟通效率报告（发言时长分布、话题偏离度分析）\n- 多语种实时转译（支持中日英等12种语言实时字幕）",
    descriptionKO: "MeetMind는 회의 준비, 실시간 협업, 동적 지식 관리, 고급 지능형 분석을 처리하는 종합 지능형 회의 AI Agent입니다.\n1. 회의 전 준비 시스템\n- 과거 회의 내용 기반 의제 자동 생성\n- 맞춤형 역할의 AI 가상 호스팅\n- 크로스 플랫폼 일정 동기화\n2. 실시간 협업 허브\n- 다중 모달 기록\n- 스마트 발언자 추적\n- 실시간 의사결정 태깅\n3. 동적 지식 관리\n- 프로젝트/부서별 분산 메모리 뱅크\n- 의미론적 관계 매핑\n- 다차원 추적성\n4. 고급 분석\n- 커뮤니케이션 효율성 보고서\n- 12개 언어 실시간 번역",
    descriptionJA: "MeetMindは、会議準備、リアルタイムコラボレーション、動的知識管理、高度なインテリジェント分析を処理する包括的なインテリジェント会議AIエージェントです。\n1. 会議前準備システム\n- 過去の会議内容に基づく議題自動生成\n- カスタマイズ可能な役割のAI仮想ホスティング\n- クロスプラットフォームスケジュール同期\n2. リアルタイムコラボレーションハブ\n- マルチモーダル記録\n- スマート発言者追跡\n- リアルタイム意思決定タグ付け\n3. 動的知識管理\n- プロジェクト/部署別分散メモリーバンク\n- 意味的関係マッピング\n- 多次元トレーサビリティ\n4. 高度な分析\n- コミュニケーション効率性レポート\n- 12言語リアルタイム翻訳",
    createdAt: "1 month ago",
    creatorAddress: "0x11M4M...N463k3",
    totalSupply: 5000000000,
    useCases: [
      "Schedule a smart meeting",
      "Generate meeting summary",
      "Track action items",
      "Translate meeting in real-time"
    ],
    useCasesJA: [
      "スマートミーティングをスケジュール",
      "会議サマリーを生成",
      "アクションアイテムを追跡",
      "会議をリアルタイムで翻訳"
    ],
    useCasesKO: [
      "스마트 미팅 예약",
      "회의 요약 생성",
      "액션 아이템 추적",
      "실시간 회의 통역"
    ],
    useCasesZH: [
      "安排智能会议",
      "生成会议摘要",
      "追踪行动项目",
      "实时翻译会议"
    ],
    socialLinks: "",
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
  {
    id: 21,
    name: "SynthLook",
    tokenAddress: "",
    avatar: "http://xaiagent.oss-ap-northeast-2.aliyuncs.com/logo/SynthLook.png",
    symbol: "SYNTH",
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
    description: "Your fashion radar, tracking global luxury brand new products, celebrity outfits, and trending items in seconds, using AI to analyze the hottest styling formulas and telling you 'what to wear tomorrow to go viral'.",
    descriptionZH: "你的时尚雷达，秒级追踪全球大牌新品、明星同款和网红爆款，用AI分析最火穿搭公式，提前告诉你'明天该穿什么会爆红'。\n1. 全球新品雷达系统（Global Product Tracker）\n- 多模态数据监测：通过AI抓取7种语言区（中英法意日韩西）的品牌官方Release\n- 动态热榜引擎：实时追踪50+时尚电商（Farfetch/Net-a-Porter等）新品销量TOP100\n2. 影响力图谱分析（Influence Mapping）\n- 明星热度量化引擎：构建艺人造型数据库（含单品种草转化率KPI）\n- KOL生态监控：跨境追踪Instagram/TikTok/小红书等平台5万+账号\n- 联名效应预测模型：基于品牌历史联名销量预测新款期待值\n3. 趋势演化系统（Trend Evolution System）\n- 秀场基因测序：运用GAN解析四大时装周设计元素沿袭度\n- 文化因子关联：构建影视作品/艺术展览等文化事件与单品热度相关性模型",
    descriptionKO: "당신의 패션 레이더로, AI를 사용하여 전 세계 럭셔리 브랜드 신제품, 셀러브리티 의상, 트렌드 아이템을 순식간에 추적하고 가장 핫한 스타일링 공식을 분석하여 '내일 무엇을 입으면 바이럴할지' 알려줍니다.\n1. 글로벌 제품 트래커\n- 7개 언어권의 멀티모달 데이터 모니터링\n- 50+ 패션 E커머스 플랫폼 실시간 추적\n2. 영향력 매핑\n- 셀러브리티 인기도 정량화 엔진\n- 플랫폼 간 KOL 생태계 모니터링\n- 콜라보레이션 효과 예측 모델\n3. 트렌드 진화 시스템\n- GAN을 활용한 패션위크 요소 분석\n- 문화 요인 상관관계 모델링",
    descriptionJA: "あなたのファッションレーダーとして、AIを使用して世界のラグジュアリーブランドの新製品、セレブの衣装、トレンドアイテムを瞬時に追跡し、最もホットなスタイリング公式を分析して'明日何を着ればバイラルになるか'をお知らせします。\n1. グローバル製品トラッカー\n- 7言語圏のマルチモーダルデータモニタリング\n- 50+ファッションEコマースプラットフォームのリアルタイム追跡\n2. インフルエンスマッピング\n- セレブリティ人気度定量化エンジン\n- プラットフォーム間KOLエコシステムモニタリング\n- コラボレーション効果予測モデル\n3. トレンド進化システム\n- GANを活用したファッションウィーク要素分析\n- 文化要因相関モデリング",
    createdAt: "1 month ago",
    creatorAddress: "0x12N5N...O574l4",
    totalSupply: 5000000000,
    useCases: [
      "What should I wear tomorrow",
      "Find similar celebrity outfits",
      "Track fashion week trends",
      "Get personalized style recommendations"
    ],
    useCasesJA: [
      "明日の着こなしアドバイス",
      "似たようなセレブの衣装を探す",
      "ファッションウィークのトレンドを追跡",
      "パーソナライズされたスタイル推薦を取得"
    ],
    useCasesKO: [
      "내일 뭘 입어야 할까",
      "비슷한 셀럽 의상 찾기",
      "패션위크 트렌드 추적",
      "개인화된 스타일 추천 받기"
    ],
    useCasesZH: [
      "明天该穿什么",
      "找到相似的明星穿搭",
      "追踪时装周趋势",
      "获取个性化风格推荐"
    ],
    socialLinks: "",
    chatEntry: null,
    iaoTokenAmount: 5000000000
  },
];