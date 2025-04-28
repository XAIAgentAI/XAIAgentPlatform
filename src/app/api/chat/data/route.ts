import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.CHAT_URL;
const pool = new Pool({ connectionString });

// 定义缓存时间（秒）
const MAX_CACHE_AGE = 15;

async function getData() {
    const client = await pool.connect();
    try {
        // 使用Promise.all并行查询提高效率
        const [countResult, userNumberResult] = await Promise.all([
            client.query(`SELECT "count" FROM "Count" WHERE project = 'chat'`),
            client.query(`SELECT COUNT(*) FROM "chat"`)
        ]);
        
        return {
            count: countResult.rows[0]?.count?.toString() || "0",
            userNumber: userNumberResult.rows[0]?.count?.toString() || "0",
            timestamp: Date.now()  // 添加时间戳用于调试
        };
    } finally {
        client.release();
    }
}

export async function GET(request: NextRequest) {
    const data = await getData();
    
    if (!data) {
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }

    return NextResponse.json(data, {
        headers: {
            // 精确控制缓存时间为15秒
            'Cache-Control': `public, max-age=${MAX_CACHE_AGE}, s-maxage=${MAX_CACHE_AGE}`,
            // 添加Vary头避免代理服务器缓存问题
            'Vary': 'Accept-Encoding'
        }
    });
}