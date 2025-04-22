"use server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Pool } from "@neondatabase/serverless"

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString })

export async function POST( request : NextRequest ){
    const {name,creatorId,description} = await request.json();
}