"use strict";
const STORAGE_KEY = 'snowRouteDataV1';
const CHART_URL = './calendar-periods.json';
const CALENDAR_URL = './calendar.json';
const DEFAULT_ACCENT = '#5aa9ca';

const TYPE = {
  digital:{icon:'🎧',label:'デジタル',day:'㊗️ 配信開始！',after:'リリースから'},
  cd:{icon:'💿',label:'CD',day:'㊗️ リリース！',after:'リリースから'},
  video:{icon:'📀',label:'DVD・Blu-ray',day:'㊗️ 発売日！',after:'発売から'},
  event:{icon:'🎯',label:'目標・イベント',day:'🎉 イベント当日！',after:'開催から'}
};

const DEFAULT_MILESTONE_VISIBILITY = {
  day30:true,
  day100:true,
  half:true,
  year:true
};

const COLORS = [
  ['default','デフォルト','#9bcce0'],
  ['yellow','黄','#f4c542'],
  ['purple','紫','#8a69b8'],
  ['white','白','#f2f2f2'],
  ['pink','ピンク','#e88dbb'],
  ['orange','オレンジ','#e59a43'],
  ['green','緑','#55a86c'],
  ['black','黒','#30353a'],
  ['red','赤','#cf4f5f'],
  ['blue','青','#4c86d9'],
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
  {id:'group-debut',m:1,d:22,type:'anniversary',category:'group',icon:'⛄️',title:'Snow Man デビュー記念日',sinceYear:2020,color:'#9bcce0'},
  {id:'group-formation',m:5,d:3,type:'anniversary',category:'group',icon:'❄️',title:'Snow Man 結成記念日',sinceYear:2012,color:'#9bcce0'},
  {id:'birthday-meguro',m:2,d:16,type:'birthday',category:'member',icon:'🎂',title:'目黒蓮さんのお誕生日',sinceYear:1997,color:'#30353a'},
  {id:'birthday-miyadate',m:3,d:25,type:'birthday',category:'member',icon:'🎂',title:'宮舘涼太さんのお誕生日',sinceYear:1993,color:'#cf4f5f'},
  {id:'birthday-fukazawa',m:5,d:5,type:'birthday',category:'member',icon:'🎂',title:'深澤辰哉さんのお誕生日',sinceYear:1992,color:'#8a69b8'},
  {id:'birthday-iwamoto',m:5,d:17,type:'birthday',category:'member',icon:'🎂',title:'岩本照さんのお誕生日',sinceYear:1993,color:'#f4c542'},
  {id:'birthday-mukai',m:6,d:21,type:'birthday',category:'member',icon:'🎂',title:'向井康二さんのお誕生日',sinceYear:1994,color:'#e59a43'},
  {id:'birthday-raul',m:6,d:27,type:'birthday',category:'member',icon:'🎂',title:'ラウールさんのお誕生日',sinceYear:2003,color:'#f2f2f2'},
  {id:'birthday-sakuma',m:7,d:5,type:'birthday',category:'member',icon:'🎂',title:'佐久間大介さんのお誕生日',sinceYear:1992,color:'#e88dbb'},
  {id:'birthday-watanabe',m:11,d:5,type:'birthday',category:'member',icon:'🎂',title:'渡辺翔太さんのお誕生日',sinceYear:1992,color:'#4c86d9'},
  {id:'birthday-abe',m:11,d:27,type:'birthday',category:'member',icon:'🎂',title:'阿部亮平さんのお誕生日',sinceYear:1993,color:'#55a86c'},
  {id:'join-raul',m:5,d:2,type:'join',category:'member',icon:'🌟',title:'ラウールさん 入所記念日',sinceYear:2015,color:'#f2f2f2'},
  {id:'join-watanabe',m:6,d:26,type:'join',category:'member',icon:'🌟',title:'渡辺翔太さん 入所記念日',sinceYear:2005,color:'#4c86d9'},
  {id:'join-fukazawa',m:8,d:12,type:'join',category:'member',icon:'🌟',title:'深澤辰哉さん 入所記念日',sinceYear:2004,color:'#8a69b8'},
  {id:'join-abe',m:8,d:12,type:'join',category:'member',icon:'🌟',title:'阿部亮平さん 入所記念日',sinceYear:2004,color:'#55a86c'},
  {id:'join-sakuma',m:9,d:25,type:'join',category:'member',icon:'🌟',title:'佐久間大介さん 入所記念日',sinceYear:2005,color:'#e88dbb'},
  {id:'join-miyadate',m:10,d:1,type:'join',category:'member',icon:'🌟',title:'宮舘涼太さん 入所記念日',sinceYear:2005,color:'#cf4f5f'},
  {id:'join-iwamoto',m:10,d:1,type:'join',category:'member',icon:'🌟',title:'岩本照さん 入所記念日',sinceYear:2006,color:'#f4c542'},
  {id:'join-mukai',m:10,d:8,type:'join',category:'member',icon:'🌟',title:'向井康二さん 入所記念日',sinceYear:2006,color:'#e59a43'},
  {id:'join-meguro',m:10,d:30,type:'join',category:'member',icon:'🌟',title:'目黒蓮さん 入所記念日',sinceYear:2010,color:'#30353a'}
];

