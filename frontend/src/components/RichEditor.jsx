import { useEffect, useRef, useState } from 'react';
import { Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Table as TableIcon, Link as LinkIcon, Unlink, Image as ImageIcon, Eraser } from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { marked } from 'marked';
import { cleanRich, isRich, richHTML, encodeRich } from '../lib/richContent';
import './rich-editor.css';

const FontSize = Extension.create({ name:'fontSize', addGlobalAttributes(){return [{types:['textStyle'],attributes:{fontSize:{default:null,parseHTML:el=>el.style.fontSize||null,renderHTML:a=>a.fontSize?{style:`font-size: ${a.fontSize}`}:{}}}}]}});
const extensions=[StarterKit,Underline,TextStyle,Color,FontFamily,FontSize,Highlight.configure({multicolor:true}),TextAlign.configure({types:['heading','paragraph']}),Link.configure({openOnClick:false,autolink:false}),Image.configure({allowBase64:false}),Table.configure({resizable:false}),TableRow,TableHeader,TableCell];
const escapeText=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const toHTML=(v,plain)=>isRich(v)?richHTML(v):cleanRich(plain?`<p>${escapeText(v).replace(/\n/g,'<br>')}</p>`:marked.parse(v||'',{gfm:true}));
const validURL=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
function Tool({label,children,onClick,active=false,disabled=false}){return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={onClick} className={`mce-word-tool ${active?'is-active':''}`}>{children}</button>}
export default function RichEditor({value='',onChange,plain=false,fullPage=false,label='Contenu pédagogique'}){
 const callback=useRef(onChange);callback.current=onChange;
 const latest=useRef(value);const [expanded,setExpanded]=useState(false);const [urlMode,setUrlMode]=useState('');const [url,setUrl]=useState('');const [urlError,setUrlError]=useState('');
 const editor=useEditor({extensions,content:toHTML(value,plain),editorProps:{attributes:{class:'mce-word-body lesson-prose prose prose-slate max-w-none',role:'textbox','aria-multiline':'true','aria-label':label},transformPastedHTML:html=>cleanRich(html)},onUpdate:({editor:e})=>{const next=e.isEmpty?'':encodeRich(e.getHTML());latest.current=next;callback.current(next);}});
 useEffect(()=>{if(editor&&value!==latest.current){latest.current=value;editor.commands.setContent(toHTML(value,plain),false)}},[editor,value,plain]);
 if(!editor)return <p className="text-sm text-slate-500">Chargement de l’éditeur…</p>;
 const run=fn=>()=>fn(editor.chain().focus()).run();
 const insertURL=()=>{const safe=validURL(url.trim());if(!safe){setUrlError('Utilisez une adresse http:// ou https:// valide.');return;}if(urlMode==='image')editor.chain().focus().setImage({src:safe,alt:'Illustration pédagogique'}).run();else{const chain=editor.chain().focus();if(editor.state.selection.empty)chain.insertContent({type:'text',text:safe,marks:[{type:'link',attrs:{href:safe}}]}).run();else chain.extendMarkRange('link').setLink({href:safe}).run();}setUrlMode('');setUrl('');setUrlError('')};
 return <div className={`mce-word ${fullPage?'mce-word-full':''} ${expanded?'mce-word-expanded':''}`}><div className="mce-word-sticky">{!fullPage&&<div className="mce-word-heading flex items-center justify-between gap-2 border-b border-slate-200 bg-navy-900 px-3 py-2 text-white"><span className="text-xs font-bold tracking-wide">MCE ACADEMY · ÉDITEUR</span>{!fullPage&&<button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold hover:bg-white/10" onClick={()=>setExpanded(v=>!v)}>{expanded?'Réduire':'Agrandir'}</button>}</div>}
 <div className="mce-word-toolbar" role="toolbar" aria-label="Mise en forme">
 <Tool label="Annuler" onClick={run(c=>c.undo())} disabled={!editor.can().undo()}><Undo2 size={16}/></Tool><Tool label="Rétablir" onClick={run(c=>c.redo())} disabled={!editor.can().redo()}><Redo2 size={16}/></Tool>
 <select aria-label="Style du paragraphe" value={editor.isActive('heading',{level:1})?'1':editor.isActive('heading',{level:2})?'2':editor.isActive('heading',{level:3})?'3':'p'} onChange={e=>{const c=editor.chain().focus();e.target.value==='p'?c.setParagraph().run():c.setHeading({level:Number(e.target.value)}).run()}}><option value="p">Normal</option><option value="1">Titre 1</option><option value="2">Titre 2</option><option value="3">Titre 3</option></select>
 <select aria-label="Police" value={editor.getAttributes('textStyle').fontFamily||''} onChange={e=>{const c=editor.chain().focus();e.target.value?c.setFontFamily(e.target.value).run():c.unsetFontFamily().run()}}><option value="">Par défaut</option>{['Arial','Georgia','Verdana','Times New Roman','Courier New'].map(f=><option key={f}>{f}</option>)}</select>
 <select aria-label="Taille de police" value={editor.getAttributes('textStyle').fontSize||''} onChange={e=>editor.chain().focus().setMark('textStyle',{fontSize:e.target.value||null}).run()}><option value="">Taille</option>{[12,14,16,18,20,24,28,32,36].map(n=><option key={n} value={`${n}px`}>{n} px</option>)}</select>
 <Tool label="Gras" active={editor.isActive('bold')} onClick={run(c=>c.toggleBold())}><b>G</b></Tool><Tool label="Italique" active={editor.isActive('italic')} onClick={run(c=>c.toggleItalic())}><i>I</i></Tool><Tool label="Souligné" active={editor.isActive('underline')} onClick={run(c=>c.toggleUnderline())}><u>S</u></Tool><Tool label="Barré" active={editor.isActive('strike')} onClick={run(c=>c.toggleStrike())}><s>ab</s></Tool>
 <label className="mce-word-color" title="Couleur du texte">A<input aria-label="Couleur du texte" type="color" value={/^#[0-9a-f]{6}$/i.test(editor.getAttributes('textStyle').color||'')?editor.getAttributes('textStyle').color:'#0b1d33'} onChange={e=>editor.chain().focus().setColor(e.target.value).run()}/></label><Tool label="Surligner en jaune" active={editor.isActive('highlight')} onClick={run(c=>c.toggleHighlight({color:'#fff09a'}))}><span className="bg-yellow-200 px-1">ab</span></Tool>
 {[["left","Gauche",AlignLeft],["center","Centrer",AlignCenter],["right","Droite",AlignRight],["justify","Justifier",AlignJustify]].map(([a,t,Icon])=><Tool key={a} label={`Aligner : ${t}`} active={editor.isActive({textAlign:a})} onClick={run(c=>c.setTextAlign(a))}><Icon size={16}/></Tool>)}
 <Tool label="Liste à puces" active={editor.isActive('bulletList')} onClick={run(c=>c.toggleBulletList())}><List size={16}/></Tool><Tool label="Liste numérotée" active={editor.isActive('orderedList')} onClick={run(c=>c.toggleOrderedList())}><ListOrdered size={16}/></Tool><Tool label="Citation" active={editor.isActive('blockquote')} onClick={run(c=>c.toggleBlockquote())}><Quote size={16}/></Tool><Tool label="Insérer un tableau" onClick={run(c=>c.insertTable({rows:3,cols:3,withHeaderRow:true}))}><TableIcon size={16}/></Tool>
 {editor.isActive('table')&&<><Tool label="Ajouter une ligne" onClick={run(c=>c.addRowAfter())}>+ Ligne</Tool><Tool label="Ajouter une colonne" onClick={run(c=>c.addColumnAfter())}>+ Col.</Tool><Tool label="Supprimer une ligne" onClick={run(c=>c.deleteRow())}>− Ligne</Tool><Tool label="Supprimer une colonne" onClick={run(c=>c.deleteColumn())}>− Col.</Tool><Tool label="Supprimer le tableau" onClick={run(c=>c.deleteTable())}>− Tableau</Tool></>}
 <Tool label="Insérer un lien" onClick={()=>{setUrlMode('link');setUrl(editor.getAttributes('link').href||'');setUrlError('')}}><LinkIcon size={16}/></Tool><Tool label="Retirer le lien" onClick={run(c=>c.unsetLink())}><Unlink size={16}/></Tool><Tool label="Insérer une image par URL" onClick={()=>{setUrlMode('image');setUrl('');setUrlError('')}}><ImageIcon size={16}/></Tool><Tool label="Effacer la mise en forme" onClick={run(c=>c.unsetAllMarks().clearNodes())}><Eraser size={16}/></Tool>
 </div>{urlMode&&<div className="flex flex-wrap gap-2 border-b p-3"><input aria-label="Adresse URL" className="input min-w-0 flex-1" type="url" placeholder="https://…" value={url} onChange={e=>setUrl(e.target.value)}/><button type="button" className="btn-primary" onClick={insertURL}>Insérer</button><button type="button" className="btn-secondary" onClick={()=>setUrlMode('')}>Annuler</button>{urlError&&<p className="w-full text-xs text-red-600">{urlError}</p>}</div>}
 </div><EditorContent className="mce-word-scroll" editor={editor}/><div className="border-t border-slate-100 px-3 py-2 text-right text-xs text-slate-500">{editor.getText().trim().split(/\s+/).filter(Boolean).length} mot(s)</div></div>
}
