import { NextResponse } from 'next/server';
export async function POST(request) {  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {    return NextResponse.json(      { error: 'ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables.' },      { status: 500 }    );  }
  try {    const body = await request.json();
    const response = await fetch('https://api.anthropic.com/v1/messages', {      method: 'POST',      headers: {        'Content-Type': 'application/json',        'x-api-key': apiKey,        'anthropic-version': '2023-06-01',      },      body: JSON.stringify(body),    });
    const data = await response.json();    return NextResponse.json(data);  } catch (err) {    return NextResponse.json(      { error: 'Request to Anthropic failed', detail: err.message },      { status: 500 }    );  }}