let fixedEvents = DEFAULT_FIXED_EVENTS;
let state = loadState();
let chartData = null;
let currentDetailId = null;
let currentView = 'home';
let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = localDate();
let pendingSharedProject = null;

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
  const visibility = {
    ...DEFAULT_MILESTONE_VISIBILITY,
    ...(p.milestoneVisibility || {})
  };

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
    if(visibility.day30){
      list.push({key:'30',label:'30日',date:addDays(base,30),special:'🎉 リリース30日！'});
    }
    if(visibility.day100){
      list.push({key:'100',label:'100日',date:addDays(base,100),special:'💯 リリース100日！'});
    }
    if(visibility.half){
      list.push({key:'half',label:'半年',date:addMonths(base,6),special:'🎉 リリース半年！'});
    }
    if(visibility.year){
      list.push({key:'year',label:'1周年',date:addMonths(base,12),special:'🎂 リリース1周年！'});
    }
  }

  (p.customMilestones || []).forEach(item=>{
    if(!item?.label || !item?.date) return;
    list.push({
      key:item.id || uid('milestone'),
      label:item.label,
      date:parseDate(item.date),
      special:item.message || `🎉 ${item.label}！`,
      custom:true
    });
  });

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

function routeMilestones(p){
  const milestones = projectMilestones(p).map(m=>({
    ...m,
    routeKind:'project'
  }));

  if(p.type!=='event'){
    const year = parseDate(p.baseDate).getFullYear();

    ['billboard','oricon'].forEach(org=>{
      ['firstHalf','annual'].forEach(period=>{
        const chart = chartPeriod(year,org,period);
        const status = chartStatus(p,chart);

        if(!status.included) return;

        const label =
          `${org==='billboard' ? 'Billboard' : 'オリコン'} ` +
          `${period==='firstHalf' ? '上半期締切' : '年間締切'}`;
        const date = parseDate(chart.end);

        milestones.push({
          key:`chart-${org}-${period}`,
          label,
          date,
          diff:dayDiff(parseDate(localDate()),date),
          routeKind:'chart',
          announced:!!chart.announced
        });
      });
    });
  }

  return milestones.sort((a,b)=>
    a.date-b.date ||
    (a.routeKind===b.routeKind ? 0 : a.routeKind==='chart' ? 1 : -1)
  );
}

function routeNextSummary(milestones){
  const next = milestones.find(m=>m.diff>0);

  if(!next){
    return `
      <div class="route-next-summary route-next-complete">
        <span>次の目標</span>
        <strong>登録済みの節目をすべて通過しました</strong>
      </div>
    `;
  }

  const remaining = next.diff===1 ? '明日' : `あと${next.diff}日`;

  return `
    <div class="route-next-summary">
      <span>次の目標</span>
      <strong>${escapeHtml(next.label)}まで ${remaining}</strong>
    </div>
  `;
}

function routeHtml(p){
  const milestones = routeMilestones(p);
  const today = parseDate(localDate());

  if(!milestones.length){
    return '<div class="route-empty">表示できる節目がありません。</div>';
  }

  const hasTodayMilestone = milestones.some(m=>m.diff===0);
  const rows = [];
  let currentInserted = false;

  milestones.forEach(m=>{
    if(!hasTodayMilestone && !currentInserted && m.diff>0){
      rows.push(`
        <div class="route-item route-current-position">
          <div class="route-marker"><span>◆</span></div>
          <div class="route-content">
            <strong>今ここ</strong>
            <small>${fmt(today)}</small>
          </div>
        </div>
      `);
      currentInserted = true;
    }

    const statusClass = m.diff<0
      ? 'route-past'
      : m.diff===0
        ? 'route-today'
        : 'route-future';

    const kindClass = m.routeKind==='chart' ? 'route-chart' : '';
    const marker = m.diff<0 ? '✓' : m.diff===0 ? '●' : '○';

    const distanceText = m.diff===0
      ? '今日・今ここ'
      : m.diff===1
        ? '明日'
        : m.diff>1
          ? `あと${m.diff}日`
          : `${Math.abs(m.diff)}日前`;

    rows.push(`
      <div class="route-item ${statusClass} ${kindClass}">
        <div class="route-marker"><span>${marker}</span></div>
        <div class="route-content">
          <strong>${m.routeKind==='chart' ? '<span class="route-chart-icon">🏆</span>' : ''}${escapeHtml(m.label)}</strong>
          <small>${fmt(m.date)}${m.routeKind==='chart' && !m.announced ? '・推定' : ''}</small>
        </div>
        <div class="route-distance">${escapeHtml(distanceText)}</div>
      </div>
    `);
  });

  if(!hasTodayMilestone && !currentInserted){
    rows.push(`
      <div class="route-item route-current-position">
        <div class="route-marker"><span>◆</span></div>
        <div class="route-content">
          <strong>今ここ</strong>
          <small>${fmt(today)}</small>
        </div>
      </div>
    `);
  }

  return `
    ${routeNextSummary(milestones)}
    <div class="route-list">${rows.join('')}</div>
  `;
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
  document.getElementById('archiveCount').textContent = state.projects.filter(p=>p.archived).length;
  renderHero(active);
  renderCards(active);
  renderArchive();
  renderCalendar();
  applyView();
  maybeDailyOpening(active);
}

