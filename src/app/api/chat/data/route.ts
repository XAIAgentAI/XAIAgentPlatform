import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.CHAT_URL;
const pool = new Pool({ connectionString });

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

export async function POST(request: NextRequest) {
    const data = await getData();
    
    if (!data) {
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }

    return NextResponse.json(data, {
        headers: {
            // 明确设置不缓存
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            // 添加Vary头避免代理服务器缓存问题
            'Vary': '*'
        }
    });
}