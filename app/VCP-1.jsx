'use client';
import { useState, useRef, useEffect } from 'react';

const Q = [
  { id:1, label:'Your Client', prompt:"Who do you help, and what's the exact thing they're tired of?", hint:"Be specific — what frustration do they feel every day?", ph:"e.g. Busy moms in their 40s who've tried every diet but keep gaining it back..." },
  { id:2, label:'Your Story', prompt:'What were you personally struggling with before you figured this out?', hint:"The messy honest version. What didn't work? What shifted?", ph:"e.g. I was going to the gym 5 days a week and still couldn't lose the last 20 pounds..." },
  { id:3, label:'Your Method', prompt:'What do most coaches get wrong — and what do you do differently?', hint:'Name the broken approach first. Then your fix.', ph:"e.g. Most coaches hand you a meal plan and expect perfect compliance..." },
  { id:4, label:'Client Win', prompt:'Tell me about a specific client — who were they and what changed for them?', hint:'Before state, the shift, the result.', ph:"e.g. Sarah came to me after having her second kid. She hadn't felt like herself in two years..." },
];

const SCRIPT_SYS = 'You are a voice coach helping fitness coaches sound natural on recordings. Turn these 4 written answers into a single 60-second speaking script (~160 words) the coach reads before recording. Write in THEIR voice using their exact words. Flow naturally when spoken. Structure: who you help, your story, your method, a client win, who this is for. Add spoken transitions. Do NOT polish their language. End with a direct address to the email reader. Output ONLY the script, no labels or explanation.';

const EMAIL_SYS = 'You are an elite email copywriter for fitness coaches. You have two inputs: WRITTEN ANSWERS (content) and VOICE TRANSCRIPT (tone). Extract voice fingerprint from transcript: sentence rhythm, repeated phrases, energy level, natural sentence starters. Then generate 7 emails: 1-WELCOME+ORIGIN from Answer 2. 2-AGITATE PAIN from Answer 1. 3-THE METHOD from Answer 3. 4-TRANSFORMATION PROOF from Answer 4. 5-QUICK WIN. 6-OBJECTION CRUSHER. 7-THE INVITATION. Rules: mirror transcript rhythm, 180-280 words each, subject lines like a text from a friend. Output valid JSON only: {"voiceProfile":{"rhythm":"","energy":"","tone":"","keyPhrases":[],"transformationPromise":"","avatar":""},"emails":[{"number":1,"label":"Welcome + Origin","subject":"","body":"","sendDay":"Day 1"},{"number":2,"label":"Agitate the Pain","subject":"","body":"","sendDay":"Day 2"},{"number":3,"label":"The Method","subject":"","body":"","sendDay":"Day 4"},{"number":4,"label":"Transformation Proof","subject":"","body":"","sendDay":"Day 6"},{"number":5,"label":"Quick Win","subject":"","body":"","sendDay":"Day 8"},{"number":6,"label":"Objection Crusher","subject":"","body":"","sendDay":"Day 10"},{"number":7,"label":"The Invitation","subject":"","body":"","sendDay":"Day 12"}]}';

const wc = t => t.trim().split(/\s+/).filter(Boolean).length;
const ft = s => Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60;

function dl(answers, script, transcript, vp, emails) {
  const txt = ['VOICE CAMPAIGN KIT','','PROMISE: '+vp.transformationPromise,'TONE: '+vp.tone,'AVATAR: '+vp.avatar,'','ANSWERS',...Q.map((q,i)=>q.label+': '+answers[i]),'','VOICE SCRIPT',script,'','VOICE TRANSCRIPT',transcript||'(none)','','EMAILS',...emails.flatMap(e=>[e.sendDay+' - '+e.label,'Subject: '+e.subject,'',e.body,'---',''])].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
  a.download = 'voice-campaign-kit.txt';
  a.click();
}

async function callClaude(system, content, tokens) {
  const r = await fetch('/api/claude', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:tokens,system,messages:[{role:'user',content}]})});
  const d = await r.json();
  if(d.error) throw new Error(d.error);
  return d.content.map(b=>b.text||'').join('');
}

