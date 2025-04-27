import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.CHAT_URL;
const pool = new Pool({ connectionString });

async function getData() {
    try {
        // 查询 Count 表中 project 为 'chat' 的记录
        const countResult = await pool.query(`SELECT "count" FROM "Count" WHERE project = 'chat'`);
        let count = "0";
        if (countResult.rows.length > 0) {
            // 假设 count 字段存在于结果中
            count = String(countResult.rows[0].count);
        }

        // 查询 chat 表的总行数
        const userNumberResult = await pool.query(`SELECT COUNT(*) FROM "chat"`);
        const userNumber = String(userNumberResult.rows[0].count);

        return { count, userNumber };
    } catch (err) {
        console.log("error: ", err);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const data = await getData();
    if (data) {
        return NextResponse.json(data);
    } else {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}    