function setView(view){
  currentView = view === 'calendar' ? 'calendar' : 'home';
  if(currentView === 'calendar'){
    const selected = parseDate(selectedCalendarDate);
    calendarCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
    renderCalendar();
  }
  applyView();
  window.scrollTo({top:0,behavior:'smooth'});
}

function applyView(){
  const isCalendar = currentView === 'calendar';
  document.getElementById('homeView').classList.toggle('hidden',isCalendar);
  document.getElementById('calendarView').classList.toggle('hidden',!isCalendar);
  document.getElementById('homeTabBtn').classList.toggle('active',!isCalendar);
  document.getElementById('calendarTabBtn').classList.toggle('active',isCalendar);
  document.getElementById('newBtn').classList.toggle('hidden',isCalendar);
}

function fixedEventMilestone(event,year){
  if(!event.sinceYear) return '毎年の記念日';
  const count = year - Number(event.sinceYear);
  if(count < 0) return '';
  if(event.type === 'birthday') return `${count}歳のお誕生日`;
  return `${count}周年`;
}

function fixedEventLabel(event,year){
  const milestone = fixedEventMilestone(event,year);
  return `${event.icon || '⭐'} ${event.title || event.label || '記念日'}${milestone ? `（${milestone}）` : ''}`;
}

function calendarEvents(){
  const events = [];
  const years = new Set();
  const cursorYear = calendarCursor.getFullYear();

  for(let year=cursorYear-1;year<=cursorYear+1;year+=1){
    years.add(year);
  }

  fixedEvents.forEach(event=>{
    years.forEach(year=>{
      const date = new Date(year,Number(event.m)-1,Number(event.d));
      events.push({
        date:localDate(date),
        kind:'official',
        officialId:event.id || `${event.m}-${event.d}-${event.title || event.label}`,
        title:event.title || event.label || '記念日',
        typeLabel:'公式記念日',
        typeIcon:'',
        milestone:fixedEventMilestone(event,year),
        color:event.color || DEFAULT_ACCENT
      });
    });
  });

  state.projects.filter(p=>!p.archived).forEach(p=>{
    projectMilestones(p).forEach(m=>{
      events.push({
        date:localDate(m.date),
        kind:'project',
        projectId:p.id,
        title:p.title,
        typeLabel:typeInfo(p).label,
        typeIcon:typeInfo(p).icon,
        milestone:m.label,
        color:memberColor(p)
      });
    });
  });

  return events.sort((a,b)=>
    a.date.localeCompare(b.date) ||
    (a.kind === b.kind ? 0 : a.kind === 'official' ? -1 : 1) ||
    a.title.localeCompare(b.title,'ja')
  );
}

function renderCalendar(){
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const today = localDate();
  const events = calendarEvents();
  const byDate = new Map();

  events.forEach(event=>{
    if(!byDate.has(event.date)) byDate.set(event.date,[]);
    byDate.get(event.date).push(event);
  });

  document.getElementById('calendarMonthTitle').textContent = `${year}年${month+1}月`;

  const firstWeekday = new Date(year,month,1).getDay();
  const lastDate = new Date(year,month+1,0).getDate();
  const previousLastDate = new Date(year,month,0).getDate();
  const cells = [];

  for(let i=0;i<42;i++){
    let cellDate;
    let day;
    let outside = false;

    if(i < firstWeekday){
      day = previousLastDate - firstWeekday + i + 1;
      cellDate = new Date(year,month-1,day);
      outside = true;
    }else if(i >= firstWeekday + lastDate){
      day = i - firstWeekday - lastDate + 1;
      cellDate = new Date(year,month+1,day);
      outside = true;
    }else{
      day = i - firstWeekday + 1;
      cellDate = new Date(year,month,day);
    }

    const key = localDate(cellDate);
    const dayEvents = byDate.get(key) || [];
    const dots = dayEvents.slice(0,3).map(e=>{
      const markerClass = e.kind === 'official'
        ? 'calendar-marker official'
        : e.kind === 'personal'
          ? 'calendar-marker personal'
          : 'calendar-marker project';
      const markerText = e.kind === 'official' ? '★' : e.kind === 'personal' ? '◆' : '';
      return `<span class="${markerClass}" style="--dot-color:${e.color}" aria-hidden="true">${markerText}</span>`;
    }).join('');
    const more = dayEvents.length > 3 ? '<span class="calendar-more">+</span>' : '';

    cells.push(`
      <button
        type="button"
        class="calendar-cell
          ${outside ? 'outside' : ''}
          ${key===today ? 'today' : ''}
          ${key===selectedCalendarDate ? 'selected' : ''}
          ${dayEvents.length ? 'has-events' : ''}"
        data-calendar-date="${key}"
        aria-label="${cellDate.getFullYear()}年${cellDate.getMonth()+1}月${day}日${dayEvents.length ? `、節目${dayEvents.length}件` : ''}"
      >
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-dots">${dots}${more}</span>
      </button>
    `);
  }

  document.getElementById('calendarGrid').innerHTML = cells.join('');

  document.querySelectorAll('[data-calendar-date]').forEach(button=>{
    button.onclick = ()=>{
      selectedCalendarDate = button.dataset.calendarDate;
      const date = parseDate(selectedCalendarDate);
      if(date.getFullYear() !== calendarCursor.getFullYear() || date.getMonth() !== calendarCursor.getMonth()){
        calendarCursor = new Date(date.getFullYear(),date.getMonth(),1);
      }
      renderCalendar();
    };
  });

  renderSelectedCalendarDate(byDate);
}

