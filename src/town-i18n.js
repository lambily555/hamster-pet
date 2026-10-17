/* Offline display translations. Simulation keys, saves and user-authored text stay unchanged. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TownI18n=api})(typeof window==='undefined'?globalThis:window,function(){
  const dictionaries={en:{},es:{}},listeners=new Set(),protectedNames=new Set(),cache=new Map();
  const syllables={子:'Zi',鼠:'Shu',杏:'Xing',桃:'Tao',栗:'Li',麦:'Mai',糖:'Tang',花:'Hua',芋:'Yu',米:'Mi',豆:'Dou',果:'Guo',松:'Song',雪:'Xue',云:'Yun',星:'Xing',月:'Yue',竹:'Zhu',叶:'Ye',芝:'Zhi',橙:'Cheng',蓝:'Lan',宝:'Bao',芽:'Ya',团:'Tuan',酥:'Su',铃:'Ling',露:'Lu',糕:'Gao',粒:'Li',萌:'Meng',棠:'Tang',棉:'Mian',青:'Qing',璐:'Lu',诺:'Nuo',香:'Xiang',绒:'Rong',朵:'Duo',圆:'Yuan',悠:'You',小:'Xiao',轮:'Lun',白:'Bai',念:'Nian',安:'An',礼:'Li',石:'Shi',头:'Tou',糯:'Nuo',奶:'Nai',盖:'Gai',仁:'Ren',绵:'Mian',球:'Qiu',生:'Sheng',错:'Cuo',黛:'Dai',西:'Xi'};
  function displayName(name,lang){
    if(name==='白大夫')return 'Dr. Bai';
    if(name==='蜜桃')return lang==='es'?'Melocotón':'Peach';
    if(name==='奶糖')return lang==='es'?'Caramelo':'Toffee';
    const result=[...name].map(char=>syllables[char]||char).join('');
    return /[\u3400-\u9fff]/.test(result)?name:result;
  }
  let language='zh',pattern=null,observer=null,templates=[];const documentTitle=typeof document==='undefined'?'':document.title;
  function rebuildPattern(){
    const keys=[...new Set([...Object.values(dictionaries).flatMap(Object.keys),...protectedNames])].filter(key=>!key.includes('{')&&!/^.+伙伴\d+$/.test(key)&&!['一','二','三','四','五','六','日'].includes(key)).sort((a,b)=>b.length-a.length);
    pattern=new RegExp(keys.map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
    cache.clear();
  }
  function add(entries){
    let changed=false;
    for(const lang of ['en','es'])for(const [key,value] of Object.entries(entries[lang]||{})){
      if(dictionaries[lang][key]!==value){dictionaries[lang][key]=value;changed=true}
    }
    if(!changed)return;
    const allKeys=[...new Set(Object.values(dictionaries).flatMap(Object.keys))];
    templates=allKeys.filter(key=>/\{\d+\}/.test(key)).sort((a,b)=>b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length).map(key=>{
      const slots=[];
      const escaped=key.split(/(\{\d+\})/).map(part=>{
        if(/^\{\d+\}$/.test(part)){slots.push(Number(part.slice(1,-1)));return /^\{0\}(只|份|岁|颗瓜子|次)[。]?$/.test(key)?'([+-]?[0-9]+(?:[.,][0-9]+)?)':'(.+?)'}
        return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      }).join('');
      return {key,slots,pattern:new RegExp('^'+escaped+'$')};
    });
    rebuildPattern();
  }
  function protect(names){const next=[...new Set(names.filter(Boolean))].sort().join('\0');if(next===[...protectedNames].sort().join('\0'))return;protectedNames.clear();names.filter(Boolean).forEach(n=>protectedNames.add(n));rebuildPattern()}
  function translate(source,lang=language){
    const text=String(source??'');if(lang==='zh'||!pattern||!/[\u3400-\u9fff]/.test(text))return text;
    const key=lang+'\0'+text;if(cache.has(key))return cache.get(key);
    if(protectedNames.has(text)&&!/^.+伙伴\d+$/.test(text))return displayName(text,lang);
    let result=text;
    let matched=false;
    if(!dictionaries[lang]?.[result])for(const template of templates){const match=result.match(template.pattern);if(!match)continue;const values={};template.slots.forEach((slot,i)=>values[slot]=translate(match[i+1],lang));result=dictionaries[lang][template.key].replace(/\{(\d+)\}/g,(_,i)=>values[i]);matched=true;break}
    if(!matched){
      if(dictionaries[lang]?.[result])result=dictionaries[lang][result];
      else{
        for(const template of templates.filter(item=>!item.key.startsWith('{')&&/[。！？]$/.test(item.key))){
          result=result.replace(new RegExp(template.pattern.source.slice(1,-1),'g'),(...match)=>{const values={};template.slots.forEach((slot,i)=>values[slot]=translate(match[i+1],lang));return dictionaries[lang][template.key].replace(/\{(\d+)\}/g,(_,i)=>values[i])});
        }
        result=result.replace(pattern,word=>' '+(dictionaries[lang]?.[word]??displayName(word,lang))+' ');
      }
    }
    result=result.replace(/，/g,', ').replace(/。/g,'. ').replace(/：/g,': ').replace(/；/g,'; ').replace(/！/g,'!').replace(/？/g,'?').replace(/、/g,', ').replace(/（/g,' (').replace(/）/g,') ').replace(/“|”/g,'"').replace(/《|》/g,'"').replace(/ {2,}/g,' ').replace(/ +([,.!?:;)])/g,'$1').replace(/[,;]\s*([.;])/g,'$1').replace(/[(] +/g,'(').trim();
    if(cache.size>5000)cache.clear();cache.set(key,result);return result;
  }
  const textStates=new WeakMap(),attributeStates=new WeakMap();
  function renderText(node){const current=node.nodeValue,old=textStates.get(node),preview=node.parentElement?.dataset.i18nPreview,source=preview?decodeURIComponent(preview):old&&current===old.rendered?old.source:current;const rendered=preview?translate(source).slice(0,language==='zh'?25:60)+'…':translate(source);textStates.set(node,{source,rendered});if(rendered!==current)node.nodeValue=rendered}
  const excluded='script,style,[data-i18n-user],.chat-message p,#lineList .line span';
  function render(root){if(!root)return;observer?.disconnect();try{
    const nodes=[];if(root.nodeType===3)nodes.push(root);else{const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode)}
    for(const node of nodes){if(!node.parentElement||node.parentElement.closest(excluded+',textarea'))continue;if(node.parentElement.tagName==='OPTION'&&!node.parentElement.hasAttribute('value'))node.parentElement.value=node.parentElement.textContent;renderText(node)}
    const elements=root.nodeType===1?[root,...root.querySelectorAll('[placeholder],[title],[aria-label],[alt]')]:root.querySelectorAll?.('[placeholder],[title],[aria-label],[alt]')||[];
    for(const element of elements){if(element.closest(excluded))continue;let state=attributeStates.get(element);if(!state){state={};attributeStates.set(element,state)}for(const name of ['placeholder','title','aria-label','alt']){if(!element.hasAttribute(name))continue;const current=element.getAttribute(name),old=state[name],source=old&&old.rendered===current?old.source:current,rendered=translate(source);state[name]={source,rendered};if(current!==rendered)element.setAttribute(name,rendered)}}
  }finally{if(observer)observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','alt']})}}
  function setLanguage(lang){const next=['zh','en','es'].includes(lang)?lang:'zh',changed=language!==next;language=next;if(typeof document!=='undefined'){document.documentElement.lang=next==='zh'?'zh-CN':next;document.title=translate(documentTitle);render(document.body)}if(changed)listeners.forEach(fn=>fn())}
  function canvas(texture,paint){const draw=()=>{paint((ctx,text,x,y,maxWidth)=>{const value=translate(text);ctx.fillText(value,x,y,maxWidth??ctx.canvas.width*.93)});texture.needsUpdate=true};draw();listeners.add(draw);texture.addEventListener('dispose',()=>listeners.delete(draw));return texture}
  function observe(){if(typeof document==='undefined'||observer)return;observer=new MutationObserver(records=>{const roots=new Set();for(const record of records){if(record.type==='childList')record.addedNodes.forEach(node=>roots.add(node));else roots.add(record.target)}for(const node of roots)if(node.isConnected)render(node)});render(document.body)}
  return {add,protect,t:translate,setLanguage,render,observe,canvas,number:(value,options)=>new Intl.NumberFormat(language==='es'?'es-ES':language==='en'?'en-US':'zh-CN',options).format(value),get language(){return language},get locale(){return language==='zh'?'zh-CN':language==='es'?'es-ES':'en-US'},dictionaries};
});
