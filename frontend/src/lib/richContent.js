import DOMPurify from 'dompurify';
const PREFIX='<!--MCE-RICH-V1-->';
export const isRich=value=>typeof value==='string'&&value.startsWith(PREFIX);
// Explicit allowlist; strip all CSS properties except supported formatting.
export function cleanRich(html){
 const fragment=DOMPurify.sanitize(String(html||''),{RETURN_DOM_FRAGMENT:true,ALLOWED_TAGS:['p','br','h1','h2','h3','h4','h5','h6','strong','b','em','i','u','s','del','strike','span','mark','ul','ol','li','blockquote','pre','code','hr','a','img','table','thead','tbody','tfoot','tr','td','th'],ALLOWED_ATTR:['style','href','src','alt','title','colspan','rowspan','start'],ALLOW_DATA_ATTR:false});
 for(const el of fragment.querySelectorAll('[style]')){const s=el.style;const safe=[];for(const key of ['color','background-color','font-family','font-size','text-align']){const v=s.getPropertyValue(key);if(v&&!/url\s*\(|var\s*\(|expression\s*\(|[{};]/i.test(v))safe.push(`${key}: ${v}`)}el.removeAttribute('style');if(safe.length)el.setAttribute('style',safe.join('; '));}
 for(const el of fragment.querySelectorAll('a[href],img[src]')){const attr=el.tagName==='A'?'href':'src';try{const u=new URL(el.getAttribute(attr),window.location.origin);if(!['https:','http:'].includes(u.protocol))el.removeAttribute(attr);}catch{el.removeAttribute(attr)}if(el.tagName==='A'){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer')}}
 const box=document.createElement('div');box.append(fragment);return box.innerHTML;
}
export const richHTML=value=>cleanRich(isRich(value)?value.slice(PREFIX.length):'');
export const encodeRich=html=>PREFIX+cleanRich(html);
export const richPlain=value=>{if(!isRich(value))return value||'';const d=document.createElement('div');d.innerHTML=richHTML(value);return d.textContent||''};
