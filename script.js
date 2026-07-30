'use strict';
const STORAGE_KEY = 'snowRouteDataV1';
const CHART_URL = './chart-periods.json';
const CALENDAR_URL = './calendar.json';

const TYPE = {
  digital:{icon:'🎧',label:'デジタル',day:'㊗️ 配信開始！',after:'リリースから'},
  cd:{icon:'💿',label:'CD',day:'㊗️ リリース！',after:'リリースから'},
  video:{icon:'📀',label:'DVD・Blu-ray',day:'㊗️ 発売日！',after:'発売から'},
  event:{icon:'🎯',label:'目標・イベント',day:'🎉 イベント当日！',after:'開催から'}
};

const COLORS = [
  ['default','デフォルト','#9bcce0'],
  ['yellow','💛 黄','#f4c542'],
  ['purple','💜 紫','#8a69b8'],
  ['white','🤍 白','#f2f2f2'],
  ['pink','🩷 ピンク','#e88dbb'],
  ['orange','🧡 オレンジ','#e59a43'],
  ['green','💚 緑','#55a86c'],
  ['black','🖤 黒','#30353a'],
  ['red','❤️ 赤','#cf4f5f'],
  ['blue','💙 青','#4c86d9'],
  ['custom','🎨 カスタム','#9bcce0']
];

const LEGACY_COLOR_KEYS = {
  group:'default',
  none:'default',
  hikaru:'yellow',
  fukazawa:'purple',
  raul:'white',
  watanabe:'blue',
  koji:'orange',
  abe:'green',
  meguro:'black',
  miyadate:'red',
  sakuma:'pink'
};

const DEFAULT_FIXED_EVENTS = [
  {m:1,d:22,type:'anniversary',label:'🎉 Snow Man デビュー記念日'},
  {m:5,d:3,type:'anniversary',label:'🎉 Snow Man 結成記念日'},
  {m:5,d:17,type:'birthday',label:'🎂 岩本照さんのお誕生日'},
  {m:5,d:5,type:'birthday',label:'🎂 深澤辰哉さんのお誕生日'},
  {m:6,d:27,type:'birthday',label:'🎂 ラウールさんのお誕生日'},
  {m:11,d:5,type:'birthday',label:'🎂 渡辺翔太さんのお誕生日'},
  {m:6,d:21,type:'birthday',label:'🎂 向井康二さんのお誕生日'},
  {m:11,d:27,type:'birthday',label:'🎂 阿部亮平さんのお誕生日'},
  {m:2,d:16,type:'birthday',label:'🎂 目黒蓮さんのお誕生日'},
  {m:3,d:25,type:'birthday',label:'🎂 宮舘涼太さんのお誕生日'},
  {m:7,d:5,type:'birthday',label:'🎂 佐久間大介さんのお誕生日'}
];

let fixedEvents = DEFAULT_FIXED_EVENTS;
let state = loadState();
let chartData = null;
let currentDetailId = null;