export default function VCP() {
  const [step,setStep]=useState('gate');
  const [gEmail,setGEmail]=useState('');
  const [gLoad,setGLoad]=useState(false);
  const [gErr,setGErr]=useState('');
  const [qIdx,setQIdx]=useState(0);
  const [answers,setAnswers]=useState(['','','','']);
  const [script,setScript]=useState('');
  const [transcript,setTranscript]=useState('');
  const [recording,setRecording]=useState(false);
  const [recTime,setRecTime]=useState(0);
  const [hasRec,setHasRec]=useState(false);
  const [speechOk,setSpeechOk]=useState(false);
  const [vp,setVp]=useState(null);
  const [emails,setEmails]=useState([]);
  const [activeE,setActiveE]=useState(0);
  const [loading,setLoading]=useState('');
  const [copied,setCopied]=useState(null);
  const [stage,setStage]=useState(1);
  const [err,setErr]=useState('');
  const recRef=useRef(null);
  const timerRef=useRef(null);
  const finalRef=useRef('');

  useEffect(()=>{setSpeechOk(!!(window.SpeechRecognition||window.webkitSpeechRecognition));},[]);

  const startRec=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return;
    finalRef.current='';
    const r=new SR();
    r.continuous=true;r.interimResults=true;r.lang='en-US';
    r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)finalRef.current+=e.results[i][0].transcript+' ';else interim+=e.results[i][0].transcript;}setTranscript(finalRef.current+interim);};
    r.onerror=()=>{setRecording(false);clearInterval(timerRef.current);};
    r.start();recRef.current=r;setRecording(true);setRecTime(0);setTranscript('');finalRef.current='';
    timerRef.current=setInterval(()=>setRecTime(t=>t+1),1000);
  };

  const stopRec=()=>{if(recRef.current)recRef.current.stop();clearInterval(timerRef.current);setRecording(false);setHasRec(true);};

  const submitEmail=async()=>{
    if(!gEmail.includes('@')||!gEmail.includes('.')){setGErr('Enter a valid email.');return;}
    setGLoad(true);setGErr('');
    try{await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:gEmail})});}catch(e){}
    setGLoad(false);setStep('intro');
  };

  const buildScript=async()=>{
    setStep('loading');setErr('');
    const msgs=['Reading your answers...','Building your voice script...','Shaping it to sound like you...'];
    let i=0;setLoading(msgs[0]);
    const t=setInterval(()=>{i=Math.min(i+1,msgs.length-1);setLoading(msgs[i]);},2000);
    try{
      const content=Q.map((q,i)=>q.label+': '+answers[i]).join('\n\n');
      const s=await callClaude(SCRIPT_SYS,content,600);
      clearInterval(t);setScript(s.trim());setStage(2);setStep('voice');
    }catch(e){clearInterval(t);setErr(e.message||'Error');setStep('questions');}
  };

  const buildEmails=async()=>{
    setStep('loading');setErr('');
    const msgs=['Analyzing voice...','Mapping content...','Writing emails...','Finalizing...'];
    let i=0;setLoading(msgs[0]);
    const t=setInterval(()=>{i=Math.min(i+1,msgs.length-1);setLoading(msgs[i]);},2500);
    try{
      const content='WRITTEN ANSWERS:\n'+Q.map((q,i)=>q.label+': '+answers[i]).join('\n')+'\n\nVOICE TRANSCRIPT:\n'+(transcript||'use written answers for tone');
      const raw=await callClaude(EMAIL_SYS,content,7000);
      clearInterval(t);
      const parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());
      setVp(parsed.voiceProfile);setEmails(parsed.emails);setStep('result');
    }catch(e){clearInterval(t);setErr(e.message||'Error');setStep('voice');}
  };

  const copy=idx=>{const e=emails[idx];navigator.clipboard.writeText('Subject: '+e.subject+'\n\n'+e.body);setCopied(idx);setTimeout(()=>setCopied(null),2000);};

  const reset=()=>{setStep('gate');setGEmail('');setQIdx(0);setAnswers(['','','','']);setScript('');setTranscript('');setVp(null);setEmails([]);setActiveE(0);setHasRec(false);setRecTime(0);setStage(1);setErr('');};

  const allOk=answers.every(a=>a.trim().length>20);
  const gold='#c9a84c';
  const bg='#07070a';
  const dim='#1a1a24';

  const btn={background:gold,color:bg,border:'none',padding:'15px 32px',fontSize:'16px',fontWeight:700,cursor:'pointer',letterSpacing:'2px',textTransform:'uppercase'};
  const btnOff={...btn,background:'#1a1a22',color:'#333',cursor:'not-allowed'};
  const ghost={background:'transparent',color:'#555',border:'1px solid '+dim,padding:'10px 20px',fontSize:'11px',letterSpacing:'2px',textTransform:'uppercase',cursor:'pointer'};
  const input={width:'100%',background:'#0c0c14',border:'1px solid #1c1c28',color:'#eceae4',padding:'15px 18px',fontSize:'16px',outline:'none',textAlign:'center'};
  const qa={width:'100%',background:'#0c0c12',border:'1px solid #18181f',color:'#b0adb8',padding:'16px 20px',fontSize:'15px',lineHeight:1.85,resize:'none',outline:'none'};

  return (
    <div style={{minHeight:'100vh',background:bg,color:'#eceae4'}}>
      <style>{'.etab{padding:14px 24px;border-bottom:1px solid #0e0e14;cursor:pointer;display:flex;gap:12px;align-items:flex-start}.etab:hover{background:rgba(201,168,76,0.03)}.etab.on{border-left:2px solid #c9a84c;background:rgba(201,168,76,0.03)}.scan{height:1px;background:#111118;position:relative;overflow:hidden}.scan::after{content:"";position:absolute;height:100%;width:35%;background:linear-gradient(90deg,transparent,#c9a84c,transparent);animation:sw 2s ease-in-out infinite}@keyframes sw{0%{left:-35%}100%{left:135%}}'}</style>

      {step!=='gate'&&<div style={{borderBottom:'1px solid '+dim,padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'18px',letterSpacing:'6px',color:gold,fontWeight:900}}>VCP</span>
          <span style={{width:'1px',height:'16px',background:dim}}/>
          <span style={{fontSize:'10px',color:'#2e2e3e',letterSpacing:'3px',textTransform:'uppercase'}}>Voice to Campaign Pipeline</span>
        </div>
        {step==='result'&&<button style={ghost} onClick={reset}>← Start Over</button>}
        {['questions','voice','loading'].includes(step)&&(
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            {['Write','Script','Record','Generate'].map((s,i)=>{
              const done=stage>i+1,active=stage===i+1;
              return <div key={i} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:done?gold:active?'rgba(201,168,76,0.15)':'transparent',border:done?'none':'1px solid '+(active?gold:'#1e1e28'),color:done?bg:active?gold:'#2e2e3e',fontSize:'11px',fontWeight:700,margin:'0 auto 2px'}}>{done?'✓':i+1}</div>
                  <div style={{fontSize:'9px',color:active?gold:'#2e2e3e',letterSpacing:'1px',textTransform:'uppercase'}}>{s}</div>
                </div>
                {i<3&&<div style={{width:'16px',height:'1px',background:done?gold:dim,marginBottom:'12px'}}/>}
              </div>;
            })}
          </div>
        )}
      </div>}

      {step==='gate'&&<div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 28px',textAlign:'center'}}>
        <div style={{fontSize:'22px',letterSpacing:'6px',color:gold,fontWeight:900,marginBottom:'44px'}}>VCP</div>
        <h1 style={{fontSize:'clamp(36px,6vw,58px)',fontWeight:300,lineHeight:1.1,marginBottom:'16px'}}>Get your 7-email welcome<br/>sequence. <em style={{color:gold}}>Free.</em></h1>
        <p style={{fontSize:'15px',color:'#4a4a5a',lineHeight:1.8,marginBottom:'36px',maxWidth:'360px'}}>Built in your voice. Ready to load into your email platform. Takes one session.</p>
        <div style={{width:'100%',maxWidth:'380px',display:'flex',flexDirection:'column',gap:'10px'}}>
          <input style={input} type="email" placeholder="your@email.com" value={gEmail} onChange={e=>{setGEmail(e.target.value);setGErr('');}} onKeyDown={e=>e.key==='Enter'&&submitEmail()}/>
          {gErr&&<p style={{fontSize:'12px',color:'#e05555'}}>{gErr}</p>}
          <button style={gLoad?btnOff:btn} onClick={submitEmail} disabled={gLoad}>{gLoad?'One moment...':'Get My Free Sequence →'}</button>
        </div>
        <p style={{fontSize:'11px',color:'#2a2a38',marginTop:'14px'}}>No spam. Unsubscribe anytime.</p>
      </div>}

      {step==='intro'&&<div style={{maxWidth:'560px',margin:'0 auto',padding:'80px 28px',textAlign:'center'}}>
        <p style={{fontSize:'10px',color:'#3a3a4e',letterSpacing:'4px',textTransform:'uppercase',marginBottom:'22px'}}>3 Stages · 4 Questions · 7 Emails</p>
        <h1 style={{fontSize:'clamp(36px,6vw,58px)',fontWeight:300,lineHeight:1.1,marginBottom:'20px'}}>Write it.<br/><em style={{color:gold}}>Speak it.</em><br/>Send it.</h1>
        <p style={{fontSize:'15px',color:'#4a4a5a',lineHeight:1.8,marginBottom:'36px'}}>Four questions give the system your content. A custom script gives you something to record. Your recording gives us your tone. The output sounds like you wrote every word.</p>
        <div style={{display:'flex',background:'#0c0c14',border:'1px solid #14141e',marginBottom:'36px'}}>
          {[['01','Write','4 focused questions'],['02','Speak','Read your custom script'],['03','Get','7 emails in your voice']].map(([n,t,d],i)=>(
            <div key={i} style={{flex:1,padding:'18px 14px',textAlign:'center',borderRight:i<2?'1px solid #14141e':'none'}}>
              <div style={{fontSize:'26px',color:'#1e1e2a',fontWeight:900,marginBottom:'3px'}}>{n}</div>
              <div style={{fontSize:'13px',color:'#7a7a8a',marginBottom:'2px'}}>{t}</div>
              <div style={{fontSize:'11px',color:'#2e2e3e'}}>{d}</div>
            </div>
          ))}
        </div>
        <button style={btn} onClick={()=>{setStep('questions');setStage(1);}}>Begin →</button>
      </div>}

      {step==='questions'&&<div style={{maxWidth:'660px',margin:'0 auto',padding:'48px 28px'}}>
        <div style={{display:'flex',gap:'5px',marginBottom:'36px'}}>
          {Q.map((_,i)=><div key={i} onClick={()=>setQIdx(i)} style={{height:'3px',flex:1,cursor:'pointer',borderRadius:'2px',background:answers[i].trim().length>20?gold:qIdx===i?'rgba(201,168,76,0.3)':'#141420'}}/>)}
        </div>
        <div key={qIdx}>
          <div style={{marginBottom:'28px'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'14px'}}>
              <span style={{fontSize:'48px',lineHeight:1,color:'#181824',fontWeight:900,flexShrink:0}}>{String(qIdx+1).padStart(2,'0')}</span>
              <div style={{paddingTop:'4px'}}>
                <div style={{fontSize:'10px',color:'#3a3a4e',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'5px'}}>{Q[qIdx].label}</div>
                <h2 style={{fontSize:'clamp(20px,3vw,28px)',fontWeight:400,lineHeight:1.3}}>{Q[qIdx].prompt}</h2>
              </div>
            </div>
            <p style={{fontSize:'13px',color:'#3a3a4e',fontStyle:'italic',lineHeight:1.6,paddingLeft:'60px'}}>{Q[qIdx].hint}</p>
          </div>
          <div style={{marginBottom:'7px',display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:'10px',color:'#2a2a38',letterSpacing:'2px',textTransform:'uppercase'}}>Your answer</span>
            <span style={{fontSize:'10px',color:'#2a2a38'}}>{wc(answers[qIdx])} words</span>
          </div>
          <textarea style={qa} rows={6} value={answers[qIdx]} onChange={e=>{const u=[...answers];u[qIdx]=e.target.value;setAnswers(u);}} placeholder={Q[qIdx].ph}/>
          {err&&<p style={{fontSize:'12px',color:'#e05555',marginTop:'10px'}}>{err}</p>}
          <div style={{marginTop:'24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <button style={ghost} onClick={()=>qIdx>0?setQIdx(qIdx-1):setStep('intro')}>← Back</button>
            {qIdx<3
              ?<button style={answers[qIdx].trim().length<20?btnOff:btn} onClick={()=>setQIdx(qIdx+1)} disabled={answers[qIdx].trim().length<20}>Question {qIdx+2} →</button>
              :<button style={!allOk?btnOff:btn} onClick={buildScript} disabled={!allOk}>Build My Voice Script →</button>
            }
          </div>
        </div>
      </div>}

      {step==='loading'&&<div style={{maxWidth:'420px',margin:'0 auto',padding:'110px 28px',textAlign:'center'}}>
        <div style={{fontSize:'64px',color:gold,opacity:0.07,fontWeight:900,letterSpacing:'6px',marginBottom:'40px'}}>VCP</div>
        <div className="scan"/>
        <p style={{fontSize:'22px',color:'#555566',lineHeight:1.5,marginTop:'28px',fontStyle:'italic'}}>{loading}</p>
      </div>}

      {step==='voice'&&<div style={{maxWidth:'820px',margin:'0 auto',padding:'48px 28px'}}>
        <div style={{marginBottom:'32px'}}>
          <p style={{fontSize:'10px',color:'#3a3a4e',letterSpacing:'4px',textTransform:'uppercase',marginBottom:'10px'}}>Stage 2 → 3</p>
          <h2 style={{fontSize:'clamp(26px,4vw,40px)',fontWeight:300,lineHeight:1.2,marginBottom:'8px'}}>Your script is ready.<br/><em style={{color:gold}}>Now read it out loud.</em></h2>
          <p style={{fontSize:'14px',color:'#3a3a4e',lineHeight:1.7}}>This script is built from your answers. Read it naturally or riff on it. The recording captures how you actually speak.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'22px',marginBottom:'28px'}}>
          <div>
            <p style={{fontSize:'10px',color:'#3a3a4e',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'10px'}}>Your Script (~60 sec)</p>
            <div style={{background:'#0c0c14',border:'1px solid #1c1c28',padding:'24px 28px',lineHeight:2,fontSize:'17px',color:'#9a97a8',fontStyle:'italic'}}>{script}</div>
            <p style={{fontSize:'11px',color:'#2a2a38',marginTop:'8px',fontStyle:'italic'}}>Read it or use it as a guide.</p>
          </div>
          <div style={{display:'flex',flexDirection:'column'}}>
            <p style={{fontSize:'10px',color:'#3a3a4e',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'10px'}}>Record Your Voice</p>
            <div style={{flex:1,background:'#0c0c14',border:'1px solid #18181f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'14px',padding:'28px 20px',minHeight:'180px'}}>
              {speechOk?<>
                <button onClick={recording?stopRec:startRec} style={{width:'88px',height:'88px',borderRadius:'50%',border:'1.5px solid '+(recording?'#e05555':gold),background:recording?'rgba(224,85,85,0.07)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {recording
                    ?<svg width="20" height="20" fill="#e05555" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    :<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                  }
                </button>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'28px',letterSpacing:'4px',color:recording?'#e05555':'#1e1e2a',fontWeight:900}}>{ft(recTime)}</div>
                  <div style={{fontSize:'10px',color:'#2a2a38',letterSpacing:'2px',textTransform:'uppercase'}}>{recording?'Tap to stop':hasRec?'Tap to re-record':'Tap to start'}</div>
                </div>
                {recording&&<div className="scan" style={{width:'140px'}}/>}
              </>:<p style={{fontSize:'13px',color:'#3a3a4e',textAlign:'center',lineHeight:1.6}}>Voice not supported. Written answers will be used for tone.</p>}
            </div>
            {transcript&&<div style={{marginTop:'10px',background:'#0a0a12',border:'1px solid #14141e',padding:'12px 14px'}}>
              <p style={{fontSize:'10px',color:'#2a2a38',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'4px'}}>Transcript · {wc(transcript)} words</p>
              <p style={{fontSize:'13px',color:'#555566',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical'}}>{transcript}</p>
            </div>}
          </div>
        </div>
        {err&&<p style={{fontSize:'12px',color:'#e05555',marginBottom:'12px'}}>{err}</p>}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'18px',borderTop:'1px solid #0f0f16'}}>
          <button style={ghost} onClick={()=>{setStep('questions');setStage(1);}}>← Edit Answers</button>
          {(hasRec||!speechOk)
            ?<button style={btn} onClick={()=>{setStage(4);buildEmails();}}>Generate My Sequence →</button>
            :<button style={{...ghost,borderColor:'#2a2a38',color:'#4a4a5a'}} onClick={()=>{setStage(4);buildEmails();}}>Skip recording →</button>
          }
        </div>
      </div>}

      {step==='result'&&vp&&emails.length>0&&<div style={{display:'flex',height:'calc(100vh - 61px)'}}>
        <div style={{width:'272px',flexShrink:0,borderRight:'1px solid #0e0e16',overflowY:'auto'}}>
          <div style={{padding:'20px',borderBottom:'1px solid #0e0e16'}}>
            <p style={{fontSize:'9px',color:'#2a2a38',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'12px'}}>Voice Profile</p>
            <p style={{fontSize:'14px',color:gold,lineHeight:1.4,fontStyle:'italic',marginBottom:'10px'}}>{vp.transformationPromise}</p>
            <p style={{fontSize:'12px',color:'#555566',marginBottom:'6px'}}>{vp.tone}</p>
            <p style={{fontSize:'12px',color:'#555566',marginBottom:'10px'}}>{vp.avatar}</p>
            <div>{(vp.keyPhrases||[]).map((p,i)=><span key={i} style={{display:'inline-block',background:'rgba(201,168,76,0.07)',border:'1px solid rgba(201,168,76,0.15)',color:'#8a743a',padding:'2px 8px',fontSize:'10px',margin:'2px'}}>{p}</span>)}</div>
          </div>
          <div>
            <p style={{fontSize:'9px',color:'#2a2a38',letterSpacing:'3px',textTransform:'uppercase',padding:'14px 24px 6px'}}>Sequence</p>
            {emails.map((e,i)=>(
              <div key={i} className={'etab'+(activeE===i?' on':'')} onClick={()=>setActiveE(i)}>
                <span style={{fontSize:'20px',color:activeE===i?gold:'#1a1a26',fontWeight:900,lineHeight:1.2,flexShrink:0}}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <p style={{fontSize:'12px',color:activeE===i?'#eceae4':'#555',marginBottom:'2px'}}>{e.label}</p>
                  <p style={{fontSize:'10px',color:'#242434'}}>{e.sendDay}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:'18px 20px',borderTop:'1px solid #0e0e16'}}>
            <button style={{...btn,width:'100%',textAlign:'center',fontSize:'13px',padding:'12px'}} onClick={()=>dl(answers,script,transcript,vp,emails)}>↓ Download Coach Kit</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'40px 48px',maxWidth:'780px'}}>
          {emails[activeE]&&<div key={activeE}>
            <div style={{marginBottom:'28px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <p style={{fontSize:'10px',color:'#2e2e3e',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'7px'}}>{emails[activeE].sendDay} · {activeE+1} of {emails.length}</p>
                <h2 style={{fontSize:'34px',fontWeight:300,lineHeight:1.2}}>{emails[activeE].label}</h2>
              </div>
              <button style={ghost} onClick={()=>copy(activeE)}>{copied===activeE?'✓ Copied':'Copy'}</button>
            </div>
            <div style={{background:'#0c0c14',border:'1px solid #14141e',padding:'16px 22px',marginBottom:'24px'}}>
              <p style={{fontSize:'9px',color:'#2a2a38',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'6px'}}>Subject Line</p>
              <p style={{fontSize:'20px',fontWeight:400}}>{emails[activeE].subject}</p>
            </div>
            <div style={{height:'1px',background:'#0f0f16',marginBottom:'24px'}}/>
            <p style={{fontSize:'15px',lineHeight:2.1,color:'#8a8898',whiteSpace:'pre-wrap'}}>{emails[activeE].body}</p>
            <div style={{display:'flex',gap:'10px',marginTop:'44px',paddingTop:'24px',borderTop:'1px solid #0f0f16'}}>
              {activeE>0&&<button style={ghost} onClick={()=>setActiveE(activeE-1)}>← Prev</button>}
              {activeE<emails.length-1
                ?<button style={btn} onClick={()=>setActiveE(activeE+1)}>Next Email →</button>
                :<span style={{fontSize:'20px',color:gold,fontStyle:'italic',display:'flex',alignItems:'center'}}>Sequence complete.</span>
              }
            </div>
          </div>}
        </div>
      </div>}
    </div>
  );
}
