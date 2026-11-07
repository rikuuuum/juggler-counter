'use strict';
const KEY='jugglerMultiData_v9', V=9;
const CORE=[['grape','small','ぶどう'],['cherry','small','チェリー'],['solo_bb','BB','単独BIG'],['cherry_bb','BB','チェリーBIG'],['solo_rb','RB','単独REG'],['cherry_rb','RB','チェリーREG']].map(([key,category,name])=>({id:'core-'+key,key,category,name,count:0}));
let specs=[],state=root(),countMode='add',editingCounterId=null,storageErrorMessage='',specLoadError=false;
const $=id=>document.getElementById(id), N=v=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:0;}, C=x=>JSON.parse(JSON.stringify(x));
function parseInput(v){const str=String(v).trim();if(!/^\d+$/.test(str))return null;const n=Number(str);return Number.isSafeInteger(n)&&n>=0?n:null;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function game(){return {series:'マイジャグラーV',machineNo:'',sessionStarted:false,grapeIncluded:true,grapeStart:null,startSnapshot:{totalGames:0,bb:0,rb:0},totalGames:0,counters:CORE.map(x=>({...x})),actionHistory:[]};}
function root(){return {version:V,currentTab:'A',analysisMode:'machine',dark:false,appData:{A:game(),B:game(),C:game()}};}
function d(){return state.appData[state.currentTab];}
function session(x=d()){return Math.max(0,x.totalGames-x.startSnapshot.totalGames);}
function hasSessionStarted(x=d()){return !!x.sessionStarted||session(x)>0||x.counters.some(c=>c.count>0);}
function isCoreCounter(c){return CORE.some((core,i)=>core.key===c.key||String(core.id)===String(c.id)||String(i+1)===String(c.id)||(!c.key&&!c.id&&core.name===c.name));}
function normalizeCounters(x){const all=Array.isArray(x.counters)?x.counters:[];x.counters=CORE.map((core,i)=>{const f=all.find(c=>c.key===core.key||String(c.id)===String(core.id)||String(c.id)===String(i+1)||c.name===core.name);return {...core,name:String(f?.name||core.name).slice(0,30),count:N(f?.count)};}).concat(all.filter(c=>!isCoreCounter(c)).map((c,i)=>({id:String(c.id||'custom-'+i),key:String(c.key||'custom_'+i),category:['BB','RB','small'].includes(c.category)?c.category:'custom',name:String(c.name||'項目').slice(0,30),count:N(c.count)})));}
function normalizeGames(x){normalizeCounters(x);x.startSnapshot=Object.assign(game().startSnapshot,x.startSnapshot||{});x.startSnapshot.totalGames=N(x.startSnapshot.totalGames);x.startSnapshot.bb=N(x.startSnapshot.bb);x.startSnapshot.rb=N(x.startSnapshot.rb);x.totalGames=Math.max(N(x.totalGames),x.startSnapshot.totalGames);return x;}
function migrate(raw){const x=Object.assign(game(),raw||{});x.startSnapshot=Object.assign(game().startSnapshot,raw?.startSnapshot||raw?.snapshot||{});delete x.history;delete x.currentGames;delete x.lastBonusTotalGame;delete x.startSnapshot.currentGames;x.totalGames=N(x.totalGames);x.counters=Array.isArray(raw?.counters)?raw.counters:[];x.sessionStarted=typeof raw?.sessionStarted==='boolean'?raw.sessionStarted:hasSessionStarted(x); x.grapeIncluded=raw?.grapeIncluded!==false;const st=raw?.grapeStart;const valid=n=>Number.isSafeInteger(n)&&n>=0;x.grapeStart=st&&['totalGames','bb','rb','grape'].every(k=>valid(st[k]))?{totalGames:st.totalGames,bb:st.bb,rb:st.rb,grape:st.grape}:null;x.actionHistory=Array.isArray(raw?.actionHistory)?raw.actionHistory.slice(-60).filter(h=>h&&typeof h==='object'&&Number.isFinite(h.totalGames)&&Array.isArray(h.counters)):[];return normalizeGames(x);}
function load(){try{const rawText=[KEY,'jugglerMultiData_v8','jugglerMultiData_v7','jugglerMultiData_v6','jugglerMultiData_v5'].map(k=>localStorage.getItem(k)).find(v=>v!==null);if(rawText===undefined)return;const raw=JSON.parse(rawText);if(!raw||typeof raw!=='object'||!raw.appData||!['A','B','C'].every(k=>raw.appData[k]&&typeof raw.appData[k]==='object'))throw Error('保存データの形式が不正です');const restored=root();restored.currentTab=['A','B','C'].includes(raw.currentTab)?raw.currentTab:'A';restored.analysisMode=raw.analysisMode==='session'?'session':'machine';restored.dark=!!(raw.dark??raw.isDark);['A','B','C'].forEach(k=>restored.appData[k]=migrate(raw.appData[k]));state=restored;storageErrorMessage='';}catch(error){console.warn('load',error);storageErrorMessage='⚠ 保存データを読み込めません。バックアップがあれば復元してください';}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageErrorMessage='';}catch(error){console.error('保存失敗',error);storageErrorMessage='⚠ 保存できません。ストレージ設定・空き容量を確認してください';}$('save-status').textContent=storageErrorMessage||'✓ 自動保存済み';$('counter-note').textContent=state.analysisMode==='machine'?'着席前の内訳が不明なため各カウント確率は「—」で表示します。':'各カウントの確率は自分の実戦Gで計算します。';return !storageErrorMessage;}
function cat(category,x=d()){return x.counters.filter(c=>c.category===category).reduce((s,c)=>s+c.count,0);}
function byKey(key,x=d()){return x.counters.find(c=>c.key===key)?.count||0;}
function p(g,c){return g&&c?'1/'+(g/c).toFixed(2):'1/---';}
function met(mode=state.analysisMode,x=d()){const bb=cat('BB',x),rb=cat('RB',x);return mode==='machine'?{g:x.totalGames,bb:x.startSnapshot.bb+bb,rb:x.startSnapshot.rb+rb}:{g:session(x),bb,rb};}
function snap(){const x=d();return {totalGames:x.totalGames,counters:C(x.counters),startSnapshot:C(x.startSnapshot),sessionStarted:x.sessionStarted,grapeIncluded:x.grapeIncluded!==false,grapeStart:x.grapeStart?C(x.grapeStart):null,series:x.series,machineNo:x.machineNo};}
function restore(s){const x=d();x.totalGames=N(s.totalGames);x.counters=C(s.counters);if(s.startSnapshot)x.startSnapshot=C(s.startSnapshot);if(typeof s.sessionStarted==='boolean')x.sessionStarted=s.sessionStarted;if(typeof s.grapeIncluded==='boolean')x.grapeIncluded=s.grapeIncluded;x.grapeStart=s.grapeStart?C(s.grapeStart):null;if(typeof s.series==='string')x.series=s.series;if(typeof s.machineNo==='string')x.machineNo=s.machineNo;normalizeGames(x);}
function commit(fn){const x=d(),before=snap();fn(x);normalizeGames(x);if(JSON.stringify(before)!==JSON.stringify(snap())){x.actionHistory.push(before);if(x.actionHistory.length>60)x.actionHistory.shift();save();}render();}
let tintTimer=null,statusTimer=null;
function feedback(mode,card,changed=true,name=''){if(!changed)return;const overlay=$('tap-flash'),undo=mode==='undo';overlay.classList.remove('add','subtract','neutral','visible');document.body.classList.remove('feedback-add','feedback-subtract');document.body.classList.add(undo?'feedback-neutral':mode==='add'?'feedback-add':'feedback-subtract');$('tap-status').textContent=undo?'1つ戻しました':`${name} ${mode==='add'?'+1':'-1'}`;if(card)card.classList.remove('feedback-add','feedback-subtract');void overlay.offsetWidth;overlay.classList.add(undo?'neutral':mode,'visible');if(card&&!undo)card.classList.add(mode==='add'?'feedback-add':'feedback-subtract');clearTimeout(tintTimer);clearTimeout(statusTimer);tintTimer=setTimeout(()=>{overlay.classList.remove('visible','add','subtract','neutral');document.body.classList.remove('feedback-add','feedback-subtract','feedback-neutral');},130);statusTimer=setTimeout(()=>{$('tap-status').textContent='';if(card)card.classList.remove('feedback-add','feedback-subtract');},350);}
function toast(message){
  const overlay=$('tap-flash');
  clearTimeout(tintTimer);
  clearTimeout(statusTimer);
  overlay.classList.remove('add','subtract','neutral','visible');
  overlay.classList.add('neutral','visible');
  $('tap-status').textContent=message;
  statusTimer=setTimeout(()=>{
    overlay.classList.remove('neutral','visible');
    $('tap-status').textContent='';
  },900);
}
function tap(id,card){const mode=countMode;let changed=false;const name=d().counters.find(q=>q.id===id)?.name||'カウント';commit(x=>{const c=x.counters.find(q=>q.id===id);if(!c)return;if(mode==='subtract'){if(c.count>0){c.count--;changed=true;}}else if(c.count<Number.MAX_SAFE_INTEGER){c.count++;changed=true;}});if(!changed){toast(mode==='subtract'?'0回より減らせません':'これ以上加算できません');return;}const liveCard=[...document.querySelectorAll('[data-tap]')].find(el=>el.dataset.tap===id)||null;feedback(mode,liveCard,true,name);}
function undo(){const s=d().actionHistory.pop();if(!s)return;restore(s);save();render();feedback('undo',null,true,'');}
function resetSessionData(x,started){const definitions=x.counters.map(c=>({id:c.id,key:c.key,category:c.category,name:c.name}));x.startSnapshot={totalGames:0,bb:0,rb:0};x.totalGames=0;x.counters=definitions.map(c=>({...c,count:0}));x.actionHistory=[];x.sessionStarted=started;x.grapeStart=started?grapeBaseline(x):null;}
function saveSnapshot(){const fields=['start-total-input','start-bb-input','start-rb-input'].map(id=>$(id).value);if(fields.some(v=>parseInput(v)===null)){alert('着席時の数値は0以上の整数を入力してください。');return;}const x=d(),total=N(fields[0]),startB=N(fields[1]),startR=N(fields[2]),hasProgress=session(x)>0||x.counters.some(c=>c.count>0);if(startB+startR>total){alert('着席時のBIG・REG回数が総回転数を超えています。');return;}if(hasProgress&&total>x.totalGames){alert('着席時G数は現在の総回転を超えられません。実戦データは変更していません。');return;}commit(y=>{y.startSnapshot={totalGames:total,bb:N(fields[1]),rb:N(fields[2])};if(!hasProgress){y.totalGames=total;y.grapeStart=grapeBaseline(y);}y.sessionStarted=true;});countMode='add';$('snapshot-dialog').close();}
// Record the moment Grape counting starts, keeping the existing counter values.
function grapeBaseline(x=d()){
  return {totalGames:x.totalGames,bb:cat('BB',x),rb:cat('RB',x),grape:byKey('grape',x)};
}
function grapeWindow(x=d()){
  const start=x.grapeStart;
  if(!start||!['totalGames','bb','rb','grape'].every(k=>Number.isSafeInteger(start[k])&&start[k]>=0))return null;
  const games=x.totalGames-start.totalGames;
  const bb=cat('BB',x)-start.bb,rb=cat('RB',x)-start.rb,grapes=byKey('grape',x)-start.grape;
  if(start.totalGames<x.startSnapshot.totalGames||games<0||bb<0||rb<0||grapes<0||
    start.bb+start.rb>start.totalGames-x.startSnapshot.totalGames||
    bb+rb+grapes>games)return null;
  return {games,bb,rb,grapes,start};
}
function startGrapeNow(){
  const x=d(),existing=x.grapeStart;
  if(existing&&(x.totalGames>existing.totalGames||byKey('grape',x)>existing.grape)&&!confirm('ぶどう計測を現在の総回転から再開始しますか？ 記録済みのぶどう回数は残りますが、以前の区間は推測に使わなくなります。'))return;
  commit(y=>{y.grapeStart=grapeBaseline(y);y.grapeIncluded=true;});
}
function grapeFromSessionStart(){
  const x=d();
  if(x.grapeStart||!x.sessionStarted||x.totalGames<x.startSnapshot.totalGames)return;
  const g=session(x),bb=cat('BB',x),rb=cat('RB',x),grape=byKey('grape',x);
  if(bb+rb+grape>g){alert('実戦Gよりボーナスとぶどうの合計が多いため、計測開始位置を確定できません。');return;}
  if(!confirm('実戦開始時から全ゲームのぶどうを漏れなく数えましたか？ 「OK」の場合だけ、着席時のGから統計計算します。'))return;
  commit(y=>{y.grapeStart={totalGames:y.startSnapshot.totalGames,bb:0,rb:0,grape:0};y.grapeIncluded=true;});
}
function saveTotal(){const raw=$('total-edit-input').value,value=parseInput(raw);if(value===null||value<d().startSnapshot.totalGames){$('total-edit-error').hidden=false;return;}commit(x=>x.totalGames=value);$('total-dialog').close();}
function rates(values){return values.map(v=>1/v);}
function monotonic(values){const r=rates(values);return r.every((v,i)=>!i||v>=r[i-1]);}
function badge(current,values){if(!current||!monotonic(values))return '';const r=rates(values),cr=1/current;if(!r.every((v,i)=>!i||v>=r[i-1]))return '<span class="badge">単純比較不可</span>';if(cr<r[0])return '<span class="badge">設定1未満</span>';if(cr>=r[5])return '<span class="badge">設定6基準以上</span>';let i=0;for(;i<5&&cr>=r[i+1];i++);return '<span class="badge">設定'+(i+1)+'基準以上</span>';}
function groups(values,decimals){const map=new Map();values.forEach((v,i)=>{if(!map.has(v))map.set(v,[]);map.get(v).push(i+1);});return [...map].map(([value,ids])=>`<span class="parameter-label" style="left:${parameterScale(value,values)}%"><b>設${ids.join('・')}</b><small>1/${value.toFixed(decimals)}</small></span>`).join('');}
function parameterScale(denominator,values){const r=rates(values),lo=Math.min(...r),hi=Math.max(...r);return hi===lo?50:Math.max(0,Math.min(100,((1/denominator-lo)/(hi-lo))*100));}
function parameter(name,current,values,note){if(!values?.length)return `<div class="parameter"><strong>${name}</strong>　${current?'現在 1/'+current.toFixed(2):'<span class="unavailable">—</span>'}<br><small>設定別基準値は未公表（カウントは可能）</small></div>`;const dec=name==='ぶどう'?2:1,base=values.map(v=>'1/'+v.toFixed(dec)).join(' / ');if(!monotonic(values))return `<div class="parameter"><strong>${name}</strong>　${current?'1/'+current.toFixed(2):'<span class="unavailable">'+(note==='算出不可'?'算出不可':'-')+'</span>'}<br><small>${current?'単純比較不可':'算出不可'} / 各設定値を一覧表示</small><div class="parameter-fallback">${base}</div></div>`;const r=rates(values),lo=Math.min(...r),hi=Math.max(...r),cr=current?1/current:null,pos=cr===null?null:Math.max(0,Math.min(100,hi===lo?50:((cr-lo)/(hi-lo))*100)),markers=values.map(v=>`<i style="left:${parameterScale(v,values)}%"></i>`).join('');return `<div class="parameter"><strong>${name}</strong>　${current?'現在 1/'+current.toFixed(2)+' '+badge(current,values):'<span class="unavailable">'+(note==='算出不可'?'算出不可':'-')+'</span>'}<div class="parameter-track">${markers}${pos===null?'':`<b style="left:${pos}%">▲</b>`}</div><div class="parameter-labels">${groups(values,dec)}</div></div>`;}
// Reference-only comparison: multinomial BB/RB likelihood with equal setting priors.
// Log-likelihood differences are stable without multiplying tiny probabilities.
// Compare mutually exclusive BB/RB/grape/other outcomes on a counted session.
// Historical pre-seat games are a separate BB/RB/other segment without grape data.
// Reference grape rates are estimates rather than manufacturer-published values.
// Two explicitly disjoint observation periods: before and after grape measurement begins.
// Previous grape counts are excluded; BB/RB remain in the full-session/machine estimate.
function settingLikelihood(spec,observation){
  const {g,bb,rb}=observation,valid=n=>Number.isSafeInteger(n)&&n>=0;
  if(![g,bb,rb].every(valid)||g<1000||bb+rb>g)return null;
  if(!Array.isArray(spec?.bb)||!Array.isArray(spec?.rb)||spec.bb.length!==6||spec.rb.length!==6)return null;
  const w=observation.grapeWindow;
  const withGrape=observation.includeGrape===true&&w&&Array.isArray(spec.grape)&&spec.grape.length===6;
  let beforeG=g,beforeBB=bb,beforeRB=rb;
  if(withGrape){
    if(![w.games,w.bb,w.rb,w.grapes].every(valid)||w.games<=0||w.bb+w.rb+w.grapes>w.games||
      w.games>g||w.bb>bb||w.rb>rb)return null;
    beforeG=g-w.games;beforeBB=bb-w.bb;beforeRB=rb-w.rb;
    if(beforeBB+beforeRB>beforeG)return null;
  }
  const scores=spec.bb.map((_,i)=>{
    const pBB=1/spec.bb[i],pRB=1/spec.rb[i];
    const segment=(games,big,reg,grape,tracked)=>{
      const pGrape=tracked?1/spec.grape[i]:0,other=games-big-reg-grape,pOther=1-pBB-pRB-pGrape;
      if(!(pBB>0&&pRB>0&&pOther>0)||tracked&&!(pGrape>0)||other<0)return NaN;
      return big*Math.log(pBB)+reg*Math.log(pRB)+(tracked&&grape?grape*Math.log(pGrape):0)+other*Math.log(pOther);
    };
    if(!withGrape)return segment(g,bb,rb,0,false);
    return segment(beforeG,beforeBB,beforeRB,0,false)+segment(w.games,w.bb,w.rb,w.grapes,true);
  });
  if(scores.some(v=>!Number.isFinite(v)))return null;
  const peak=Math.max(...scores),raw=scores.map(v=>Math.exp(v-peak)),total=raw.reduce((a,b)=>a+b,0);
  return total>0?raw.map(v=>v/total):null;
}
// Wilson score interval for a measured grape rate, assuming complete sampling.
function grapeWilson95(hits,games){
  if(!Number.isSafeInteger(games)||games<=0||!Number.isSafeInteger(hits)||hits<0||hits>games)return null;
  const z=1.959963984540054,p=hits/games,z2=z*z,den=1+z2/games;
  const mid=(p+z2/(2*games))/den;
  const half=z*Math.sqrt(p*(1-p)/games+z2/(4*games*games))/den;
  return {low:Math.max(0,mid-half),high:Math.min(1,mid+half)};
}
function grapeIntervalHtml(hits,games){
  const range=grapeWilson95(hits,games);
  if(!range)return '';
  const asRate=p=>p>1e-12?'1/'+(1/p).toFixed(2):'0%';
  const observed=hits===0?'0%':asRate(hits/games);
  return '<p class="grape-interval">🍇 実測 '+observed+'（'+hits+'回 / '+games+'G）<small>ぶどう出現率の95% Wilson区間：'+asRate(range.low)+' ～ '+asRate(range.high)+'。全ゲームを数えた場合の統計的な誤差の目安で、設定の信頼区間ではありません。</small></p>';
}
function likelihoodHtml(spec,observation){
  const {g,bb,rb}=observation,valid=n=>Number.isSafeInteger(n)&&n>=0;
  const title='<h3 class="likelihood-title">設定別の統計比較（BIG・REG・ぶどう）</h3>';
  if(![g,bb,rb].every(valid)||bb+rb>g)
    return '<section class="likelihood">'+title+'<p class="parameter-note">総回転とボーナス回数に矛盾があります。</p></section>';
  const x=d(),window=grapeWindow(x),sample=window?window.grapes:0;
  const hasRates=Array.isArray(spec.grape)&&spec.grape.length===6;
  const canUse=!!window&&window.games>0&&hasRates,include=canUse&&x.grapeIncluded!==false;
  const start=x.grapeStart;
  const control='<div class="grape-tracking"><p>🍇 '+(!start?'計測区間が未設定です。ぶどうを数え始める時点の総Gを登録してください。':
    window?'計測開始 '+start.totalGames+'G → 現在 '+x.totalGames+'G（対象 '+window.games+'G・ぶどう '+sample+'回）':
    '計測開始後にG・ボーナス・ぶどうの整合性が取れません。計測開始位置を修正してください。')+'</p>'+
    '<button type="button" data-grape-start="1">'+(!start?'ここからぶどう計測を開始':'この総Gから計測を再開始')+'</button>'+(!start&&byKey('grape',x)>0&&x.sessionStarted?'<button type="button" data-grape-session-start="1" class="grape-retroactive">実戦開始からすべて計測済みとして設定</button>':'')+'</div>';
  const toggle=canUse?'<button type="button" class="grape-toggle" data-grape-toggle="1" aria-pressed="'+include+'">🍇 ぶどう：'+(include?'統計に含める ✓':'統計から除外')+'</button>':
    '<p class="parameter-note">ぶどうの計測Gが未確定または0Gのため、統計にはまだ反映しません。記録した実測値は保持されます。</p>';
  if(g<1000)return '<section class="likelihood">'+title+control+toggle+'<p class="parameter-note">'+g+'G：1,000G未満のため相対スコアを表示しません。</p></section>';
  const selected={...observation,grapeWindow:window,includeGrape:include};
  const values=settingLikelihood(spec,selected);
  if(!values)return '<section class="likelihood">'+title+control+toggle+'<p class="parameter-note">BIG・REG・ぶどうと対象Gが一致しません。入力を確認してください。</p></section>';
  const rows=values.map((p,i)=>'<div class="likelihood-row"><span>設定'+(i+1)+'</span><div class="likelihood-track"><i style="width:'+(100*p).toFixed(2)+'%"></i></div><strong>'+(100*p).toFixed(1)+'%</strong></div>').join('');
  const noGrape=canUse?settingLikelihood(spec,{...selected,includeGrape:false}):null;
  const high=p=>(100*p.slice(3).reduce((a,b)=>a+b,0)).toFixed(1);
  const impact=include&&noGrape?'<p class="grape-impact">設定4〜6の相対スコア合計：🍇込み <b>'+high(values)+'%</b> ／ ぶどう抜き <b>'+high(noGrape)+'%</b><small>設定確率ではなく、参考ぶどう値を加えた影響の目安です。</small></p>':'';
  const sampleRange=canUse?grapeIntervalHtml(sample,window.games):'';
  const alternate=include&&spec.grapeAlternative?.values?.length===6?
    settingLikelihood({...spec,grape:spec.grapeAlternative.values},selected):null;
  const alternativeNote=alternate?'<p class="grape-alternative">🍇 異なる参考値での設定4〜6スコア：採用値 '+high(values)+'% ／ 別資料 '+high(alternate)+'%<small>'+esc(spec.grapeAlternative.label)+'。いずれもメーカー非公表の参考値。</small></p>':'';
  const source=spec.grapeStatus?'<p class="parameter-note">🍇 '+esc(spec.grapeStatus)+'</p>':'';
  const caution='BIG・REGはメーカー公表値、ぶどうは参考推定値です。計測前はBIG・REG・その他、計測後はBIG・REG・ぶどう・その他として別区間で計算。各設定を等しい割合と仮定した近似値であり、実際に設定が投入された確率ではありません。';
  return '<section class="likelihood">'+title+control+toggle+source+sampleRange+'<p class="parameter-note">'+g+'G / BIG '+bb+'回 / REG '+rb+'回</p>'+rows+impact+alternativeNote+'<p class="likelihood-caution">'+caution+'</p></section>';
}
function comparisonHtml(){const x=d(),s=specs.find(q=>q.name===x.series),machine=state.analysisMode==='machine',m=met(state.analysisMode),own=met('session');if(!s)return '<p class="parameter-note">機種スペックを確認できないため、設定別の比較は表示できません。カウント記録は継続できます。</p>';const lowSample=m.g>0&&m.g<1000?'<p class="parameter-note">⚠ '+m.g+'Gの実測値はブレが大きく、設定推測の根拠としては不十分です。</p>':'';return '<p class="parameter-note">実測値は設定を断定しません。BIG・REG・合算はメーカー公表値、ぶどう・単独BIG/REGは出典未検証の参考値です。</p>'+lowSample+likelihoodHtml(s,{...m,mode:state.analysisMode,grape:byKey('grape',x),sessionG:own.g,sessionBB:own.bb,sessionRB:own.rb,startG:x.startSnapshot.totalGames,startBB:x.startSnapshot.bb,startRB:x.startSnapshot.rb})+parameter('ぶどう',(grapeWindow(x)?.grapes>0?grapeWindow(x).games/grapeWindow(x).grapes:null),s.grape,grapeWindow(x)?'計測開始以降の実測':'算出不可')+parameter('ボーナス合算',m.bb+m.rb?m.g/(m.bb+m.rb):null,s.total,machine?'台全体':'自分の実戦')+parameter('合算BIG',m.bb?m.g/m.bb:null,s.bb,machine?'台全体':'自分の実戦')+parameter('合算REG',m.rb?m.g/m.rb:null,s.rb,machine?'台全体':'自分の実戦')+parameter('単独BIG',machine?null:(byKey('solo_bb',x)?own.g/byKey('solo_bb',x):null),s.solo_bb,machine?'算出不可':'自分の実戦')+parameter('単独REG',machine?null:(byKey('solo_rb',x)?own.g/byKey('solo_rb',x):null),s.solo_rb,machine?'算出不可':'自分の実戦');}
function settings(){const x=d();$('series-input').replaceChildren(...specs.map(s=>{const o=document.createElement('option');o.value=s.name;o.textContent=s.name;o.selected=x.series===s.name;return o;}));$('machine-input').value=x.machineNo;$('start-total-input').value=x.startSnapshot.totalGames;$('start-bb-input').value=x.startSnapshot.bb;$('start-rb-input').value=x.startSnapshot.rb;const row=c=>`<div class="setting-counter"><label>${esc(c.name)}<input data-count="${esc(c.id)}" value="${c.count}" inputmode="numeric"></label><button type="button" data-name="${esc(c.id)}">名称</button>${isCoreCounter(c)?'<span></span>':`<button type="button" class="remove" data-del="${esc(c.id)}">削除</button>`}</div>`;$('total-input').value=x.totalGames;$('counter-settings').innerHTML='<h3>基本カウンター（順番固定）</h3>'+x.counters.filter(isCoreCounter).map(row).join('')+'<h3>カスタム項目</h3>'+x.counters.filter(c=>!isCoreCounter(c)).map(row).join('');}
function render(){const x=d(),own=met('session'),active=met(state.analysisMode),machine=state.analysisMode==='machine';$('save-status').textContent=storageErrorMessage||'✓ 自動保存済み';$('spec-load-status').textContent=specLoadError?'⚠ 機種スペックを読み込めません。通信状態を確認して再読み込みしてください。':'';document.body.classList.toggle('dark',state.dark);document.body.classList.toggle('mode-machine',machine);document.body.classList.toggle('mode-session',!machine);document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab===state.currentTab;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.analysisMode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.analysisMode));});$('machine-number').textContent=x.machineNo?'台番号 '+x.machineNo:'台番号 未入力';$('start-card').hidden=x.sessionStarted;$('counter-note').textContent=machine?'着席前の内訳が不明なため各カウント確率は「—」で表示します。':'各カウントの確率は自分の実戦Gで計算します。';$('snapshot-summary').hidden=!x.sessionStarted;$('snapshot-text').textContent=`着席 ${x.startSnapshot.totalGames}G / B${x.startSnapshot.bb} / R${x.startSnapshot.rb}`;$('total-display').textContent=x.totalGames+' G';$('agg-bb').textContent=p(active.g,active.bb);$('agg-rb').textContent=p(active.g,active.rb);$('agg-total').textContent=p(active.g,active.bb+active.rb);$('undo-button').disabled=!x.actionHistory.length;$('undo-button').setAttribute('aria-label',x.actionHistory.length?'最後の操作を取り消す':'取り消せる操作はありません');$('add-mode').setAttribute('aria-pressed',String(countMode==='add'));$('subtract-mode').setAttribute('aria-pressed',String(countMode==='subtract'));$('theme-toggle').textContent=state.dark?'☀️':'🌙';$('theme-toggle').setAttribute('aria-label',state.dark?'ライトモードに切り替える':'ダークモードに切り替える');$('add-mode').classList.toggle('active',countMode==='add');$('subtract-mode').classList.toggle('subtract-active',countMode==='subtract');const card=c=>{const box=document.createElement('div');box.className='counter-card';const main=document.createElement('button');main.className='counter counter-main';main.dataset.tap=c.id;main.setAttribute('aria-label',`${c.name} 現在${c.count}回、${countMode==='add'?'1回加算':'1回減算'}`);main.innerHTML=`<span>${esc(c.name)}</span><b>${c.count}</b><small>確率 ${machine?'—':p(own.g,c.count)}</small>`;const edit=document.createElement('button');edit.className='counter-edit';edit.dataset.editCard=c.id;edit.setAttribute('aria-label',c.name+'を編集');edit.textContent='✎';box.append(main,edit);return box;};$('counter-grid').replaceChildren(...CORE.map(core=>card(x.counters.find(q=>q.key===core.key))));const custom=x.counters.filter(c=>!isCoreCounter(c));$('custom-grid').replaceChildren(...custom.map(card));$('custom-section').hidden=!custom.length;if(custom.length)$('custom-summary').textContent='追加項目（'+custom.length+'）';$('main-compare-content').innerHTML=comparisonHtml();settings();}
function spec(){const s=specs.find(q=>q.name===d().series);if(!s)return;$('spec-title').textContent='📖 '+s.name+' スペック一覧';const value=(key,i,dec=1)=>Number.isFinite(s[key]?.[i])?'1/'+s[key][i].toFixed(dec):'未公表';$('spec-content').innerHTML='<p class="parameter-note">BIG・REG・合算は北電子の公表値。ぶどう・単独BIG/REGは参考値（出典未検証）です。未公表の項目は推定値で補っていません。</p><table><tr><th>設定</th><th>ぶどう※</th><th>単独BIG※</th><th>合算BIG</th><th>単独REG※</th><th>合算REG</th><th>合算</th></tr>'+s.bb.map((_,i)=>`<tr><td>${i+1}</td><td>${value('grape',i,2)}</td><td>${value('solo_bb',i)}</td><td>${value('bb',i)}</td><td>${value('solo_rb',i)}</td><td>${value('rb',i)}</td><td>${value('total',i)}</td></tr>`).join('')+'</table>';$('spec-dialog').showModal();}
function backupMessage(msg){const el=$('backup-message');if(el)el.textContent=msg;}
function downloadBackup(){try{const data={format:'juggler-counter-backup-v1',exportedAt:new Date().toISOString(),data:C(state)};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='juggler-counter-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);backupMessage('バックアップを作成しました。iPhoneの「ファイル」に保存してください。');}catch(error){console.error('backup export',error);backupMessage('バックアップを作成できませんでした。');}}
function validateBackup(payload){if(payload?.format!=='juggler-counter-backup-v1'||!payload.data||payload.data.version!==V)throw Error('このアプリのバックアップではありません');const raw=payload.data;if(!raw.appData||!['A','B','C'].every(k=>raw.appData[k]&&typeof raw.appData[k]==='object'))throw Error('A〜C台のデータが不足しています');const next=root();next.currentTab=['A','B','C'].includes(raw.currentTab)?raw.currentTab:'A';next.analysisMode=raw.analysisMode==='session'?'session':'machine';next.dark=!!raw.dark;const valid=n=>Number.isSafeInteger(n)&&n>=0;for(const k of ['A','B','C']){const x=raw.appData[k];if(!valid(x.totalGames)||!Array.isArray(x.counters)||x.counters.length>250||typeof x.series!=='string'||x.series.length>100)throw Error('台'+k+'のデータが不正です');const ss=x.startSnapshot;if(!ss||!['totalGames','bb','rb'].every(key=>valid(ss[key]))||ss.totalGames>x.totalGames)throw Error('台'+k+'の着席時データが不正です');if(!x.counters.every(c=>c&&typeof c==='object'&&valid(c.count)&&typeof c.name==='string'&&c.name.length<=100))throw Error('台'+k+'のカウンターが不正です');next.appData[k]=migrate(x)}return next;}
async function importBackup(input){const file=input.files?.[0];if(!file)return;try{if(file.size>2000000)throw Error('ファイルは2MB以下にしてください');const next=validateBackup(JSON.parse(await file.text()));if(!confirm('台A〜Cの現在のデータをバックアップで上書きします。続けますか？')){backupMessage('復元をキャンセルしました。');return;}localStorage.setItem(KEY,JSON.stringify(next));storageErrorMessage='';state=next;countMode='add';editingCounterId=null;render();$('save-status').textContent='✓ 復元データを保存済み';backupMessage('復元しました。');}catch(error){console.error('backup import',error);backupMessage('復元できませんでした：'+error.message);}finally{input.value='';}}
function onClick(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.tap)return tap(b.dataset.tap,b);if(b.dataset.grapeStart)return startGrapeNow();if(b.dataset.grapeSessionStart)return grapeFromSessionStart();if(b.dataset.grapeToggle)return commit(x=>x.grapeIncluded=x.grapeIncluded===false);if(b.dataset.tab){state.currentTab=b.dataset.tab;countMode='add';save();return render();}if(b.dataset.mode){state.analysisMode=b.dataset.mode;save();return render();}if(b.dataset.games)return commit(x=>x.totalGames=Math.min(Number.MAX_SAFE_INTEGER,Math.max(x.startSnapshot.totalGames,x.totalGames+Number(b.dataset.games))));if(b.id==='settings-open')return $('settings-dialog').showModal();if(b.id==='backup-export')return downloadBackup();if(b.id==='theme-toggle'){state.dark=!state.dark;save();return render();}if(b.id==='add-mode'||b.id==='subtract-mode'){countMode=b.id==='add-mode'?'add':'subtract';return render();}if(b.id==='undo-button')return undo();if(b.id==='start-zero'){const current=d(),hasData=current.totalGames>0||current.counters.some(c=>c.count>0);if(hasData&&!confirm('既存のカウントを消して0Gから開始しますか？'))return;resetSessionData(current,true);countMode='add';save();return render();}if(b.id==='start-mid'||b.id==='snapshot-edit')return $('snapshot-dialog').showModal();if(b.id==='delete-data'&&confirm('この台のデータを削除しますか？')){resetSessionData(d(),false);save();return render();}if(b.id==='snapshot-save')return saveSnapshot();if(b.id==='total-display'||b.id==='total-edit'){$('total-edit-input').value=d().totalGames;$('total-edit-error').hidden=true;return $('total-dialog').showModal();}if(b.id==='total-edit-save')return saveTotal();if(b.dataset.editCard){editingCounterId=b.dataset.editCard;const c=d().counters.find(q=>q.id===editingCounterId);$('count-dialog-title').textContent=c.name+'の回数';$('count-edit-input').value=c.count;$('count-edit-error').hidden=true;return $('count-dialog').showModal();}if(b.id==='count-edit-save'){const v=$('count-edit-input').value;if(parseInput(v)===null)return $('count-edit-error').hidden=false;commit(x=>x.counters.find(q=>q.id===editingCounterId).count=N(v));return $('count-dialog').close();}if(b.dataset.name){const target=d().counters.find(q=>q.id===b.dataset.name);if(!target)return;const name=prompt('新しい名称を入力してください',target.name);if(name?.trim()&&name.trim()!==target.name)return commit(x=>{const c=x.counters.find(q=>q.id===target.id);if(c)c.name=name.trim().slice(0,30);});return;}if(b.dataset.del){const target=d().counters.find(q=>q.id===b.dataset.del);if(!target||isCoreCounter(target))return;if(confirm('「'+target.name+'」を削除しますか？'))return commit(x=>x.counters=x.counters.filter(q=>q.id!==target.id));return;}if(b.id==='add-counter'){const name=prompt('追加する項目の名称を入力してください');if(name?.trim()){const uid='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);return commit(x=>x.counters.push({id:uid,key:uid,category:'custom',name:name.trim().slice(0,30),count:0}));}}if(b.dataset.open==='spec')return spec();}
function onChange(e){if(e.target.id==='backup-import'){void importBackup(e.target);return;}if(e.target.id==='series-input'){const x=d(),newName=e.target.value;if(newName===x.series)return;const recorded=x.sessionStarted||x.totalGames>0||x.startSnapshot.totalGames>0||x.counters.some(c=>c.count>0);if(recorded&&!confirm('記録済みデータを残したまま機種名だけ変更しますか？ 別の台を開始する場合はキャンセルし、「この台のデータを削除」で新規開始してください。')){e.target.value=x.series;return;}return commit(y=>y.series=newName);}if(e.target.id==='machine-input')return commit(x=>x.machineNo=e.target.value.slice(0,30));if(e.target.id==='total-input'){const v=e.target.value,x=d();if(parseInput(v)===null||N(v)<x.startSnapshot.totalGames){alert('着席時G数以上の整数を入力してください。');e.target.value=x.totalGames;return;}return commit(y=>y.totalGames=N(v));}if(e.target.dataset.count){const v=e.target.value,c=d().counters.find(q=>q.id===e.target.dataset.count);if(!c)return;if(parseInput(v)===null){alert('カウントは0以上の整数を入力してください。');e.target.value=c.count;return;}return commit(x=>{const target=x.counters.find(q=>q.id===c.id);if(target)target.count=N(v);});}}
async function init(){
  load();
  // The counter is usable even when the specs request is slow or offline.
  document.addEventListener('click',onClick);
  document.addEventListener('change',onChange);
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(error=>console.warn('sw',error));
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      const notice=$('spec-load-status');
      if(notice&&!specLoadError)notice.textContent='更新が利用可能です。再読み込みで最新版になります。';
    });
  }
  render();
  try{
    const response=await fetch('./data/juggler-specs.json',{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const parsed=await response.json();
    if(!Array.isArray(parsed)||parsed.length<8||parsed.some(s=>typeof s.name!=='string'||!['bb','rb','total'].every(k=>Array.isArray(s[k])&&s[k].length===6&&s[k].every(v=>Number.isFinite(v)&&v>0))))throw Error('スペックファイルが不正です');
    specs=parsed;
    specLoadError=false;
  }catch(error){
    console.warn('specs',error);
    specLoadError=true;
    specs=[];
  }
  render();
}
init();
