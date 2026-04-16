import { NextResponse } from 'next/server';
export async function POST(request) {  const { email } = await request.json();
  if (!email || !email.includes('@')) {    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });  }
  const apiKey = process.env.BEEHIIV_API_KEY;  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !publicationId) {    return NextResponse.json({ success: true, warning: 'Beehiiv not configured' });  }
  try {    const res = await fetch(      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,      {        method: 'POST',        headers: {          'Content-Type': 'application/json',          Authorization: `Bearer ${apiKey}`,        },        body: JSON.stringify({          email,          reactivate_existing: true,          send_welcome_email: false,        }),      }    );
    const data = await res.json();    return NextResponse.json({ success: true, data });  } catch (err) {    return NextResponse.json({ success: true, warning: err.message });  }}