function renderSelectedCalendarDate(byDate){
  const date = parseDate(selectedCalendarDate);
  const events = byDate.get(selectedCalendarDate) || [];
  const title = `${date.getMonth()+1}月${date.getDate()}日`;

  document.getElementById('selectedDateTitle').textContent =
    selectedCalendarDate === localDate() ? `${title}（今日）` : title;

  document.getElementById('selectedDateCount').textContent = events.length ? `${events.length}件` : '';

  const container = document.getElementById('selectedDateEvents');

  if(!events.length){
    container.innerHTML = '<div class="calendar-empty">この日に登録されている節目はありません。</div>';
    return;
  }

  container.innerHTML = events.map(event=>{
    const typeDetail = [event.typeIcon,event.typeLabel].filter(Boolean).join(' ');
    const detail = [event.milestone,typeDetail].filter(Boolean).map(escapeHtml).join(' ・ ');

    if(event.kind === 'official'){
      return `
        <div class="calendar-event calendar-event-official">
          <span class="calendar-event-symbol official" style="--dot-color:${event.color}" aria-hidden="true">★</span>
          <span class="calendar-event-text">
            <strong>${escapeHtml(event.title)}</strong>
            <small>${detail}</small>
          </span>
        </div>
      `;
    }

    return `
      <button type="button" class="calendar-event" onclick="openDetailFromCalendar('${event.projectId}')">
        <span class="calendar-event-dot" style="--dot-color:${event.color}"></span>
        <span class="calendar-event-text">
          <strong>${escapeHtml(event.title)}</strong>
          <small>${detail}</small>
        </span>
        <span class="calendar-event-arrow">›</span>
      </button>
    `;
  }).join('');
}

function moveCalendarMonth(amount){
  calendarCursor = new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+amount,1);
  selectedCalendarDate = localDate(calendarCursor);
  renderCalendar();
}

function returnCalendarToToday(){
  const now = new Date();
  calendarCursor = new Date(now.getFullYear(),now.getMonth(),1);
  selectedCalendarDate = localDate(now);
  renderCalendar();
}

function openDetailFromCalendar(id){
  openDetail(id);
}

function renderToday(){
  const now = new Date();
  document.getElementById('todayDate').textContent = fmt(now);
  const events = getTodayEvents();
  const box = document.getElementById('specialBox');

  if(events.length){
    document.getElementById('specialList').innerHTML =
      events.slice(0,3).map(e=>`<div class="special-item">${escapeHtml(e.label)}</div>`).join('');
    box.classList.remove('hidden');
  }else{
    box.classList.add('hidden');
  }
}

