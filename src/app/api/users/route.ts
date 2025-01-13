import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { userSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const body = userSchema.parse(json)

    const user = await prisma.user.create({
      data: body,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('Error creating user:', err)
    if (err instanceof Error && 'code' in err && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error('Error fetching users:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
