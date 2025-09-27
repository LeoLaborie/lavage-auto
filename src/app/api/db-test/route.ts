import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Starting database test...')
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Database query result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}