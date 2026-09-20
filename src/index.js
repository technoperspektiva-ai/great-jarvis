const TG="https://api.telegram.org";
const OPENAI="https://api.openai.com/v1/responses";

export default {
  async fetch(request, env, ctx) {
    const url=new URL(request.url);

    if(request.method==="GET" && url.pathname==="/"){
      return j({ok:true,name:"great-jarvis",telegram:"@greatjarvis_bot",
        default_model:env.DEFAULT_MODEL||"gpt-5.6",
        telegram_token:!!env.TELEGRAM_BOT_TOKEN,
        openai_key:!!env.OPENAI_API_KEY,
        webhook_secret:!!env.TELEGRAM_WEBHOOK_SECRET,
        next:`${url.origin}/setup-webhook`});
    }

    if(request.method==="GET" && url.pathname==="/health") return new Response("OK");

    if(request.method==="GET" && url.pathname==="/telegram"){
      return j({ok:true,message:"Telegram webhook endpoint is ready for POST requests.",
        setup:`${url.origin}/setup-webhook`});
    }

    if(request.method==="GET" && url.pathname==="/setup-webhook"){
      if(!env.TELEGRAM_BOT_TOKEN) return j({ok:false,error:"TELEGRAM_BOT_TOKEN is missing"},500);
      if(!env.TELEGRAM_WEBHOOK_SECRET) return j({ok:false,error:"TELEGRAM_WEBHOOK_SECRET is missing"},500);

      const webhook=`${url.origin}/telegram`;
      const r=await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({
          url:webhook,
          secret_token:env.TELEGRAM_WEBHOOK_SECRET,
          allowed_updates:["message"],
          drop_pending_updates:true
        })
      });
      const data=await r.json();
      return j({...data,webhook_url:webhook,next:data.ok?"Open @greatjarvis_bot and send /start":"Check bot token"},r.ok?200:500);
    }

    if(request.method==="GET" && url.pathname==="/webhook-info"){
      if(!env.TELEGRAM_BOT_TOKEN) return j({ok:false,error:"TELEGRAM_BOT_TOKEN is missing"},500);
      const r=await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
      return j(await r.json(),r.ok?200:500);
    }

    if(request.method==="POST" && url.pathname==="/telegram"){
      if(env.TELEGRAM_WEBHOOK_SECRET){
        const got=request.headers.get("X-Telegram-Bot-Api-Secret-Token");
        if(got!==env.TELEGRAM_WEBHOOK_SECRET) return new Response("Unauthorized",{status:401});
      }

      let update;
      try{ update=await request.json(); }catch{ return new Response("Bad JSON",{status:400}); }

      ctx.waitUntil(handle(update,env));
      return new Response("OK");
    }

    return new Response("Not found",{status:404});
  }
};

async function handle(update,env){
  const m=update?.message;
  const chatId=m?.chat?.id;
  const text=m?.text?.trim();
  if(!chatId||!text) return;

  if(text==="/start"){
    await send(env,chatId,"Привет 👋\n\nЯ Great Jarvis.\nНапиши мне любое сообщение — я отвечу через GPT.\n\n/help — помощь");
    return;
  }

  if(text==="/help"){
    await send(env,chatId,`Просто напиши вопрос обычным сообщением.\n\nМодель: ${env.DEFAULT_MODEL||"gpt-5.6"}`);
    return;
  }

  try{
    await tg(env,"sendChatAction",{chat_id:chatId,action:"typing"});
    const answer=await ask(env,text);
    await sendLong(env,chatId,answer);
  }catch(e){
    console.error(e);
    await send(env,chatId,"Ошибка GPT. Проверь OPENAI_API_KEY, доступ к модели и баланс API.");
  }
}

async function ask(env,input){
  if(!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const r=await fetch(OPENAI,{
    method:"POST",
    headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},
    body:JSON.stringify({
      model:env.DEFAULT_MODEL||"gpt-5.6",
      instructions:env.SYSTEM_PROMPT||"Ты полезный Telegram-ассистент.",
      input
    })
  });
  const data=await r.json();
  if(!r.ok) throw new Error(data?.error?.message||`OpenAI ${r.status}`);
  if(typeof data.output_text==="string"&&data.output_text.trim()) return data.output_text.trim();
  const out=[];
  for(const item of data.output||[]) for(const part of item.content||[])
    if(part.type==="output_text"&&typeof part.text==="string") out.push(part.text);
  return out.join("\n").trim()||"Пустой ответ.";
}

async function tg(env,method,payload){
  if(!env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN missing");
  const r=await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)
  });
  const data=await r.json();
  if(!r.ok||!data.ok) throw new Error(data?.description||`Telegram ${r.status}`);
  return data.result;
}

function send(env,chatId,text){
  return tg(env,"sendMessage",{chat_id:chatId,text,disable_web_page_preview:true});
}

async function sendLong(env,chatId,text){
  for(let i=0;i<text.length;i+=3900) await send(env,chatId,text.slice(i,i+3900));
}

function j(data,status=200){
  return new Response(JSON.stringify(data,null,2),{
    status,headers:{"content-type":"application/json; charset=utf-8"}
  });
}
