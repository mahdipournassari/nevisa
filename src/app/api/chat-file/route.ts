import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server';
import { GEMINI_MODEL } from '@/lib/plans';
import { extractFileContent, truncateContent, validateFile } from '@/lib/file-parser';
import { getGuestUsage, isGuestAllowed, setGuestUsageCookie, guestRemaining, guestLimit, type GuestUsage } from '@/lib/guest-usage';
import { checkUsageLimit, finalizeGenerationSlot, releaseGenerationSlot, reserveGenerationSlot } from '@/lib/subscription';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
const KEY = process.env.GEMINI_API_KEY; const MODEL = process.env.GEMINI_MODEL?.trim() || GEMINI_MODEL;
async function ask(content:string,label:string,q:string){
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(KEY!)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:'تو دستیار چت با فایل نویسا هستی. فقط بر اساس محتوای فایل پاسخ بده؛ اگر پاسخ در فایل نیست صریحاً بگو. محاسبات را دقیق انجام بده و فارسی پاسخ بده.'}]},contents:[{role:'user',parts:[{text:`به سؤال کاربر درباره فایل پاسخ بده.\nنوع فایل: ${label}\nسؤال: ${q}\nمحتوا:\n---\n${content}\n---`}]}],generationConfig:{maxOutputTokens:4096}}),signal:AbortSignal.timeout(60000)});
 if(!r.ok) throw new Error('Gemini API error'); const d=await r.json(); return d.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text??'').join('').trim()??'';
}
export async function POST(req:NextRequest){let rid:string|null=null;try{
 const {user,error}=await getAuthenticatedUser(req); const hasAuth=!!req.headers.get('authorization'); if(hasAuth&&(error||!user)) return NextResponse.json({error:error??'احراز هویت نامعتبر'},{status:401});
 const guest=!user; const gu=guest?getGuestUsage(req):null; if(guest&&!isGuestAllowed(gu!,'fileChat')) return NextResponse.json({error:`سهمیه چت با فایل مهمان (${guestLimit('fileChat')} پیام در روز) تمام شده است. برای ادامه رایگان ثبت‌نام کنید.`,limitExceeded:true,guest:true,guestRemaining:guestRemaining(gu!)},{status:429});
 if(!KEY) return NextResponse.json({error:'کلید API هوش مصنوعی تنظیم نشده است.'},{status:503});
 const fd=await req.formData(); const fv=fd.get('file'); const qv=fd.get('question'); if(!(fv instanceof File)) return NextResponse.json({error:'فایلی ارسال نشده است.'},{status:400}); const q=typeof qv==='string'?qv.trim().slice(0,4000):''; if(!q)return NextResponse.json({error:'سؤال خود را وارد کنید.'},{status:400});
 let ext:string; try{ext=validateFile(fv)}catch(e){const m=e instanceof Error?e.message:'فایل نامعتبر است.';return NextResponse.json({error:m},{status:m.includes('۱۰ مگابایت')?413:400});}
 let x;try{x=await extractFileContent(fv,ext);x.content=truncateContent(x.content);if(!x.content.trim())throw new Error('محتوای قابل تحلیل از فایل استخراج نشد.')}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'استخراج محتوا ناموفق بود.'},{status:422});}
 if(!guest){const c=await checkUsageLimit(user!.id);if(!c.allowed)return NextResponse.json({error:c.limitReason==='daily'?`سقف روزانه (${c.plan.dailyLimit.toLocaleString('fa-IR')} درخواست) تمام شده است.`:`سقف ماهانه (${c.plan.monthlyLimit.toLocaleString('fa-IR')} درخواست) تمام شده است.`,limitExceeded:true},{status:429});const res=await reserveGenerationSlot(user!.id,c.plan.dailyLimit,c.plan.monthlyLimit);rid=res.reservationId;if(!rid)return NextResponse.json({error:'سهمیه استفاده در دسترس نیست.'},{status:429});}
 let answer='';try{answer=await ask(x.content,x.label,q)}catch(e){if(rid)await releaseGenerationSlot(rid).catch(()=>undefined);console.error(e);return NextResponse.json({error:'خطا در پاسخ‌گویی هوش مصنوعی.'},{status:502});}if(!answer){if(rid)await releaseGenerationSlot(rid).catch(()=>undefined);return NextResponse.json({error:'پاسخی دریافت نشد.'},{status:502});}if(rid)await finalizeGenerationSlot(rid);
 if(guest){const next:GuestUsage={...gu!,fileChat:gu!.fileChat+1};const res=NextResponse.json({answer,fileName:fv.name,fileType:x.label,guest:true,guestRemaining:guestRemaining(next)});setGuestUsageCookie(res,next);return res;}return NextResponse.json({answer,fileName:fv.name,fileType:x.label,guest:false});
}catch(e){if(rid)await releaseGenerationSlot(rid).catch(()=>undefined);console.error('File chat error',e);return NextResponse.json({error:'خطای غیرمنتظره در چت با فایل'},{status:500});}}