function defaultState(){
  return {
    dataVersion:1,
    projects:[],
    settings:{
      accent:'#5aa9ca',
      mode:'light',
      opening:'special',
      effect:true,
      lastOpeningDate:''
    }
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    return {...defaultState(), ...JSON.parse(raw)};
  }catch(e){
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function localDate(date=new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function parseDate(s){
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y,m-1,d);
}

function dayDiff(a,b){
  const x = new Date(a.getFullYear(),a.getMonth(),a.getDate());
  const y = new Date(b.getFullYear(),b.getMonth(),b.getDate());
  return Math.round((y-x)/86400000);
}

function addDays(d,n){
  const x = new Date(d);
  x.setDate(x.getDate()+n);
  return x;
}

function addMonths(d,n){
  const x = new Date(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth()+n);
  const max = new Date(x.getFullYear(),x.getMonth()+1,0).getDate();
  x.setDate(Math.min(day,max));
  return x;
}

function fmt(d){
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

function uid(prefix='id'){
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
}

function escapeHtml(v=''){
  return String(v).replace(/[&<>'"]/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}

function colorKey(p){
  const saved = p?.memberColor;
  return LEGACY_COLOR_KEYS[saved] || saved || 'default';
}

function memberColor(p){
  const key = colorKey(p);
  if(key === 'custom') return p.customColor || '#9bcce0';
  return (COLORS.find(x=>x[0]===key) || COLORS[0])[2];
}

function typeInfo(p){
  return TYPE[p.type] || TYPE.event;
}

function projectMilestones(p){
  const base = parseDate(p.baseDate);
  const now = parseDate(localDate());
  const info = typeInfo(p);
  const list = [];

  if((p.type==='cd' || p.type==='video') && p.showFlyingGet){
    list.push({
      key:'flying',
      label:'フラゲ日',
      date:addDays(base,-1),
      special:'🎉 フラゲ日！'
    });
  }

  list.push({
    key:'base',
    label:p.type==='event' ? 'イベント当日' : '発売・配信日',
    date:base,
    special:p.eventMessage || info.day
  });

  if(p.type!=='event'){
    list.push({key:'30',label:'30日',date:addDays(base,30),special:'🎉 リリース30日！'});
    list.push({key:'100',label:'100日',date:addDays(base,100),special:'💯 リリース100日！'});
    list.push({key:'half',label:'半年',date:addMonths(base,6),special:'🎉 リリース半年！'});
    list.push({key:'year',label:'1周年',date:addMonths(base,12),special:'🎂 リリース1周年！'});
  }

  return list
    .map(x=>({...x,diff:dayDiff(now,x.date)}))
    .sort((a,b)=>a.date-b.date);
}

function nextMilestone(p){
  const ms = projectMilestones(p);
  return ms.find(x=>x.diff>=0) || null;
}

function displayStatus(p){
  const now = parseDate(localDate());
  const base = parseDate(p.baseDate);
  const info = typeInfo(p);
  const milestones = projectMilestones(p);
  const today = milestones.find(x=>x.diff===0);

  if(today){
    return {
      kind:'special',
      message:today.special,
      sub:today.label,
      diff:0,
      date:today.date
    };
  }

  const next = milestones.find(x=>x.diff>0);

  if(next){
    if(next.diff===1){
      return {
        kind:'future',
        message:'明日！',
        sub:`${next.label}まで`,
        diff:1,
        date:next.date
      };
    }

    return {
      kind:'future',
      message:`あと ${next.diff} 日`,
      sub:`${next.label}まで`,
      diff:next.diff,
      date:next.date
    };
  }

  const elapsed = dayDiff(base,now);

  return {
    kind:'past',
    message:`${p.afterLabel || info.after}${elapsed}日`,
    sub:'',
    diff:999999,
    date:base
  };
}

function sortedProjects(list){
  return [...list].sort((a,b)=>{
    if(!!a.pinned!==!!b.pinned) return a.pinned ? -1 : 1;

    const sa = displayStatus(a);
    const sb = displayStatus(b);

    if(sa.kind==='special' && sb.kind!=='special') return -1;
    if(sb.kind==='special' && sa.kind!=='special') return 1;

    return sa.diff-sb.diff;
  });
}

function render(){
  applySettings();
  renderToday();

  const active = sortedProjects(state.projects.filter(p=>!p.archived));

  document.getElementById('archiveCount').textContent =
    state.projects.filter(p=>p.archived).length;

  renderHero(active);
  renderCards(active);
  renderArchive();
  maybeDailyOpening(active);
}

function renderToday(){
  const now = new Date();
  document.getElementById('todayDate').textContent = fmt(now);

  const events = getTodayEvents();
  const box = document.getElementById('specialBox');

  if(events.length){
    document.getElementById('specialList').innerHTML =
      events.slice(0,3)
        .map(e=>`<div class="special-item">${escapeHtml(e.label)}</div>`)
        .join('');

    box.classList.remove('hidden');
  }else{
    box.classList.add('hidden');
  }
}

function getTodayEvents(){
  const now = new Date();
  const m = now.getMonth()+1;
  const d = now.getDate();

  const fixed = fixedEvents.filter(e=>e.m===m && e.d===d);
  const project = [];

  state.projects
    .filter(p=>!p.archived)
    .forEach(p=>{
      projectMilestones(p)
        .filter(x=>x.diff===0)
        .forEach(x=>{
          project.push({
            type:'project',
            label:`${x.special} ${p.title}`
          });
        });
    });

  return [...project,...fixed];
}

function renderHero(active){
  const section = document.getElementById('heroSection');

  if(!active.length){
    section.classList.add('hidden');
    return;
  }

  const p = active[0];
  const s = displayStatus(p);
  const info = typeInfo(p);

  const count =
    s.kind==='future' && s.diff>1
      ? `<div class="hero-count"><span class="big">${s.diff}</span><span class="unit">日</span></div>`
      : `<div class="hero-message">${escapeHtml(s.message)}</div>`;

  const heroCard = document.getElementById('heroCard');
  heroCard.style.setProperty('--member-color',memberColor(p));
  heroCard.innerHTML = `
    ${pinHtml(p)}
    <div class="hero-label">次に近い節目</div>
    <div class="hero-sub hero-target">${escapeHtml(s.sub)}</div>
    ${count}
    <div class="hero-title">${info.icon} ${escapeHtml(p.title)}</div>
    ${badgesHtml(p)}
    ${quickLinksHtml(p)}
    <button class="text-btn" onclick="openDetail('${p.id}')" style="margin-top:10px">詳細を見る →</button>
  `;

  section.classList.remove('hidden');
}

function pinHtml(p){
  return p.pinned
    ? '<span class="card-pin" aria-label="ピン留め中">📌</span>'
    : '';
}

function badgesHtml(p){
  return `
    <div class="badges">
      ${p.active ? '<span class="badge hot">🔥 応援中</span>' : ''}
      <span class="badge">${typeInfo(p).label}</span>
    </div>
  `;
}

function quickLinksHtml(p){
  const links = (p.links || [])
    .filter(l=>l.showOnHome)
    .slice(0,3);

  if(!links.length) return '';

  return `
    <div class="quick-links">
      ${links.map(l=>`
        <a
          class="link-chip"
          href="${escapeHtml(l.url)}"
          target="_blank"
          rel="noopener"
          onclick="event.stopPropagation()"
        >${escapeHtml(l.label || '開く')}</a>
      `).join('')}
    </div>
  `;
}

function renderCards(active){
  const el = document.getElementById('projectList');

  if(!active.length){
    el.innerHTML = `
      <div class="empty">
        まだプロジェクトがありません。<br>
        右下のボタンから登録できます。
      </div>
    `;
    return;
  }

  el.innerHTML = active.map(p=>{
    const s = displayStatus(p);
    const info = typeInfo(p);

    let countdown = '';

    if(s.kind==='special'){
      countdown = `<div class="card-count special-count">${escapeHtml(s.message)}</div>`;
    }else if(s.kind==='future'){
      countdown = `
        <div class="card-count">
          ${s.diff===1 ? '明日！' : `あと${s.diff}日`}
        </div>
      `;
    }else{
      countdown = `<div class="card-count past-count">${escapeHtml(s.message)}</div>`;
    }

    return `
      <article
        class="card"
        style="--member-color:${memberColor(p)}"
        onclick="openDetail('${p.id}')"
      >
        ${pinHtml(p)}

        ${s.sub ? `<div class="card-target">${escapeHtml(s.sub)}</div>` : ''}
        ${countdown}

        <div class="card-title">${info.icon} ${escapeHtml(p.title)}</div>

        ${p.memo ? `<div class="card-note">${escapeHtml(p.memo)}</div>` : ''}
        ${badgesHtml(p)}
        ${quickLinksHtml(p)}
      </article>
    `;
  }).join('');
}

function renderArchive(){
  const list = state.projects.filter(p=>p.archived);
  const el = document.getElementById('archiveList');

  el.innerHTML = list.length
    ? list.map(p=>`
        <article class="card" style="--member-color:${memberColor(p)}">
          <div class="card-title">${typeInfo(p).icon} ${escapeHtml(p.title)}</div>
          <div class="card-sub">${fmt(parseDate(p.baseDate))}</div>
          <div class="btn-row" style="margin-top:12px">
            <button class="secondary" onclick="restoreProject('${p.id}')">元に戻す</button>
            <button class="danger" onclick="deleteProject('${p.id}')">削除</button>
          </div>
        </article>
      `).join('')
    : '<div class="empty">アーカイブは空です。</div>';
}

function openModal(id){
  document.getElementById(id).classList.add('open');
}

function closeModal(id){
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('[data-close]').forEach(b=>{
  b.addEventListener('click',()=>closeModal(b.dataset.close));
});

document.querySelectorAll('.modal-wrap').forEach(w=>{
  w.addEventListener('click',e=>{
    if(e.target===w) closeModal(w.id);
  });
});

function populateMembers(){
  document.getElementById('memberInput').innerHTML =
    COLORS.map(c=>`<option value="${c[0]}">${c[1]}</option>`).join('');
}

function defaultMessage(type){
  return TYPE[type].day;
}

function openEditor(id=''){
  const p = id ? state.projects.find(x=>x.id===id) : null;

  document.getElementById('editTitle').textContent =
    p ? 'プロジェクトを編集' : '新しいプロジェクト';

  document.getElementById('projectId').value = p?.id || '';
  document.getElementById('titleInput').value = p?.title || '';
  document.getElementById('typeInput').value = p?.type || 'digital';
  document.getElementById('dateInput').value = p?.baseDate || localDate();
  document.getElementById('memberInput').value = p ? colorKey(p) : 'default';
  document.getElementById('customColorInput').value = p?.customColor || '#9bcce0';
  document.getElementById('memoInput').value = p?.memo || '';
  document.getElementById('pinnedInput').checked = !!p?.pinned;
  document.getElementById('activeInput').checked = p ? !!p.active : true;
  document.getElementById('flyingInput').checked =
    p ? p.showFlyingGet!==false : true;
  document.getElementById('messageInput').value = p?.eventMessage || '';
  document.getElementById('afterLabelInput').value = p?.afterLabel || '';

  renderLinksEditor(p?.links || []);
  updateTypeFields();
  updateCustomColor();
  openModal('editModal');
}

function updateTypeFields(){
  const type = document.getElementById('typeInput').value;

  document.getElementById('flyingRow').classList.toggle(
    'hidden',
    !(type==='cd' || type==='video')
  );

  document.getElementById('messageInput').placeholder = defaultMessage(type);
}

function updateCustomColor(){
  document.getElementById('customColorField').classList.toggle(
    'hidden',
    document.getElementById('memberInput').value!=='custom'
  );
}

function renderLinksEditor(links){
  const box = document.getElementById('linksEditor');
  box.innerHTML = '';
  links.forEach(addLinkRow);
}

function addLinkRow(link={id:uid('link'),label:'',url:'',showOnHome:false}){
  const row = document.createElement('div');
  row.className = 'link-editor';
  row.dataset.id = link.id;

  row.innerHTML = `
    <div>
      <label>リンク名</label>
      <input
        class="link-label"
        type="text"
        value="${escapeHtml(link.label)}"
        placeholder="YouTube"
      >
    </div>

    <div>
      <label>URL</label>
      <input
        class="link-url"
        type="url"
        value="${escapeHtml(link.url)}"
        placeholder="https://..."
      >
    </div>

    <div class="link-editor-actions">
      <label style="margin:0;font-weight:400">
        <input
          class="link-home"
          type="checkbox"
          ${link.showOnHome ? 'checked' : ''}
        >
        ホームに表示
      </label>

      <button type="button" class="text-btn remove-link">削除</button>
    </div>
  `;

  row.querySelector('.remove-link').onclick = ()=>row.remove();
  document.getElementById('linksEditor').appendChild(row);
}

document.getElementById('projectForm').addEventListener('submit',e=>{
  e.preventDefault();

  const id = document.getElementById('projectId').value;
  const type = document.getElementById('typeInput').value;

  const links = [...document.querySelectorAll('.link-editor')]
    .map(r=>({
      id:r.dataset.id,
      label:r.querySelector('.link-label').value.trim(),
      url:r.querySelector('.link-url').value.trim(),
      showOnHome:r.querySelector('.link-home').checked
    }))
    .filter(l=>l.label || l.url);

  const p = {
    id:id || uid('project'),
    title:document.getElementById('titleInput').value.trim(),
    type,
    baseDate:document.getElementById('dateInput').value,
    memberColor:document.getElementById('memberInput').value,
    customColor:document.getElementById('customColorInput').value,
    memo:document.getElementById('memoInput').value.trim(),
    pinned:document.getElementById('pinnedInput').checked,
    active:document.getElementById('activeInput').checked,
    archived:id
      ? (state.projects.find(x=>x.id===id)?.archived || false)
      : false,
    showFlyingGet:document.getElementById('flyingInput').checked,
    eventMessage:
      document.getElementById('messageInput').value.trim() ||
      defaultMessage(type),
    afterLabel:
      document.getElementById('afterLabelInput').value.trim() ||
      TYPE[type].after,
    links,
    createdAt:id
      ? (state.projects.find(x=>x.id===id)?.createdAt || new Date().toISOString())
      : new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };

  if(id){
    state.projects = state.projects.map(x=>x.id===id ? p : x);
  }else{
    state.projects.push(p);
  }

  saveState();
  closeModal('editModal');
  render();
});

function openDetail(id){
  currentDetailId = id;

  const p = state.projects.find(x=>x.id===id);
  if(!p) return;

  const s = displayStatus(p);
  const milestones = projectMilestones(p);

  const links = (p.links || [])
    .map(l=>`
      <a
        class="link-chip"
        href="${escapeHtml(l.url)}"
        target="_blank"
        rel="noopener"
        onclick="event.stopPropagation()"
      >▶ ${escapeHtml(l.label || '開く')}</a>
    `)
    .join('');

  document.getElementById('detailContent').innerHTML = `
    <div
      class="panel detail-summary"
      style="border-left:7px solid ${memberColor(p)}"
    >
      ${pinHtml(p)}
      <div class="detail-muted">${typeInfo(p).icon} ${typeInfo(p).label}</div>
      <h2>${escapeHtml(p.title)}</h2>
      <div class="detail-count">${escapeHtml(s.message)}</div>
      <div class="detail-muted">${escapeHtml(s.sub)}</div>
      ${badgesHtml(p)}
    </div>

    <div class="panel">
      <h3>主な節目</h3>
      <ul class="milestones">
        ${milestones.map(m=>`
          <li class="${m.diff<0 ? 'done' : ''}">
            <span>
              ${m.diff<0 ? '✓' : '○'} ${escapeHtml(m.label)}<br>
              <small>${fmt(m.date)}</small>
            </span>
            <span>
              ${m.diff===0
                ? '今日'
                : m.diff>0
                  ? `あと${m.diff}日`
                  : `${Math.abs(m.diff)}日前`
              }
            </span>
          </li>
        `).join('')}
      </ul>
    </div>

    ${chartPanel(p)}

    ${links ? `
      <div class="panel">
        <h3>今できること</h3>
        <div class="quick-links">${links}</div>
      </div>
    ` : ''}

    ${p.memo ? `
      <div class="panel">
        <h3>メモ</h3>
        <p>${escapeHtml(p.memo).replace(/\n/g,'<br>')}</p>
      </div>
    ` : ''}

    <div class="btn-row">
      <button
        class="primary"
        onclick="closeModal('detailModal');openEditor('${p.id}')"
      >編集</button>

      <button
        class="secondary"
        onclick="archiveProject('${p.id}')"
      >アーカイブ</button>

      <button
        class="danger"
        onclick="deleteProject('${p.id}')"
      >削除</button>
    </div>
  `;

  openModal('detailModal');
}

function estimatedChartPeriod(year,org,period){
  const make = (start,end)=>({
    start,
    end,
    announced:false,
    estimated:true
  });

  if(period==='firstHalf'){
    return org==='billboard'
      ? make(`${year-1}-11-24`,`${year}-05-24`)
      : make(`${year-1}-12-08`,`${year}-06-07`);
  }

  return org==='billboard'
    ? make(`${year-1}-11-24`,`${year}-11-22`)
    : make(`${year-1}-12-08`,`${year}-12-06`);
}

function chartPeriod(year,org,period){
  return chartData?.years?.[year]?.[org]?.[period] ||
    estimatedChartPeriod(year,org,period);
}

function chartStatus(p,v){
  const release = parseDate(p.baseDate);
  const start = parseDate(v.start);
  const end = parseDate(v.end);
  const now = parseDate(localDate());

  if(release<start || release>end){
    return {included:false,text:'対象外'};
  }

  const left = dayDiff(now,end);

  if(left>0) return {included:true,text:`期間終了まで あと${left}日`};
  if(left===0) return {included:true,text:'期間最終日'};

  return {
    included:true,
    text:`対象期間終了（${Math.abs(left)}日前）`
  };
}

function chartPanel(p){
  if(p.type==='event') return '';

  const year = parseDate(p.baseDate).getFullYear();
  const rows = [];

  ['billboard','oricon'].forEach(org=>{
    ['firstHalf','annual'].forEach(period=>{
      const v = chartPeriod(year,org,period);

      const label =
        `${org==='billboard' ? 'Billboard' : 'オリコン'} ` +
        `${period==='firstHalf' ? '上半期' : '年間'}`;

      const st = chartStatus(p,v);

      rows.push(`
        <li class="chart-row ${st.included ? '' : 'done'}">
          <span>
            <strong>${label}</strong><br>
            <small>${v.start}〜${v.end}</small><br>
            <small>${escapeHtml(st.text)}</small>
          </span>

          <span class="status-tag ${v.announced ? 'official' : ''}">
            ${v.announced ? '確定' : '目安'}
          </span>
        </li>
      `);
    });
  });

  return `
    <div class="panel">
      <h3>チャート期間</h3>
      <p class="detail-muted chart-note">
        基準日が各集計期間に含まれるかを自動判定しています。
      </p>
      <ul class="milestones">${rows.join('')}</ul>
    </div>
  `;
}

function archiveProject(id){
  if(!confirm('このプロジェクトをアーカイブしますか？')) return;

  state.projects = state.projects.map(p=>
    p.id===id ? {...p,archived:true} : p
  );

  saveState();
  closeModal('detailModal');
  render();
}

function restoreProject(id){
  state.projects = state.projects.map(p=>
    p.id===id ? {...p,archived:false} : p
  );

  saveState();
  render();
}

function deleteProject(id){
  const p = state.projects.find(x=>x.id===id);

  if(
    !p ||
    !confirm(`「${p.title}」を削除しますか？\nこの操作は元に戻せません。`)
  ){
    return;
  }

  state.projects = state.projects.filter(x=>x.id!==id);
  saveState();
  closeModal('detailModal');
  render();
}

function applySettings(){
  document.documentElement.style.setProperty(
    '--accent-strong',
    state.settings.accent || '#5aa9ca'
  );

  document.body.classList.toggle(
    'dark',
    state.settings.mode==='dark'
  );

  document.querySelector('meta[name="theme-color"]').content =
    state.settings.accent || '#5aa9ca';
}

function openSettings(){
  document.getElementById('accentInput').value =
    state.settings.accent || '#5aa9ca';

  document.getElementById('modeInput').value =
    state.settings.mode || 'light';

  document.getElementById('openingInput').value =
    state.settings.opening || 'special';

  document.getElementById('effectInput').checked =
    state.settings.effect!==false;

  openModal('settingsModal');
}

function saveSettings(){
  state.settings.accent =
    document.getElementById('accentInput').value;

  state.settings.mode =
    document.getElementById('modeInput').value;

  state.settings.opening =
    document.getElementById('openingInput').value;

  state.settings.effect =
    document.getElementById('effectInput').checked;

  saveState();
  closeModal('settingsModal');
  render();
}

function maybeDailyOpening(active){
  const today = localDate();

  if(state.settings.lastOpeningDate===today) return;

  const events = getTodayEvents();

  const should =
    state.settings.opening==='daily' ||
    (state.settings.opening==='special' && events.length);

  state.settings.lastOpeningDate = today;
  saveState();

  if(!should) return;

  document.getElementById('dailyDate').textContent = fmt(new Date());

  document.getElementById('dailyEvents').innerHTML =
    events.length
      ? events.slice(0,3).map(e=>`<div>${escapeHtml(e.label)}</div>`).join('')
      : '<div>今日の予定を確認しましょう。</div>';

  const p = active[0];

  document.getElementById('dailyNext').innerHTML =
    p
      ? `次の予定<br><strong>${escapeHtml(displayStatus(p).message)}</strong><br>${escapeHtml(p.title)}`
      : '登録中のプロジェクトはありません。';

  document.getElementById('dailyOverlay').classList.add('open');

  if(events.length && state.settings.effect) startSnow();
}

function startSnow(){
  for(let i=0;i<24;i++){
    setTimeout(()=>{
      const s = document.createElement('div');

      s.className = 'snowflake';
      s.textContent = '❄';
      s.style.left = Math.random()*100+'vw';
      s.style.fontSize = (10+Math.random()*15)+'px';
      s.style.opacity = .35+Math.random()*.55;
      s.style.animationDuration = (2.5+Math.random()*2.5)+'s';

      document.body.appendChild(s);
      setTimeout(()=>s.remove(),5500);
    },i*70);
  }
}

function downloadJson(data,name){
  const blob = new Blob(
    [JSON.stringify(data,null,2)],
    {type:'application/json'}
  );

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();

  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function exportProject(id){
  const p = state.projects.find(x=>x.id===id);

  if(p){
    downloadJson(
      {
        dataVersion:1,
        kind:'snow-route-project',
        project:{...p,pinned:false,archived:false}
      },
      `snow-route-${p.title}.json`
    );
  }
}

function exportAll(){
  downloadJson(
    state,
    `snow-route-backup-${localDate()}.json`
  );
}

async function importAll(file){
  try{
    const data = JSON.parse(await file.text());

    if(!data || !Array.isArray(data.projects)){
      throw new Error('形式が違います');
    }

    if(confirm(
      '現在のデータに追加しますか？\n' +
      '「キャンセル」を選ぶと、現在のデータを置き換えます。'
    )){
      const ids = new Set(state.projects.map(p=>p.id));

      data.projects.forEach(p=>{
        state.projects.push(
          ids.has(p.id)
            ? {...p,id:uid('project')}
            : p
        );
      });
    }else{
      if(!confirm('現在のデータを置き換えます。よろしいですか？')){
        return;
      }

      state = {...defaultState(),...data};
    }

    saveState();
    render();
    alert('読み込みました。');
  }catch(e){
    alert('読み込みに失敗しました。JSONファイルを確認してください。');
  }
}

document.getElementById('newBtn').onclick = ()=>openEditor();
document.getElementById('settingsBtn').onclick = openSettings;
document.getElementById('archiveBtn').onclick = ()=>openModal('archiveModal');
document.getElementById('addLinkBtn').onclick = ()=>addLinkRow();
document.getElementById('typeInput').onchange = updateTypeFields;
document.getElementById('memberInput').onchange = updateCustomColor;
document.getElementById('saveSettingsBtn').onclick = saveSettings;
document.getElementById('exportAllBtn').onclick = exportAll;

document.getElementById('importAllInput').onchange = e=>{
  if(e.target.files[0]) importAll(e.target.files[0]);
  e.target.value = '';
};

document.getElementById('dailyClose').onclick = ()=>{
  document.getElementById('dailyOverlay').classList.remove('open');
};

window.openDetail = openDetail;
window.openEditor = openEditor;
window.closeModal = closeModal;
window.archiveProject = archiveProject;
window.restoreProject = restoreProject;
window.deleteProject = deleteProject;
window.exportProject = exportProject;

populateMembers();

Promise.all([
  fetch(CHART_URL)
    .then(r=>r.ok ? r.json() : null)
    .catch(()=>null),

  fetch(CALENDAR_URL)
    .then(r=>r.ok ? r.json() : null)
    .catch(()=>null)
]).then(([charts,calendar])=>{
  chartData = charts;

  if(calendar?.events && Array.isArray(calendar.events)){
    fixedEvents = calendar.events;
  }

  render();
});
