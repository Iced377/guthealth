import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const response = new NextResponse(JSON.stringify({ status: 'success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

    // Clear session cookie
    response.cookies.set('__session', '', {
        maxAge: 0,
        path: '/',
    });

    return response;
}
