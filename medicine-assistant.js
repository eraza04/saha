import { needsUrgentHelp, URGENT_GUIDANCE, TRUSTED_SOURCES, CHAT_LIMITS } from './medicine-safety.js';

// A small escaped Markdown subset. AI HTML/links are never inserted as markup.
export function formatChatText(text,esc){
  const inline=value=>esc(value).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<em>$1</em>').replace(/`([^`\n]+)`/g,'<code>$1</code>');
  let html='',list='';
  for(const line of text.split('\n')){
    const numbered=line.match(/^\s*\d+[.)]\s+(.+)/),bullet=line.match(/^\s*[-*]\s+(.+)/),kind=numbered?'ol':bullet?'ul':'';
    if(list&&list!==kind){html+='</'+list+'>';list='';}
    if(kind){if(!list){html+='<'+kind+'>';list=kind;}html+='<li>'+inline((numbered||bullet)[1])+'</li>';}
    else if(line.trim())html+='<p>'+inline(line.replace(/^#{1,4}\s+/,''))+'</p>';
  }
  return html+(list?'</'+list+'>':'');
}

// Chat content is page memory only; it never enters care snapshots or study logs.
export function createMedicineAssistant({isOpen,request=fetch}){
  let turns=[],draft='',consent=false,error='',busy=false,urgent=false,clearing=false,about=false,job=null,root=null,ui=null,scrollPosition=0,nextId=0;
  const history=()=>turns.filter(t=>t.status==='complete').flatMap(t=>[{role:'user',content:t.question},{role:'assistant',content:t.answer}]);
  const active=()=>turns.at(-1);
  const nearBottom=list=>list.scrollHeight-list.scrollTop-list.clientHeight<80;
  const scrollArea=()=>{const list=root.querySelector('.assistant-conversation');return getComputedStyle(list).overflowY==='visible'?root:list;};
  function status(){return busy?(active()?.answer?'Reply arriving. Still incomplete.':'Waiting for a reply.'):error?'Reply not completed.':turns.length?'Ready for another question.':'Ask a question to start.';}
  function providerLabel(t){return t.provider==='groq'?(t.model==='openai/gpt-oss-120b'?'GPT-OSS 120B via Groq':'GPT-OSS 20B via Groq'):t.provider==='openrouter'?'Gemma via OpenRouter':'';}
  function turnHTML(t){return '<div class="chat-turn" data-turn="'+t.id+'"><article class="assistant-message assistant-user" aria-label="Your message"><span class="message-role">You</span><div class="message-body">'+ui.esc(t.question).replace(/\n/g,'<br>')+'</div></article><article class="assistant-message assistant-bot" aria-label="Saha reply" data-state="'+t.status+'"><span class="message-role">'+ui.icon('pill')+'Saha</span><div class="message-body assistant-answer">'+(t.answer?formatChatText(t.answer,ui.esc):'<span class="chat-thinking">Thinking<span aria-hidden="true">...</span></span>')+'</div><p class="message-status"></p></article></div>';}
  function html(helpers){
    ui=helpers;const {esc,icon,btn}=ui;
    return '<section class="assistant-layout" aria-label="Medicine chat"><div class="assistant-conversation" role="log" aria-live="off" aria-label="Chat messages" tabindex="0"><div class="chat-heading"><div><h2>Ask Saha</h2><p>General information only</p></div><button type="button" class="chat-tool" data-action="assistantClear">'+icon('plus')+'New chat</button></div><div class="chat-toolbar"><button type="button" class="chat-tool" data-action="assistantAbout" aria-expanded="'+about+'" aria-controls="assistant-about">'+icon('info')+'About &amp; privacy</button><button type="button" class="chat-tool chat-urgent-button" data-action="assistantUrgent">'+icon('info')+'Urgent help</button></div>'+
      '<section id="assistant-about" class="chat-info" '+(about?'':'hidden')+'><h3>About this chat</h3><p id="assistant-privacy">Use fictional examples. Sending shares this conversation with the AI service and its model provider. Saved care records are not shared. Saha keeps chat only in page memory; providers may retain messages under their policies.</p><p>Ask about medicine uses, side effects or questions for a pharmacist. AI can be wrong. Verify answers with the leaflet and a pharmacist. This chat cannot diagnose, assess overdose safety, change doses or recommend replacements for treatment.</p><h3>Trusted reading</h3><p>These links are not verified citations for each AI answer.</p>'+TRUSTED_SOURCES.map(s=>'<a class="chat-source" target="_blank" rel="noopener noreferrer" href="'+s.url+'">'+esc(s.name)+' (new tab)</a>').join('')+'</section><section class="assistant-urgent chat-info" '+(urgent?'':'hidden')+' role="alert"><h3>Get urgent help</h3><p>'+esc(URGENT_GUIDANCE)+'</p><p>This has not called anyone.</p></section>'+
      '<div class="chat-welcome" '+(turns.length?'hidden':'')+'><span class="chat-welcome-icon" aria-hidden="true">'+icon('pill')+'</span><h3>What would you like to know?</h3><p>Ask about a medicine or prepare questions for your pharmacist.</p><div class="chat-suggestions"><button type="button" data-action="assistantPrompt:effects">Side effects</button><button type="button" data-action="assistantPrompt:pharmacist">Ask a pharmacist</button><button type="button" data-action="assistantPrompt:habits">Healthy habits</button></div></div><div id="assistant-turns">'+turns.map(turnHTML).join('')+'</div></div>'+
      '<button type="button" id="assistant-latest" class="chat-latest" data-action="assistantLatest" hidden>Latest reply '+icon('right')+'</button><div class="chat-confirm" '+(clearing?'':'hidden')+'><p>Start a new chat? This clears the conversation. Saved care records stay.</p>'+btn('Confirm clear chat','assistantConfirmClear','danger','reset')+btn('Cancel','assistantCancelClear','secondary','close')+'</div>'+
      '<form id="assistant-form" class="assistant-composer" novalidate><label for="assistant-question">Message</label><textarea id="assistant-question" name="question" rows="2" maxlength="2000" placeholder="Ask about a medicine..." aria-describedby="assistant-error assistant-keyboard">'+esc(draft)+'</textarea><label class="chat-consent" for="assistant-consent"><input id="assistant-consent" type="checkbox" '+(consent?'checked':'')+'><span>Allow sending to AI</span></label><button id="assistant-send" class="chat-send" type="submit" '+(busy?'hidden':'')+'>'+icon('right')+'Send</button><button id="assistant-stop" class="chat-send chat-stop" type="button" data-action="assistantStop" aria-label="Stop response" '+(busy?'':'hidden')+'>'+icon('close')+'Stop</button><p class="chat-caption">Fictional details only.</p><p id="assistant-error" class="field-error" role="alert">'+esc(error)+'</p><span id="assistant-keyboard" class="sr-only">Enter sends. Shift and Enter adds a new line. Allow sending to AI before sending.</span><p id="assistant-status" class="chat-status" role="status" aria-live="polite" aria-atomic="true">'+status()+'</p></form></section>';
  }
  function resize(){const field=root?.querySelector('#assistant-question');if(field){field.style.height='auto';field.style.height=Math.min(field.scrollHeight,144)+'px';}}
  function paint(forceScroll=false){
    if(!root?.isConnected||!isOpen())return;
    const list=scrollArea(),follow=forceScroll||nearBottom(list),container=root.querySelector('#assistant-turns');
    root.querySelector('.chat-welcome').hidden=turns.length>0;
    for(const t of turns){
      let element=container.querySelector('[data-turn="'+t.id+'"]');
      if(!element){container.insertAdjacentHTML('beforeend',turnHTML(t));element=container.lastElementChild;}
      const bot=element.querySelector('.assistant-bot'),answer=bot.querySelector('.assistant-answer');bot.dataset.state=t.status;
      if(answer._shown!==t.answer){answer.innerHTML=t.answer?formatChatText(t.answer,ui.esc):'<span class="chat-thinking">'+(busy?'Thinking...':'No completed answer.')+'</span>';answer._shown=t.answer;}
      const label=bot.querySelector('.message-status'),labelText=t.status==='complete'?(t.kind==='ai'?'AI response. '+providerLabel(t):'Safety guidance.'):(t.status==='streaming'||t.status==='sending')?'Reply in progress. Not complete.':'Interrupted reply. Not saved as conversation context.';
      if(label.textContent!==labelText)label.textContent=labelText;
    }
    const field=root.querySelector('#assistant-question');if(field.value!==draft)field.value=draft;
    const checkbox=root.querySelector('#assistant-consent');checkbox.checked=consent;
    const errorNode=root.querySelector('#assistant-error');if(errorNode.textContent!==error)errorNode.textContent=error;
    const live=root.querySelector('#assistant-status');if(live.textContent!==status())live.textContent=status();
    const send=root.querySelector('#assistant-send'),stop=root.querySelector('#assistant-stop'),wasStop=document.activeElement===stop,wasSend=document.activeElement===send;send.hidden=busy;stop.hidden=!busy;
    if(wasSend&&busy)stop.focus({preventScroll:true});else if(wasStop&&!busy)field.focus({preventScroll:true});
    root.querySelector('.assistant-urgent').hidden=!urgent;root.querySelector('#assistant-about').hidden=!about;root.querySelector('.chat-confirm').hidden=!clearing;root.querySelector('.assistant-composer').hidden=clearing;
    root.querySelectorAll('[aria-controls="assistant-about"]').forEach(e=>e.setAttribute('aria-expanded',String(about)));
    resize();if(follow)list.scrollTop=list.scrollHeight;const latest=root.querySelector('#assistant-latest');latest.hidden=!turns.some(t=>t.answer)||nearBottom(list);latest.style.bottom=(root.querySelector('.assistant-composer').offsetHeight+12)+'px';scrollPosition=list.scrollTop;
  }
  function mount(element,{resetScroll=false}={}){
    const savedScroll=scrollPosition;root=element;if(!root.querySelector('.assistant-conversation'))return;const list=scrollArea();
    paint();list.scrollTop=resetScroll?0:savedScroll;scrollPosition=list.scrollTop;
    const saveScroll=()=>{const area=scrollArea();scrollPosition=area.scrollTop;root.querySelector('#assistant-latest').hidden=!turns.some(t=>t.answer)||nearBottom(area);};root.addEventListener('scroll',saveScroll);root.querySelector('.assistant-conversation').addEventListener('scroll',saveScroll);
    root.querySelector('#assistant-question').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submit();}});
  }
  function interrupt(message){
    const previous=job;job=null;previous?.abort();if(busy&&active()){active().status='stopped';if(!draft)draft=active().question;}busy=false;if(message)error=message;paint();
  }
  function applyEvent(event,turn){
    if(event.type==='start'){turn.provider=event.provider;turn.model=event.model;return;}
    if(event.type==='delta'){if(typeof event.text!=='string'||turn.answer.length+event.text.length>CHAT_LIMITS.answer)throw new Error('A complete answer was not available.');turn.answer+=event.text;turn.status='streaming';paint();return;}
    if(event.type==='replace'){turn.answer=event.text;turn.kind=event.kind;paint();return;}
    if(event.type==='error')throw new Error(event.error||'The reply was interrupted. Try again later.');
    if(event.type==='done'){
      if(!['ai','urgent','boundary'].includes(event.kind)||typeof event.text!=='string'||!event.text.trim()||event.text.length>CHAT_LIMITS.answer)throw new Error('No complete answer is available.');
      turn.answer=event.text;turn.kind=event.kind;turn.provider=event.provider||turn.provider;turn.model=event.model||turn.model;turn.status='complete';urgent=event.kind==='urgent';paint();
    }
  }
  async function submit(){
    if(busy)return;error='';const question=draft.trim();
    if(!question||question.length>CHAT_LIMITS.question){error='Enter a question of up to 2,000 characters.';paint();root?.querySelector('#assistant-question').focus();return;}
    if(needsUrgentHelp(question)){urgent=true;paint();root?.querySelector('.assistant-urgent').scrollIntoView({block:'nearest'});return;}
    if(!consent){error='Allow sending to AI before sending.';paint();root?.querySelector('#assistant-consent').focus();return;}
    const messages=history();if(messages.length+1>CHAT_LIMITS.messages||messages.reduce((n,m)=>n+m.content.length,question.length)>CHAT_LIMITS.conversation){error='This chat is full. Start a new chat to continue. Earlier messages have not been removed.';paint();return;}
    const turn={id:++nextId,question,answer:'',status:'sending',kind:'ai'},current=new AbortController();turns.push(turn);draft='';busy=true;job=current;paint(true);
    try{
      const response=await request('/api/medicine-chat',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify({consent:true,stream:true,messages:[...messages,{role:'user',content:question}]}),signal:current.signal});
      if(job!==current)return;
      if(!response.ok){const result=await response.json();throw new Error(result.error||'No answer is available. Try again later.');}
      if(response.headers.get('content-type')?.includes('application/x-ndjson')){
        const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
        try{while(true){const {value,done}=await reader.read();if(job!==current)return;buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});if(buffer.length>40000)throw new Error('The reply is too long.');let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(line.trim())applyEvent(JSON.parse(line),turn);}if(turn.status==='complete')break;if(done){if(buffer.trim())applyEvent(JSON.parse(buffer),turn);break;}}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
        if(turn.status!=='complete')throw new Error('The connection ended before the reply was complete. Try again.');
      }else{const result=await response.json();if(job!==current)return;applyEvent({type:'done',...result},turn);}
      job=null;busy=false;paint();
    }catch(e){if(job!==current)return;job=null;busy=false;turn.status='error';if(!draft)draft=question;error=e.name==='AbortError'?'Response stopped. You can send the question again.':e.message==='Failed to fetch'?'Could not connect. Your question is still here.':e.message;paint();}
  }
  return {html,mount,submit,
    input(element){if(element.id==='assistant-question'){draft=element.value;resize();}if(element.id==='assistant-consent')consent=element.checked;},
    action(action){
      if(action.startsWith('assistantPrompt:')){const prompts={effects:'What does a medicine side effect mean?',pharmacist:'What questions could I ask a pharmacist about a new medicine?',habits:'What general healthy habits could I discuss with a clinician?'};draft=prompts[action.split(':')[1]]||'';paint();root?.querySelector('#assistant-question').focus();}
      if(action==='assistantUrgent'){interrupt();urgent=true;paint();root?.querySelector('.assistant-urgent').scrollIntoView({block:'nearest'});}
      if(action==='assistantAbout'){about=!about;paint();if(about)root?.querySelector('#assistant-about').scrollIntoView({block:'start'});}
      if(action==='assistantStop')interrupt('Response stopped. You can send the question again.');
      if(action==='assistantClear'){clearing=true;paint();root?.querySelector('[data-action="assistantConfirmClear"]').focus();}
      if(action==='assistantCancelClear'){clearing=false;paint();root?.querySelector('[data-action="assistantClear"]').focus();}
      if(action==='assistantConfirmClear'){interrupt();turns=[];draft='';error='';urgent=false;clearing=false;consent=false;root?.querySelector('#assistant-turns').replaceChildren();paint();root?.querySelector('#assistant-question').focus();}
      if(action==='assistantLatest'){if(root){const list=scrollArea();list.scrollTop=list.scrollHeight;}}
    },
    leave(){if(busy)interrupt('Response stopped when you left the chat. Your question is still here.');root=null;},
    reset(){interrupt();turns=[];draft='';consent=false;error='';urgent=false;clearing=false;about=false;root=null;scrollPosition=0;}
  };
}
