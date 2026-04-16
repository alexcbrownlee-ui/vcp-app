'use client';

import { useState, useRef, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    label: 'Your Client',
    prompt: "Who do you help, and what's the exact thing they're tired of?",
    hint: "Be specific. Not 'want to lose weight' — what's the frustration they feel every day?",
    placeholder: "e.g. Busy moms in their 40s who've tried every diet but keep gaining it back and feel like they've run out of options...",
  },
  {
    id: 2,
    label: 'Your Story',
    prompt: 'What were you personally struggling with before you figured this out?',
    hint: 'The messy, honest version. What did you try that didn\'t work? What shifted?',
    placeholder: "e.g. I was going to the gym 5 days a week, eating chicken and rice, and still couldn't lose the last 20 pounds...",
  },
  {
    id: 3,
    label: 'Your Method',
    prompt: 'What do most coaches get wrong — and what do you do differently?',
    hint: 'Name the broken approach first. Then your fix. One clear contrast.',
    placeholder: 'e.g. Most coaches hand you a meal plan and expect perfect compliance. Real life doesn\'t work that way...',
  },
  {
    id: 4,
    label: 'Client Win',
    prompt: 'Tell me about a specific client — who were they and what changed for them?',
    hint: 'Real or composite. Their before state, the moment things shifted, the result.',
    placeholder: "e.g. Sarah came to me after having her second kid. She hadn't felt like herself in two years...",
  },
];

const VOICE_SCRIPT_PROMPT = `You are a voice coach and copywriter who helps fitness coaches sound natural on recordings.

You've been given 4 written answers from a fitness coach. Your job is to turn these into a single 60-second speaking script (~160 words) they can read out loud before recording.

RULES:
- Write it in THEIR voice — use their exact words and phrases where possible
- It should flow naturally when spoken, not read like an essay
- Structure: Who you help → Your story → Your method → A client win → Who this is for
- Add natural spoken transitions ("Here's the thing...", "And what I found was...", "So if you're...")
- Do NOT polish or professionalize their language — keep their informal phrases
- End with a direct address to the person reading their emails

Output ONLY the script text, nothing else. No labels, no explanation, no quotes around it.`;

const EMAIL_GEN_PROMPT = `You are an elite email copywriter specializing in fitness coaches.

You have two inputs:
1. WRITTEN ANSWERS — the content: who they help, their story, their method, their proof
2. VOICE TRANSCRIPT — the tone: their natural rhythm, pacing, verbal tics, and how they actually speak

Your job: generate a 7-email welcome sequence using the CONTENT from the written answers and the VOICE FINGERPRINT from the transcript.

STEP 1 — EXTRACT VOICE FINGERPRINT FROM TRANSCRIPT:
- Sentence length patterns (short bursts? long flowing?)
- Repeated words or filler phrases (these are their signature — keep them)
- Energy level: calm/measured, fired up, warm/empathetic, tough love
- How they start sentences naturally
- Any unique expressions or turns of phrase

STEP 2 — GENERATE 7 EMAILS:

Email 1 WELCOME + ORIGIN → Their personal story (Written Answer 2). Hook on the before state. End on why they now coach.
Email 2 AGITATE THE PAIN → Client frustration (Written Answer 1). Name their exact struggle with precision. No solutions yet. Pure empathy and recognition.
Email 3 THE METHOD → Their approach (Written Answer 3). The broken way vs their way. Name their framework if they have one.
Email 4 TRANSFORMATION PROOF → Client win (Written Answer 4). Full arc: before → the struggle → the shift → the result.
Email 5 QUICK WIN → One actionable insight from their method. Teaches something real. Builds authority without selling.
Email 6 OBJECTION CRUSHER → The #1 reason their ideal client doesn't take action. Reframe it completely using their method.
Email 7 THE INVITATION → Soft intro to working together. An invitation, never a pitch. Mirrors the avatar from Answer 1.

RULES FOR EVERY EMAIL:
- Mirror their sentence rhythm from the transcript exactly
- 180-280 words per email
- Subject lines feel like a text from a friend
- Never use generic fitness phrases unless they used them first
- Preserve their verbal tics and natural phrases throughout

OUTPUT — valid JSON only, no markdown, no preamble:
{
  "voiceProfile": {
    "rhythm": "description",
    "energy": "description",
    "tone": "description",
    "keyPhrases": ["phrase1", "phrase2", "phrase3", "phrase4"],
    "transformationPromise": "the core before to after promise",
    "avatar": "specific description of their ideal client"
  },
  "emails": [
    { "number": 1, "label": "Welcome + Origin", "subject": "...", "body": "...", "sendDay": "Day 1" },
    { "number": 2, "label": "Agitate the Pain", "subject": "...", "body": "...", "sendDay": "Day 2" },
    { "number": 3, "label": "The Method", "subject": "...", "body": "...", "sendDay": "Day 4" },
    { "number": 4, "label": "Transformation Proof", "subject": "...", "body": "...", "sendDay": "Day 6" },
    { "number": 5, "label": "Quick Win", "subject": "...", "body": "...", "sendDay": "Day 8" },
    { "number": 6, "label": "Objection Crusher", "subject": "...", "body": "...", "sendDay": "Day 10" },
    { "number": 7, "label": "The Invitation", "subject": "...", "body": "...", "sendDay": "Day 12" }
  ]
}`;