function getTodayEvents(){
  const now = new Date();
  const m = now.getMonth()+1;
  const d = now.getDate();

  const fixed = fixedEvents
    .filter(e=>Number(e.m)===m && Number(e.d)===d)
    .map(e=>({...e,label:fixedEventLabel(e,now.getFullYear())}));
  const project = [];

  state.projects.filter(p=>!p.archived).forEach(p=>{
    projectMilestones(p).filter(x=>x.diff===0).forEach(x=>{
      project.push({type:'project',label:`${x.special} ${p.title}`});
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
  const count = s.kind==='future' && s.diff>1
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
  return p.pinned ? '<span class="card-pin" aria-label="ピン留め中">📌</span>' : '';
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
  const links = (p.links || []).filter(l=>l.showOnHome).slice(0,3);
  if(!links.length) return '';

  return `
    <div class="quick-links">
      ${links.map(l=>`
        <a class="link-chip" href="${escapeHtml(l.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escapeHtml(l.label || '開く')}</a>
      `).join('')}
    </div>
  `;
}

function renderCards(active){
  const el = document.getElementById('projectList');

  if(!active.length){
    el.innerHTML = '<div class="empty">まだプロジェクトがありません。<br>右下のボタンから登録できます。</div>';
    return;
  }

  el.innerHTML = active.map(p=>{
    const s = displayStatus(p);
    const info = typeInfo(p);
    let countdown = '';

    if(s.kind==='special'){
      countdown = `<div class="card-count special-count">${escapeHtml(s.message)}</div>`;
    }else if(s.kind==='future'){
      countdown = `<div class="card-count">${s.diff===1 ? '明日！' : `あと${s.diff}日`}</div>`;
    }else{
      countdown = `<div class="card-count past-count">${escapeHtml(s.message)}</div>`;
    }

    return `
      <article class="card" style="--member-color:${memberColor(p)}" onclick="openDetail('${p.id}')">
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

  document.getElementById('editTitle').textContent = p ? 'プロジェクトを編集' : '新しいプロジェクト';
  document.getElementById('projectId').value = p?.id || '';
  document.getElementById('titleInput').value = p?.title || '';
  document.getElementById('typeInput').value = p?.type || 'digital';
  document.getElementById('dateInput').value = p?.baseDate || localDate();
  document.getElementById('memberInput').value = p ? colorKey(p) : 'default';
  document.getElementById('customColorInput').value = p?.customColor || '#9bcce0';
  document.getElementById('memoInput').value = p?.memo || '';
  document.getElementById('pinnedInput').checked = !!p?.pinned;
  document.getElementById('activeInput').checked = p ? !!p.active : true;
  document.getElementById('flyingInput').checked = p ? p.showFlyingGet!==false : true;
  document.getElementById('messageInput').value = p?.eventMessage || '';
  document.getElementById('afterLabelInput').value = p?.afterLabel || '';

  const visibility = {...DEFAULT_MILESTONE_VISIBILITY,...(p?.milestoneVisibility || {})};
  document.getElementById('milestone30Input').checked = visibility.day30;
  document.getElementById('milestone100Input').checked = visibility.day100;
  document.getElementById('milestoneHalfInput').checked = visibility.half;
  document.getElementById('milestoneYearInput').checked = visibility.year;

  renderCustomMilestonesEditor(p?.customMilestones || []);
  renderLinksEditor(p?.links || []);
  updateTypeFields();
  updateCustomColor();
  openModal('editModal');
}

function updateTypeFields(){
  const type = document.getElementById('typeInput').value;
  document.getElementById('flyingRow').classList.toggle('hidden',!(type==='cd' || type==='video'));
  document.getElementById('messageInput').placeholder = defaultMessage(type);
  document.getElementById('defaultMilestones').classList.toggle('hidden', type==='event');
}

function updateCustomColor(){
  document.getElementById('customColorField').classList.toggle(
    'hidden',
    document.getElementById('memberInput').value!=='custom'
  );
}

function renderCustomMilestonesEditor(items){
  const box = document.getElementById('customMilestonesEditor');
  box.innerHTML = '';
  items.forEach(addMilestoneRow);
}

function addMilestoneRow(item={id:uid('milestone'),label:'',date:'',message:''}){
  const row = document.createElement('div');
  row.className = 'milestone-editor';
  row.dataset.id = item.id || uid('milestone');

  row.innerHTML = `
    <div class="milestone-editor-grid">
      <div class="field">
        <label>節目名</label>
        <input class="milestone-label" type="text" maxlength="30" value="${escapeHtml(item.label || '')}" placeholder="例：初週終了">
      </div>
      <div class="field">
        <label>日付</label>
        <input class="milestone-date" type="date" value="${escapeHtml(item.date || '')}">
      </div>
    </div>
    <div class="field milestone-message-field">
      <label>当日のメッセージ <span class="optional-label">任意</span></label>
      <input class="milestone-message" type="text" maxlength="40" value="${escapeHtml(item.message || '')}" placeholder="未入力なら「🎉 節目名！」">
    </div>
    <div class="milestone-editor-actions">
      <button type="button" class="text-btn remove-milestone">削除</button>
    </div>
  `;

  row.querySelector('.remove-milestone').onclick = ()=>row.remove();
  document.getElementById('customMilestonesEditor').appendChild(row);
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
      <input class="link-label" type="text" value="${escapeHtml(link.label)}" placeholder="YouTube">
    </div>
    <div>
      <label>URL</label>
      <input class="link-url" type="url" value="${escapeHtml(link.url)}" placeholder="https://...">
    </div>
    <div class="link-editor-actions">
      <label style="margin:0;font-weight:400">
        <input class="link-home" type="checkbox" ${link.showOnHome ? 'checked' : ''}>
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

  const customMilestones = [...document.querySelectorAll('.milestone-editor')]
    .map(r=>({
      id:r.dataset.id,
      label:r.querySelector('.milestone-label').value.trim(),
      date:r.querySelector('.milestone-date').value,
      message:r.querySelector('.milestone-message').value.trim()
    }))
    .filter(m=>m.label || m.date || m.message);

  const incompleteMilestone = customMilestones.find(m=>!m.label || !m.date);
  if(incompleteMilestone){
    alert('独自の節目は「節目名」と「日付」の両方を入力してください。');
    return;
  }

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
    archived:id ? (state.projects.find(x=>x.id===id)?.archived || false) : false,
    showFlyingGet:document.getElementById('flyingInput').checked,
    eventMessage:document.getElementById('messageInput').value.trim() || defaultMessage(type),
    afterLabel:document.getElementById('afterLabelInput').value.trim() || TYPE[type].after,
    milestoneVisibility:{
      day30:document.getElementById('milestone30Input').checked,
      day100:document.getElementById('milestone100Input').checked,
      half:document.getElementById('milestoneHalfInput').checked,
      year:document.getElementById('milestoneYearInput').checked
    },
    customMilestones,
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
  const links = (p.links || [])
    .filter(l=>l.url)
    .map(l=>`
      <a class="link-chip" href="${escapeHtml(l.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">▶ ${escapeHtml(l.label || '開く')}</a>
    `)
    .join('');

  document.getElementById('detailContent').innerHTML = `
    <div class="panel detail-summary" style="border-left:7px solid ${memberColor(p)}">
      ${pinHtml(p)}
      <div class="detail-muted">${typeInfo(p).icon} ${typeInfo(p).label}</div>
      <h2>${escapeHtml(p.title)}</h2>
      <div class="detail-count">${escapeHtml(s.message)}</div>
      ${s.sub ? `<div class="detail-muted">${escapeHtml(s.sub)}</div>` : ''}
      ${badgesHtml(p)}
    </div>

    <div class="panel route-panel">
      <h3>今ここ</h3>
      ${routeHtml(p)}
    </div>

    ${chartPanel(p)}

    ${links ? `
      <div class="panel">
        <h3>関連リンク</h3>
        <div class="quick-links">${links}</div>
      </div>
    ` : ''}

    ${p.memo ? `
      <div class="panel">
        <h3>メモ</h3>
        <p>${escapeHtml(p.memo).replace(/\n/g,'<br>')}</p>
      </div>
    ` : ''}

    <div class="panel share-panel">
      <h3>プロジェクトを共有</h3>
      <p class="detail-muted share-note">URLはSNSで共有できます。JSONは保存・受け渡し用です。</p>
      <div class="share-actions">
        <button class="primary" onclick="shareProjectUrl('${p.id}')">🔗 共有URL</button>
        <button class="secondary" onclick="exportProject('${p.id}')">💾 JSONとして保存</button>
      </div>
    </div>

    <div class="btn-row">
      <button class="primary" onclick="closeModal('detailModal');openEditor('${p.id}')">編集</button>
      <button class="secondary" onclick="archiveProject('${p.id}')">アーカイブ</button>
      <button class="danger" onclick="deleteProject('${p.id}')">削除</button>
    </div>
  `;

  openModal('detailModal');
}

function estimatedChartPeriod(year,org,period){
  const make = (start,end)=>({start,end,announced:false,estimated:true});

  if(period==='firstHalf'){
    return org==='billboard'
      ? make(`${year-1}-11-24`,`${year}-05-24`)
      : make(`${year-1}-12-08`,`${year}-06-07`);
  }

  return org==='billboard'
    ? make(`${year-1}-11-24`,`${year}-11-22`)
    : make(`${year-1}-12-08`,`${year}-12-06`);
}

const OFFICIAL_CHART_PERIODS = {
  2026:{
    billboard:{
      firstHalf:{
        start:'2025-11-24',
        end:'2026-05-24',
        announced:true,
        estimated:false
      }
    },
    oricon:{
      firstHalf:{
        start:'2025-12-08',
        end:'2026-06-07',
        announced:true,
        estimated:false
      }
    }
  }
};

function chartPeriod(year,org,period){
  const official = OFFICIAL_CHART_PERIODS?.[year]?.[org]?.[period];
  if(official) return official;
  return chartData?.years?.[year]?.[org]?.[period] || estimatedChartPeriod(year,org,period);
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
  return {included:true,text:`対象期間終了（${Math.abs(left)}日前）`};
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
          <span class="status-tag ${v.announced ? 'official' : 'estimated'}">
            ${v.announced ? '公式確定' : '推定期間'}
          </span>
        </li>
      `);
    });
  });

  return `
    <div class="panel">
      <h3>チャート期間</h3>
      <p class="detail-muted chart-note">基準日が各集計期間に含まれるかを自動判定しています。</p>
      <p class="chart-estimate-note">※「推定期間」は過去の集計傾向から算出した目安です。公式発表された期間ではありません。</p>
      <ul class="milestones">${rows.join('')}</ul>
    </div>
  `;
}

function archiveProject(id){
  if(!confirm('このプロジェクトをアーカイブしますか？')) return;
  state.projects = state.projects.map(p=>p.id===id ? {...p,archived:true} : p);
  saveState();
  closeModal('detailModal');
  render();
}

function restoreProject(id){
  state.projects = state.projects.map(p=>p.id===id ? {...p,archived:false} : p);
  saveState();
  render();
}

function deleteProject(id){
  const p = state.projects.find(x=>x.id===id);

  if(!p || !confirm(`「${p.title}」を削除しますか？\nこの操作は元に戻せません。`)){
    return;
  }

  state.projects = state.projects.filter(x=>x.id!==id);
  saveState();
  closeModal('detailModal');
  render();
}

function applySettings(){
  document.documentElement.style.setProperty('--accent-strong',state.settings.accent || DEFAULT_ACCENT);
  document.body.classList.toggle('dark',state.settings.mode==='dark');
  document.querySelector('meta[name="theme-color"]').content = state.settings.accent || DEFAULT_ACCENT;
}

function openSettings(){
  document.getElementById('accentInput').value = state.settings.accent || DEFAULT_ACCENT;
  document.getElementById('modeInput').value = state.settings.mode || 'light';
  document.getElementById('openingInput').value = state.settings.opening || 'special';
  document.getElementById('effectInput').checked = state.settings.effect!==false;
  openModal('settingsModal');
}

function resetAccentColor(){
  document.getElementById('accentInput').value = DEFAULT_ACCENT;
}

function saveSettings(){
  state.settings.accent = document.getElementById('accentInput').value;
  state.settings.mode = document.getElementById('modeInput').value;
  state.settings.opening = document.getElementById('openingInput').value;
  state.settings.effect = document.getElementById('effectInput').checked;
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
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
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
      {dataVersion:1,kind:'snow-route-project',project:{...p,pinned:false,archived:false}},
      `snow-route-${p.title}.json`
    );
  }
}


