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
    const formData = await request.json();
    if(!formData.name) {
        return NextResponse.json({success: false, message:"Name is required"},{ status: 400 })
    }

    const queryString = `
        INSERT INTO "Agents" (
          name,
          description,
          status,
          "iaoTokenAmount",
          category,
          avatar,
          "creatorId",
          "createdAt",
          "updatedAt",
          type,
          chat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
    `;

    const values = [
        formData.name,
        formData.description || "An AI Agent",
        "TBA",
        formData.tokenSupply,
        "AI Agent",
        formData.imageUrl || "",
        "041269d6-dfa6-4197-98c0-0a66c01cc66e",
        new Date(),
        new Date(),
        "AI Agent",
        {userFirst:formData.userFirst,agentFirst:formData.agentFirst,userSecond:formData.userSecond,agentSecond:formData.agentSecond,userThird:formData.userThird,agentThird:formData.agentThird}
    ]
     
    try {
      const response = await pool.query(queryString,values);
      return NextResponse.json({ success:true, agentId: response.rows[0].id})
    } catch(error){
        console.error("Error Creating Agent:", error);
        return NextResponse.json({success:"false", message: "Internal server error"},{ status: 500 })
    }
}