"use server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Pool } from "@neondatabase/serverless"

const connectionString = process.env.CHAT_URL;
const pool = new Pool({ connectionString })

async function getUserRecord(name:string){
    const queryString = `
        SELECT * FROM "Create" WHERE name = $1
    `;
    const values = [name]
    const response = await pool.query(queryString,values);
    if(response.rows.length > 0){
        return response.rows[0];
    } else {
        console.log("No user");
        return null;
    }
}

export async function GET( request: NextRequest ){
    const user = request.nextUrl.searchParams.get("user");
    if(!user){
        return NextResponse.json([]);
    }
    const userAgents = await getUserRecord(user);
    return NextResponse.json(userAgents);
}

export async function POST( request : NextRequest ){
    const {name,creatorId,description} = await request.json();
}