const wc = (t) => t.trim().split(/\s+/).filter(Boolean).length;
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function downloadCoachKit(answers, voiceScript, voiceTranscript, voiceProfile, emails) {
  const lines = [
    '═══════════════════════════════════════════════',
    '  VOICE CAMPAIGN KIT — Generated by VCP',
    '═══════════════════════════════════════════════',
    '',
    'VOICE PROFILE',
    '─────────────',
    `Promise:     ${voiceProfile.transformationPromise}`,
    `Tone:        ${voiceProfile.tone}`,
    `Energy:      ${voiceProfile.energy}`,
    `Rhythm:      ${voiceProfile.rhythm}`,
    `Avatar:      ${voiceProfile.avatar}`,
    `Key Phrases: ${voiceProfile.keyPhrases?.join(' · ')}`,
    '',
    '═══════════════════════════════════════════════',
    '  WRITTEN ANSWERS (Content Layer)',
    '═══════════════════════════════════════════════',
    '',
    ...QUESTIONS.flatMap((q, i) => [`Q${i + 1} — ${q.label}`, `"${answers[i]}"`, '']),
    '═══════════════════════════════════════════════',
    '  VOICE SCRIPT (Generated)',
    '═══════════════════════════════════════════════',
    '',
    voiceScript,
    '',
    '═══════════════════════════════════════════════',
    '  VOICE TRANSCRIPT (Recorded)',
    '═══════════════════════════════════════════════',
    '',
    voiceTranscript || '(no recording)',
    '',
    '═══════════════════════════════════════════════',
    '  7-EMAIL WELCOME SEQUENCE',
    '═══════════════════════════════════════════════',
    '',
    ...emails.flatMap((e) => [
      `${e.sendDay} — Email ${e.number}: ${e.label}`,
      `Subject: ${e.subject}`,
      '',
      e.body,
      '',
      '───────────────────────────────────────────────',
      '',
    ]),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voice-campaign-kit.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PROXY CALL ───────────────────────────────────────────────
async function callClaude(system, userContent, maxTokens = 1000) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.content.map((b) => b.text || '').join('');
}

export default function VCP() {
  const [step, setStep] = useState('gate');
  const [gateEmail, setGateEmail] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [voiceScript, setVoiceScript] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [emails, setEmails] = useState([]);
  const [activeEmail, setActiveEmail] = useState(0);
  const [processingLabel, setProcessingLabel] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [stageNum, setStageNum] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalRef = useRef('');

  useEffect(() => {
    setSpeechSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    finalRef.current = '';
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setVoiceTranscript(finalRef.current + interim);
    };
    r.onerror = () => { setIsRecording(false); clearInterval(timerRef.current); };
    r.start();
    recognitionRef.current = r;
    setIsRecording(true);
    setRecordingTime(0);
    setVoiceTranscript('');
    finalRef.current = '';
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const stopRec = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    clearInterval(timerRef.current);
    setIsRecording(false);
    setHasRecorded(true);
  };

  const submitEmail = async () => {
    if (!gateEmail.includes('@') || !gateEmail.includes('.')) {
      setGateError('Please enter a valid email address.');
      return;
    }
    setGateLoading(true);
    setGateError('');
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gateEmail }),
      });
    } catch {
      // Fail silently — never block the user
    }
    setGateLoading(false);
    setStep('intro');
  };

  const buildVoiceScript = async () => {
    setStep('building_prompt');
    setErrorMsg('');
    const stages = ['Reading your answers...', 'Building your voice script...', 'Shaping it to sound like you...'];
    let si = 0;
    setProcessingLabel(stages[0]);
    const t = setInterval(() => { si = Math.min(si + 1, stages.length - 1); setProcessingLabel(stages[si]); }, 2000);
    try {
      const content = QUESTIONS.map((q, i) => `${q.label}: ${answers[i]}`).join('\n\n');
      const script = await callClaude(VOICE_SCRIPT_PROMPT, content, 600);
      clearInterval(t);
      setVoiceScript(script.trim());
      setStageNum(2);
      setStep('voice_prompt');
    } catch (err) {
      clearInterval(t);
      setErrorMsg(err.message || 'Something went wrong. Check your API key in Vercel.');
      setStep('questions');
    }
  };

  const buildEmails = async () => {
    setStep('building_emails');
    setErrorMsg('');
    const stages = [
      'Analyzing your voice patterns...',
      'Mapping content to voice...',
      'Writing Welcome + Origin...',
      'Writing Pain + Method emails...',
      'Writing Proof + Quick Win...',
      'Writing Objection Crusher + Invitation...',
      'Finalizing your sequence...',
    ];
    let si = 0;
    setProcessingLabel(stages[0]);
    const t = setInterval(() => { si = Math.min(si + 1, stages.length - 1); setProcessingLabel(stages[si]); }, 2500);
    try {
      const content = [
        'WRITTEN ANSWERS:',
        ...QUESTIONS.map((q, i) => `${q.label}: ${answers[i]}`),
        '',
        'VOICE TRANSCRIPT:',
        voiceTranscript || '(no voice recording — use written answers for tone)',
      ].join('\n');
      const raw = await callClaude(EMAIL_GEN_PROMPT, content, 7000);
      clearInterval(t);
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setVoiceProfile(parsed.voiceProfile);
      setEmails(parsed.emails);
      setStep('result');
    } catch (err) {
      clearInterval(t);
      setErrorMsg(err.message || 'Something went wrong generating emails.');
      setStep('voice_prompt');
    }
  };

  const copyEmail = (idx) => {
    const e = emails[idx];
    navigator.clipboard.writeText(`Subject: ${e.subject}\n\n${e.body}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const reset = () => {
    setStep('intro'); setCurrentQ(0); setAnswers(['', '', '', '']);
    setVoiceScript(''); setVoiceTranscript(''); setVoiceProfile(null);
    setEmails([]); setActiveEmail(0); setHasRecorded(false);
    setRecordingTime(0); setStageNum(1); setErrorMsg('');
  };

  const allAnswered = answers.every((a) => a.trim().length > 20);

  return (
    <div style={{ minHeight: '100vh', background: '#07070a', color: '#eceae4', fontFamily: 'Georgia, serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0d0d12; }
        ::-webkit-scrollbar-thumb { background: #1e1e28; }
        .btn-gold { background:#c9a84c;color:#07070a;border:none;padding:16px 36px;font-family:'Bebas Neue';font-size:18px;letter-spacing:3px;cursor:pointer;transition:all 0.2s;clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%); }
        .btn-gold:hover { background:#dbb85c;transform:translateY(-1px); }
        .btn-gold:disabled { background:#1a1a22;color:#2e2e3a;cursor:not-allowed;transform:none; }
        .btn-ghost { background:transparent;color:#555;border:1px solid #1c1c26;padding:11px 22px;font-family:'DM Sans';font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all 0.2s; }
        .btn-ghost:hover { border-color:#3a3a4a;color:#888; }
        .btn-rec { width:96px;height:96px;border-radius:50%;border:1.5px solid #c9a84c;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s;position:relative; }
        .btn-rec:hover { background:rgba(201,168,76,0.05); }
        .btn-rec.on { border-color:#e05555;background:rgba(224,85,85,0.07);animation:breathe 2s ease-in-out infinite; }
        .btn-rec.on::before { content:'';position:absolute;width:124px;height:124px;border-radius:50%;border:1px solid rgba(224,85,85,0.2);animation:ripple 2s infinite; }
        .btn-rec.on::after { content:'';position:absolute;width:152px;height:152px;border-radius:50%;border:1px solid rgba(224,85,85,0.08);animation:ripple 2s 0.6s infinite; }
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        @keyframes ripple{0%{transform:scale(0.85);opacity:1}100%{transform:scale(1.4);opacity:0}}
        .scan { height:1px;background:#111118;position:relative;overflow:hidden; }
        .scan::after { content:'';position:absolute;height:100%;width:35%;background:linear-gradient(90deg,transparent,#c9a84c,transparent);animation:sweep 2s ease-in-out infinite; }
        @keyframes sweep{0%{left:-35%}100%{left:135%}}
        .qa { width:100%;background:#0c0c12;border:1px solid #18181f;color:#b0adb8;padding:18px 22px;font-family:'DM Sans';font-size:15px;line-height:1.85;resize:none;outline:none;transition:border 0.2s; }
        .qa:focus { border-color:#2a2a38; }
        .qa::placeholder { color:#242432;font-style:italic; }
        .email-tab { padding:15px 26px;border-bottom:1px solid #0e0e14;cursor:pointer;transition:all 0.15s;display:flex;gap:14px;align-items:flex-start; }
        .email-tab:hover { background:rgba(201,168,76,0.03); }
        .email-tab.on { border-left:2px solid #c9a84c;background:rgba(201,168,76,0.03); }
        .chip { display:inline-block;background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.15);color:#8a743a;padding:3px 10px;font-family:'DM Sans';font-size:11px;margin:3px;letter-spacing:1px; }
        .stage-dot { width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:13px;letter-spacing:1px;transition:all 0.3s; }
        .fade { animation:fi 0.4s ease; }
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .error-box { background:rgba(224,85,85,0.05);border:1px solid rgba(224,85,85,0.2);padding:12px 16px;font-family:'DM Sans';font-size:13px;color:#e05555;margin-top:12px;line-height:1.5; }
        .gate-input { width:100%;background:#0c0c14;border:1px solid #1c1c28;color:#eceae4;padding:16px 20px;font-family:'DM Sans';font-size:16px;outline:none;transition:border 0.2s;text-align:center; }
        .gate-input:focus { border-color:#c9a84c; }
        .gate-input::placeholder { color:#2e2e3e; }
      `}</style>

      {/* GATE */}
      {step === 'gate' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }} className="fade">
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: '22px', letterSpacing: '6px', color: '#c9a84c', marginBottom: '48px' }}>VCP</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 'clamp(36px,6vw,60px)', fontWeight: 300, lineHeight: '1.1', marginBottom: '16px', maxWidth: '560px' }}>
            Get your 7-email welcome<br />sequence. <em style={{ color: '#c9a84c' }}>Free.</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: '15px', color: '#4a4a5a', lineHeight: '1.7', marginBottom: '40px', maxWidth: '380px' }}>
            Built in your voice. Ready to load into your email platform. Takes one session.
          </p>
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              className="gate-input"
              type="email"
              placeholder="your@email.com"
              value={gateEmail}
              onChange={(e) => { setGateEmail(e.target.value); setGateError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
            />
            {gateError && (
              <p style={{ fontFamily: "'DM Sans'", fontSize: '12px', color: '#e05555' }}>{gateError}</p>
            )}
            <button className="btn-gold" onClick={submitEmail} disabled={gateLoading} style={{ width: '100%', textAlign: 'center' }}>
              {gateLoading ? 'One moment...' : 'Get My Free Sequence →'}
            </button>
          </div>
          <p style={{ fontFamily: "'DM Sans'", fontSize: '11px', color: '#2a2a38', marginTop: '16px', letterSpacing: '1px' }}>
            No spam. Unsubscribe anytime.
          </p>
        </div>
      )}

      {/* HEADER — hidden on gate screen */}
      {step !== 'gate' && (
      <div style={{ borderBottom: '1px solid #0f0f16', padding: '17px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: '20px', letterSpacing: '6px', color: '#c9a84c' }}>VCP</span>
          <span style={{ width: '1px', height: '16px', background: '#1a1a24' }} />
          <span style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#2e2e3e', letterSpacing: '3px', textTransform: 'uppercase' }}>Voice to Campaign Pipeline</span>
        </div>
        {['questions', 'building_prompt', 'voice_prompt', 'building_emails'].includes(step) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[{ n: 1, label: 'Write' }, { n: 2, label: 'Script' }, { n: 3, label: 'Record' }, { n: 4, label: 'Generate' }].map((s, i) => {
              const active = stageNum === s.n, done = stageNum > s.n;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="stage-dot" style={{ background: done ? '#c9a84c' : active ? 'rgba(201,168,76,0.15)' : 'transparent', border: done ? 'none' : `1px solid ${active ? '#c9a84c' : '#1e1e28'}`, color: done ? '#07070a' : active ? '#c9a84c' : '#2e2e3e', margin: '0 auto 2px' }}>
                      {done ? '✓' : s.n}
                    </div>
                    <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: active ? '#c9a84c' : '#2e2e3e', letterSpacing: '1px', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                  {i < 3 && <div style={{ width: '20px', height: '1px', background: done ? '#c9a84c' : '#1a1a24', marginBottom: '12px' }} />}
                </div>
              );
            })}
          </div>
        )}
        {step === 'result' && <button className="btn-ghost" onClick={reset}>← Start Over</button>}
      </div>
      )}

      {/* INTRO */}
      {step === 'intro' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '90px 32px', textAlign: 'center' }} className="fade">
          <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#3a3a4e', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '28px' }}>3 Stages · 4 Questions · 7 Emails</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 'clamp(42px,7vw,68px)', fontWeight: 300, lineHeight: '1.1', marginBottom: '24px' }}>
            Write it.<br /><em style={{ color: '#c9a84c' }}>Speak it.</em><br />Send it.
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: '15px', color: '#4a4a5a', lineHeight: '1.8', maxWidth: '420px', margin: '0 auto 40px' }}>
            Four written questions give the system your content. A custom voice script gives you something to record. Your recording captures your tone. The output sounds like you wrote every word.
          </p>
          <div style={{ display: 'flex', gap: '0', margin: '0 auto 48px', maxWidth: '480px', background: '#0c0c14', border: '1px solid #14141e' }}>
            {[{ n: '01', t: 'Write', d: '4 focused questions' }, { n: '02', t: 'Speak', d: 'Read your custom script' }, { n: '03', t: 'Get', d: '7 emails in your voice' }].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '20px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid #14141e' : 'none' }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: '28px', color: '#1e1e2a', letterSpacing: '2px', marginBottom: '4px' }}>{s.n}</div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '13px', color: '#7a7a8a', marginBottom: '3px' }}>{s.t}</div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '11px', color: '#2e2e3e' }}>{s.d}</div>
              </div>
            ))}
          </div>
          <button className="btn-gold" onClick={() => { setStep('questions'); setStageNum(1); }}>Begin →</button>
        </div>
      )}

      {/* QUESTIONS */}
      {step === 'questions' && (
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '52px 32px' }} className="fade">
          <div style={{ display: 'flex', gap: '6px', marginBottom: '40px' }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} onClick={() => setCurrentQ(i)} style={{ height: '3px', flex: 1, cursor: 'pointer', borderRadius: '2px', background: answers[i].trim().length > 20 ? '#c9a84c' : currentQ === i ? 'rgba(201,168,76,0.3)' : '#141420', transition: 'all 0.3s' }} />
            ))}
          </div>
          <div className="fade" key={currentQ}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontFamily: "'Bebas Neue'", fontSize: '56px', lineHeight: '1', color: '#181824', flexShrink: 0 }}>{String(currentQ + 1).padStart(2, '0')}</span>
                <div style={{ paddingTop: '6px' }}>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#3a3a4e', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>{QUESTIONS[currentQ].label}</div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 'clamp(22px,3.5vw,30px)', fontWeight: 400, lineHeight: '1.3', color: '#eceae4' }}>{QUESTIONS[currentQ].prompt}</h2>
                </div>
              </div>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '13px', color: '#3a3a4e', fontStyle: 'italic', lineHeight: '1.6', paddingLeft: '70px' }}>{QUESTIONS[currentQ].hint}</p>
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#2a2a38', letterSpacing: '2px', textTransform: 'uppercase' }}>Your answer</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#2a2a38' }}>{wc(answers[currentQ])} words</span>
            </div>
            <textarea className="qa" rows={7} value={answers[currentQ]} onChange={(e) => { const u = [...answers]; u[currentQ] = e.target.value; setAnswers(u); }} placeholder={QUESTIONS[currentQ].placeholder} />
            {errorMsg && <div className="error-box">{errorMsg}</div>}
            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-ghost" onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : setStep('intro')}>← Back</button>
              {currentQ < 3 ? (
                <button className="btn-gold" onClick={() => setCurrentQ(currentQ + 1)} disabled={answers[currentQ].trim().length < 20}>Question {currentQ + 2} →</button>
              ) : (
                <button className="btn-gold" onClick={buildVoiceScript} disabled={!allAnswered}>Build My Voice Script →</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUILDING PROMPT */}
      {step === 'building_prompt' && (
        <div style={{ maxWidth: '440px', margin: '0 auto', padding: '120px 32px', textAlign: 'center' }} className="fade">
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: '72px', color: '#c9a84c', opacity: 0.07, letterSpacing: '6px', marginBottom: '48px' }}>VCP</div>
          <div className="scan" style={{ marginBottom: '36px' }} />
          <p style={{ fontFamily: "'Cormorant Garamond'", fontStyle: 'italic', fontSize: '24px', color: '#555566', lineHeight: '1.5' }}>{processingLabel}</p>
        </div>
      )}

      {/* VOICE PROMPT */}
      {step === 'voice_prompt' && (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '52px 32px' }} className="fade">
          <div style={{ marginBottom: '36px' }}>
            <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#3a3a4e', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '12px' }}>Stage 2 → 3</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 'clamp(28px,5vw,44px)', fontWeight: 300, lineHeight: '1.2', marginBottom: '10px' }}>
              Your script is ready.<br /><em style={{ color: '#c9a84c' }}>Now read it out loud.</em>
            </h2>
            <p style={{ fontFamily: "'DM Sans'", fontSize: '14px', color: '#3a3a4e', lineHeight: '1.7' }}>This script is built from your answers — it's already your content. Read it naturally, riff on it, go off script. The recording captures how you actually speak.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#3a3a4e', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Your Script (~60 sec)</div>
              <div style={{ background: '#0c0c14', border: '1px solid #1c1c28', padding: '28px 32px', lineHeight: '2.1', fontFamily: "'Cormorant Garamond'", fontSize: '18px', color: '#9a97a8', fontStyle: 'italic' }}>
                {voiceScript}
              </div>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '11px', color: '#2a2a38', marginTop: '10px', fontStyle: 'italic' }}>Read it word for word or use it as a guide — both work.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#3a3a4e', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Record Your Voice</div>
              <div style={{ flex: 1, background: '#0c0c14', border: '1px solid #18181f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px 24px', minHeight: '200px' }}>
                {speechSupported ? (
                  <>
                    <button className={`btn-rec ${isRecording ? 'on' : ''}`} onClick={isRecording ? stopRec : startRec}>
                      {isRecording ? (
                        <svg width="20" height="20" fill="#e05555" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                      ) : (
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                          <rect x="9" y="2" width="6" height="11" rx="3"/>
                          <path d="M5 10a7 7 0 0014 0"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                          <line x1="9" y1="21" x2="15" y2="21"/>
                        </svg>
                      )}
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue'", fontSize: '30px', letterSpacing: '4px', color: isRecording ? '#e05555' : '#1e1e2a' }}>{fmt(recordingTime)}</div>
                      <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#2a2a38', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>
                        {isRecording ? 'Recording — tap to stop' : hasRecorded ? 'Tap to re-record' : 'Tap to start'}
                      </div>
                    </div>
                    {isRecording && <div className="scan" style={{ width: '160px' }} />}
                  </>
                ) : (
                  <p style={{ fontFamily: "'DM Sans'", fontSize: '13px', color: '#3a3a4e', textAlign: 'center', lineHeight: '1.6' }}>Voice recording not supported in this browser. Your written answers will be used for tone.</p>
                )}
              </div>
              {voiceTranscript && (
                <div style={{ marginTop: '12px', background: '#0a0a12', border: '1px solid #14141e', padding: '14px 16px' }}>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#2a2a38', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Transcript · {wc(voiceTranscript)} words</div>
                  <p style={{ fontFamily: "'DM Sans'", fontSize: '13px', color: '#555566', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{voiceTranscript}</p>
                </div>
              )}
            </div>
          </div>
          {errorMsg && <div className="error-box">{errorMsg}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #0f0f16' }}>
            <button className="btn-ghost" onClick={() => { setStep('questions'); setStageNum(1); }}>← Edit Answers</button>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {(hasRecorded || !speechSupported) ? (
                <button className="btn-gold" onClick={() => { setStageNum(4); buildEmails(); }}>Generate My Sequence →</button>
              ) : (
                <button className="btn-ghost" style={{ borderColor: '#2a2a38', color: '#4a4a5a' }} onClick={() => { setStageNum(4); buildEmails(); }}>Skip recording, use text only →</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BUILDING EMAILS */}
      {step === 'building_emails' && (
        <div style={{ maxWidth: '440px', margin: '0 auto', padding: '120px 32px', textAlign: 'center' }} className="fade">
          <div style={{ fontFamily: "'Cormorant Garamond'", fontSize: '72px', color: '#c9a84c', opacity: 0.07, letterSpacing: '6px', marginBottom: '48px' }}>VCP</div>
          <div className="scan" style={{ marginBottom: '36px' }} />
          <p style={{ fontFamily: "'Cormorant Garamond'", fontStyle: 'italic', fontSize: '24px', color: '#555566', lineHeight: '1.5' }}>{processingLabel}</p>
          <p style={{ fontFamily: "'DM Sans'", fontSize: '11px', color: '#1e1e28', marginTop: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>15–30 seconds</p>
        </div>
      )}

      {/* RESULT */}
      {step === 'result' && voiceProfile && emails.length > 0 && (
        <div style={{ display: 'flex', height: 'calc(100vh - 61px)' }} className="fade">
          <div style={{ width: '288px', flexShrink: 0, borderRight: '1px solid #0e0e16', overflowY: 'auto' }}>
            <div style={{ padding: '22px', borderBottom: '1px solid #0e0e16' }}>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: '#2a2a38', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '14px' }}>Voice Profile</div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: '#282834', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Core Promise</div>
                <p style={{ fontFamily: "'Cormorant Garamond'", fontStyle: 'italic', fontSize: '15px', color: '#c9a84c', lineHeight: '1.4' }}>{voiceProfile.transformationPromise}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: '#282834', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Tone</div>
                <p style={{ fontFamily: "'DM Sans'", fontSize: '12px', color: '#555566', lineHeight: '1.5' }}>{voiceProfile.tone}</p>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: '#282834', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Avatar</div>
                <p style={{ fontFamily: "'DM Sans'", fontSize: '12px', color: '#555566', lineHeight: '1.5' }}>{voiceProfile.avatar}</p>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: '#282834', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Your Phrases</div>
                {voiceProfile.keyPhrases?.map((p, i) => <span key={i} className="chip">{p}</span>)}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: '#2a2a38', letterSpacing: '3px', textTransform: 'uppercase', padding: '16px 26px 8px' }}>Sequence</div>
              {emails.map((e, i) => (
                <div key={i} className={`email-tab ${activeEmail === i ? 'on' : ''}`} onClick={() => setActiveEmail(i)}>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: '22px', color: activeEmail === i ? '#c9a84c' : '#1a1a26', flexShrink: 0, lineHeight: '1.2' }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: '12px', color: activeEmail === i ? '#eceae4' : '#4a4a5a', marginBottom: '2px' }}>{e.label}</p>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#242434' }}>{e.sendDay}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '20px 22px', borderTop: '1px solid #0e0e16' }}>
              <button className="btn-gold" style={{ width: '100%', textAlign: 'center', fontSize: '14px', padding: '13px' }} onClick={() => downloadCoachKit(answers, voiceScript, voiceTranscript, voiceProfile, emails)}>
                ↓ Download Coach Kit
              </button>
              <p style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#242434', marginTop: '8px', textAlign: 'center', lineHeight: '1.5' }}>All emails + voice profile + transcripts for future tools</p>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '44px 52px', maxWidth: '800px' }}>
            {emails[activeEmail] && (
              <div className="fade" key={activeEmail}>
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans'", fontSize: '10px', color: '#2e2e3e', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>{emails[activeEmail].sendDay} · {activeEmail + 1} of {emails.length}</div>
                    <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: '38px', fontWeight: 300, color: '#eceae4', lineHeight: '1.2' }}>{emails[activeEmail].label}</h2>
                  </div>
                  <button className="btn-ghost" onClick={() => copyEmail(activeEmail)} style={{ marginTop: '8px' }}>{copiedIdx === activeEmail ? '✓ Copied' : 'Copy'}</button>
                </div>
                <div style={{ background: '#0c0c14', border: '1px solid #14141e', padding: '18px 24px', marginBottom: '28px' }}>
                  <div style={{ fontFamily: "'DM Sans'", fontSize: '9px', color: '#2a2a38', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '6px' }}>Subject Line</div>
                  <p style={{ fontFamily: "'Cormorant Garamond'", fontSize: '22px', color: '#eceae4', fontWeight: 400 }}>{emails[activeEmail].subject}</p>
                </div>
                <div style={{ height: '1px', background: '#0f0f16', marginBottom: '28px' }} />
                <p style={{ fontFamily: "'DM Sans'", fontSize: '15px', lineHeight: '2.1', color: '#8a8898', whiteSpace: 'pre-wrap' }}>{emails[activeEmail].body}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '52px', paddingTop: '28px', borderTop: '1px solid #0f0f16' }}>
                  {activeEmail > 0 && <button className="btn-ghost" onClick={() => setActiveEmail(activeEmail - 1)}>← Prev</button>}
                  {activeEmail < emails.length - 1 ? (
                    <button className="btn-gold" style={{ fontSize: '16px', padding: '13px 28px' }} onClick={() => setActiveEmail(activeEmail + 1)}>Next Email →</button>
                  ) : (
                    <span style={{ fontFamily: "'Cormorant Garamond'", fontStyle: 'italic', fontSize: '22px', color: '#c9a84c', display: 'flex', alignItems: 'center' }}>Sequence complete.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