function projectSharePayload(p){
  return {
    dataVersion:1,
    kind:'snow-route-project',
    project:{
      ...p,
      id:'',
      pinned:false,
      archived:false,
      createdAt:'',
      updatedAt:''
    }
  };
}

function encodeShareData(data){
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach(byte=>{ binary += String.fromCharCode(byte); });
  return btoa(binary)
    .replace(/\+/g,'-')
    .replace(/\//g,'_')
    .replace(/=+$/,'');
}

function decodeShareData(value){
  const normalized = value.replace(/-/g,'+').replace(/_/g,'/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary,char=>char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function shareProjectUrl(id){
  const p = state.projects.find(x=>x.id===id);
  if(!p) return;

  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('share',encodeShareData(projectSharePayload(p)));

  const shareData = {
    title:`SNOW ROUTE｜${p.title}`,
    text:`「${p.title}」のSNOW ROUTEプロジェクト`,
    url:url.toString()
  };

  try{
    if(navigator.share){
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(url.toString());
    alert('共有URLをコピーしました。');
  }catch(error){
    if(error?.name === 'AbortError') return;

    try{
      await navigator.clipboard.writeText(url.toString());
      alert('共有URLをコピーしました。');
    }catch(copyError){
      prompt('共有URLをコピーしてください。',url.toString());
    }
  }
}

function clearShareParameter(){
  const url = new URL(window.location.href);
  if(!url.searchParams.has('share')) return;
  url.searchParams.delete('share');
  history.replaceState(null,'',`${url.pathname}${url.search}${url.hash}`);
}

function sharedProjectSummary(p){
  const customCount = (p.customMilestones || []).filter(m=>m?.label && m?.date).length;
  const linkCount = (p.links || []).filter(l=>l?.url).length;

  return [
    customCount ? `独自の節目 ${customCount}件` : '',
    linkCount ? `リンク ${linkCount}件` : ''
  ].filter(Boolean).join(' ・ ');
}

function showSharedProjectPreview(project){
  if(!project?.title || !project?.baseDate){
    alert('共有プロジェクトのデータを確認できませんでした。');
    clearShareParameter();
    return;
  }

  pendingSharedProject = project;
  const summary = sharedProjectSummary(project);

  document.getElementById('detailContent').innerHTML = `
    <div class="panel shared-preview" style="border-left:7px solid ${memberColor(project)}">
      <div class="detail-muted">共有されたプロジェクト</div>
      <h2>${typeInfo(project).icon} ${escapeHtml(project.title)}</h2>
      <div class="shared-project-date">${fmt(parseDate(project.baseDate))}</div>
      <div class="detail-muted">${escapeHtml(typeInfo(project).label)}</div>
      ${summary ? `<p class="shared-project-summary">${escapeHtml(summary)}</p>` : ''}
      ${project.memo ? `<p class="shared-project-memo">${escapeHtml(project.memo).replace(/\n/g,'<br>')}</p>` : ''}
    </div>

    <div class="panel">
      <h3>自分のSNOW ROUTEに追加しますか？</h3>
      <p class="detail-muted share-note">現在の登録内容は消えません。新しいプロジェクトとして追加されます。</p>
      <div class="share-actions">
        <button class="primary" onclick="addSharedProject()">追加する</button>
        <button class="secondary" onclick="cancelSharedProject()">キャンセル</button>
      </div>
    </div>
  `;

  openModal('detailModal');
}

function addSharedProject(){
  if(!pendingSharedProject) return;

  const now = new Date().toISOString();
  state.projects.push({
    ...pendingSharedProject,
    id:uid('project'),
    pinned:false,
    archived:false,
    createdAt:now,
    updatedAt:now
  });

  pendingSharedProject = null;
  clearShareParameter();
  saveState();
  closeModal('detailModal');
  render();
  alert('プロジェクトを追加しました。');
}

function cancelSharedProject(){
  pendingSharedProject = null;
  clearShareParameter();
  closeModal('detailModal');
}

function handleIncomingShare(){
  const value = new URL(window.location.href).searchParams.get('share');
  if(!value) return;

  try{
    const data = decodeShareData(value);
    if(data?.kind !== 'snow-route-project' || !data?.project){
      throw new Error('形式が違います');
    }
    showSharedProjectPreview(data.project);
  }catch(error){
    clearShareParameter();
    alert('共有URLを読み込めませんでした。URLが途中で切れていないか確認してください。');
  }
}

function exportAll(){
  downloadJson(state,`snow-route-backup-${localDate()}.json`);
}

async function importAll(file){
  try{
    const data = JSON.parse(await file.text());

    if(data?.kind === 'snow-route-project' && data?.project){
      closeModal('settingsModal');
      showSharedProjectPreview(data.project);
      return;
    }

    if(!data || !Array.isArray(data.projects)){
      throw new Error('形式が違います');
    }

    if(confirm('現在のデータに追加しますか？\n「キャンセル」を選ぶと、現在のデータを置き換えます。')){
      const ids = new Set(state.projects.map(p=>p.id));
      data.projects.forEach(p=>{
        state.projects.push(ids.has(p.id) ? {...p,id:uid('project')} : p);
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

document.getElementById('homeTabBtn').onclick = ()=>setView('home');
document.getElementById('calendarTabBtn').onclick = ()=>setView('calendar');
document.getElementById('prevMonthBtn').onclick = ()=>moveCalendarMonth(-1);
document.getElementById('nextMonthBtn').onclick = ()=>moveCalendarMonth(1);
document.getElementById('calendarMonthTitle').onclick = returnCalendarToToday;
document.getElementById('newBtn').onclick = ()=>openEditor();
document.getElementById('settingsBtn').onclick = openSettings;
document.getElementById('archiveBtn').onclick = ()=>openModal('archiveModal');
document.getElementById('addMilestoneBtn').onclick = ()=>addMilestoneRow();
document.getElementById('addLinkBtn').onclick = ()=>addLinkRow();
document.getElementById('typeInput').onchange = updateTypeFields;
document.getElementById('memberInput').onchange = updateCustomColor;
document.getElementById('resetAccentBtn').onclick = resetAccentColor;
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
window.openDetailFromCalendar = openDetailFromCalendar;
window.openEditor = openEditor;
window.closeModal = closeModal;
window.archiveProject = archiveProject;
window.restoreProject = restoreProject;
window.deleteProject = deleteProject;
window.exportProject = exportProject;
window.shareProjectUrl = shareProjectUrl;
window.addSharedProject = addSharedProject;
window.cancelSharedProject = cancelSharedProject;

populateMembers();

Promise.all([
  fetch(CHART_URL).then(r=>r.ok ? r.json() : null).catch(()=>null),
  fetch(CALENDAR_URL).then(r=>r.ok ? r.json() : null).catch(()=>null)
]).then(([charts,calendar])=>{
  chartData = charts;

  if(calendar?.events && Array.isArray(calendar.events)){
    const legacyExtras = calendar.events.filter(event=>
      !DEFAULT_FIXED_EVENTS.some(defaultEvent=>
        Number(defaultEvent.m)===Number(event.m) &&
        Number(defaultEvent.d)===Number(event.d) &&
        defaultEvent.type===event.type
      )
    );

    fixedEvents = [...DEFAULT_FIXED_EVENTS,...legacyExtras.map((event,index)=>({
      ...event,
      id:event.id || `calendar-extra-${index}`,
      icon:event.icon || (event.type==='birthday' ? '🎂' : '⭐'),
      title:event.title || String(event.label || '記念日').replace(/^[^\p{L}\p{N}]+/u,'').trim(),
      color:event.color || DEFAULT_ACCENT
    }))];
  }

  render();
  handleIncomingShare();
});
