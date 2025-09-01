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
        
        // 如果project为chat的记录不存在，则插入新记录
        if (countResult.rows.length === 0) {
            await client.query(
                `INSERT INTO "Count" (project, "count") VALUES ('chat', 1037)`
            );
            return {
                count: "1037",  // 返回新插入的值
                userNumber: userNumberResult.rows[0]?.count?.toString() || "0",
                timestamp: Date.now()
            };
        }
        
        return {
            count: countResult.rows[0]?.count?.toString() || "0",
            userNumber: userNumberResult.rows[0]?.count?.toString() || "0",
            timestamp: Date.now()
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