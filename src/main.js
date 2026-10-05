const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

// Boot
setTimeout(()=> $('#boot-screen')?.classList.add('hide'), 1400);

// Clock
function tick(){
  const now = new Date();
  $('#clock-time').textContent = now.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  $('#clock-date').textContent = now.toLocaleDateString([], {month:'numeric', day:'numeric', year:'numeric'});
}
tick(); setInterval(tick, 1000);

// Data
const pinnedApps = [
  {id:'edge', name:'Edge', color:'linear-gradient(135deg,#0c59a4,#35b6ed)', icon:'🌐', letter:'e'},
  {id:'explorer', name:'File Explorer', color:'#FFCA28', icon:'📁', letter:'📁'},
  {id:'store', name:'Microsoft Store', color:'#10B981', icon:'🛍', letter:'◈'},
  {id:'settings', name:'Settings', color:'#6B7280', icon:'⚙', letter:'⚙'},
  {id:'notepad', name:'Notepad', color:'#60A5FA', icon:'📝', letter:'≡'},
  {id:'calculator', name:'Calculator', color:'#A78BFA', icon:'🧮', letter:'±'},
  {id:'vscode', name:'VS Code', color:'#007ACC', icon:'<>', letter:'</>'},
  {id:'photos', name:'Photos', color:'linear-gradient(135deg,#ec4899,#8b5cf6)', icon:'🖼', letter:'◐'},
  {id:'edge', name:'Paint', color:'linear-gradient(135deg,#f59e0b,#ef4444)', icon:'🎨', letter:'✎'},
  {id:'explorer', name:'Photos', color:'#34D399', icon:'🏞', letter:'✿'},
  {id:'store', name:'Spotify', color:'#1DB954', icon:'♪', letter:'♪'},
  {id:'notepad', name:'Terminal', color:'#111827', icon:'>_', letter:'>_'},
];

const recommended = [
  {name:'Quarterly Report.docx', meta:'2h ago • Word', icon:'W', color:'#2B579A'},
  {name:'Win11 Web — Figma', meta:'Yesterday • Figma', icon:'F', color:'#A259FF'},
  {name:'Project Bloom Assets', meta:'2 days ago • Folder', icon:'📁', color:'#FFCA28'},
  {name:'Budget 2025.xlsx', meta:'Monday • Excel', icon:'X', color:'#217346'},
  {name:'Family Photos', meta:'3 days ago • 42 items', icon:'🖼', color:'#EC4899'},
  {name:'Get Started with Windows 11', meta:'Welcome • Tips', icon:'💡', color:'#0078D4'},
];

const storeApps = [
  {name:'Spotify', cat:'Music', rating:4.6, desc:'Music for everyone. Millions of songs.', color:'#1DB954', letter:'♪', installed:false},
  {name:'Figma', cat:'Design', rating:4.7, desc:'Collaborative design & prototyping.', color:'#A259FF', letter:'F', installed:false},
  {name:'Notion', cat:'Productivity', rating:4.5, desc:'All-in-one workspace for notes & docs.', color:'#000', letter:'N', installed:true},
  {name:'Adobe XD', cat:'Design', rating:4.2, desc:'Design, prototype, share.', color:'#FF61F6', letter:'Xd', installed:false},
  {name:'Zoom', cat:'Communication', rating:4.3, desc:'Video meetings & chat.', color:'#2D8CFF', letter:'Z', installed:false},
  {name:'Canva', cat:'Creativity', rating:4.6, desc:'Design anything, publish anywhere.', color:'#00C4CC', letter:'C', installed:false},
  {name:'Slack', cat:'Work', rating:4.4, desc:'Where work happens.', color:'#E01E5A', letter:'S', installed:false},
  {name:'Netflix', cat:'Entertainment', rating:4.5, desc:'Unlimited movies & shows.', color:'#E50914', letter:'N', installed:false},
];

let fileSystem = {
  'This PC': [
    {name:'Documents', type:'folder', size:'—', date:'Today', icon:'📁', children:[]},
    {name:'Downloads', type:'folder', size:'—', date:'Today', icon:'📁'},
    {name:'Pictures', type:'folder', size:'—', date:'Today', icon:'🖼'},
    {name:'Desktop', type:'folder', size:'—', date:'Yesterday', icon:'🖥'},
    {name:'Windows (C:)', type:'drive', size:'128 GB free of 512 GB', date:'', icon:'💾'},
    {name:'Data (D:)', type:'drive', size:'842 GB free of 1 TB', date:'', icon:'💾'},
  ],
  'Documents': [
    {name:'Quarterly Report.docx', type:'doc', size:'2.4 MB', date:'Today', icon:'📄'},
    {name:'Budget 2025.xlsx', type:'sheet', size:'1.1 MB', date:'Yesterday', icon:'📊'},
    {name:'Presentation.pptx', type:'slide', size:'8.7 MB', date:'Oct 3', icon:'📈'},
    {name:'Project Bloom', type:'folder', size:'—', date:'Oct 1', icon:'📁'},
    {name:'Notes.txt', type:'text', size:'12 KB', date:'Sep 28', icon:'📝'},
    {name:'Contract.pdf', type:'pdf', size:'3.2 MB', date:'Sep 20', icon:'📕'},
  ],
  'Downloads': [
    {name:'Win11-Web.zip', type:'archive', size:'14.2 MB', date:'Today', icon:'🗜'},
    {name:'installer.exe', type:'exe', size:'42 MB', date:'Yesterday', icon:'⚙'},
    {name:'wallpaper.jpg', type:'image', size:'4.8 MB', date:'Oct 2', icon:'🖼'},
  ],
  'Pictures': [
    {name:'Screenshots', type:'folder', size:'—', date:'Today', icon:'📁'},
    {name:'Camera Roll', type:'folder', size:'—', date:'Today', icon:'📷'},
    {name:'bloom-01.jpg', type:'image', size:'6.2 MB', date:'Oct 4', icon:'🖼'},
    {name:'sunset.png', type:'image', size:'8.1 MB', date:'Oct 2', icon:'🌅'},
    {name:'portrait.jpg', type:'image', size:'3.4 MB', date:'Sep 30', icon:'🖼'},
  ],
  'Recycle Bin': [
    {name:'old-notes.txt', type:'text', size:'4 KB', date:'Oct 1', icon:'📝'},
  ],
};

// Render Start Menu
function renderPinned(filter=''){
  const grid = $('#pinned-grid');
  const list = pinnedApps.filter(a=> a.name.toLowerCase().includes(filter.toLowerCase()));
  grid.innerHTML = (list.length? list: [{name:'No results', color:'#e5e7eb', icon:'—', id:'', letter:''}]).map(a=>`
    <button class="pinned-item" data-app="${a.id}">
      <span class="p-icon" style="background:${a.color};color:white">${a.letter || a.icon}</span>
      <span>${a.name}</span>
    </button>
  `).join('');
  grid.querySelectorAll('.pinned-item').forEach(el=>{
    el.addEventListener('click', ()=> {
      if(el.dataset.app) openApp(el.dataset.app);
      closeStart();
    });
  });
}
function renderRecommended(filter=''){
  const el = $('#recommended-list');
  const list = recommended.filter(r=> r.name.toLowerCase().includes(filter.toLowerCase()));
  el.innerHTML = (list.length? list: []).map(r=>`
    <div class="rec-item">
      <span class="rec-icon" style="background:${r.color}">${r.icon}</span>
      <span class="rec-meta"><b>${r.name}</b><small>${r.meta}</small></span>
      <span style="color:#9ca3af">⋯</span>
    </div>
  `).join('');
  if(!list.length) el.innerHTML = `<div style="padding:12px;text-align:center;color:#6b7280;font-size:13px">No results for "${filter}"</div>`;
}
renderPinned(); renderRecommended();

$('#start-search').addEventListener('input', e=>{
  const v = e.target.value.trim();
  renderPinned(v);
  renderRecommended(v);
});

// Panels toggling
let startOpen=false, widgetsOpen=false, quickOpen=false, notifOpen=false, taskViewOpen=false;
function closeAllPanels(){
  startOpen=false; $('#start-menu').classList.remove('open'); $('#start-btn').classList.remove('active');
  widgetsOpen=false; $('#widgets-panel').classList.remove('open');
  quickOpen=false; $('#quick-settings').classList.remove('open');
  notifOpen=false; $('#notification-center').classList.remove('open');
  taskViewOpen=false; $('#task-view').classList.remove('open');
}
function closeStart(){ startOpen=false; $('#start-menu').classList.remove('open'); $('#start-btn').classList.remove('active'); }
$('#start-btn').addEventListener('click', (e)=>{
  e.stopPropagation();
  const willOpen = !startOpen;
  closeAllPanels();
  if(willOpen){ $('#start-menu').classList.add('open'); $('#start-btn').classList.add('active'); startOpen=true; setTimeout(()=> $('#start-search').focus(), 100); }
});
$('#widgets-btn').addEventListener('click', e=>{
  e.stopPropagation(); const will= !widgetsOpen; closeAllPanels();
  if(will){ $('#widgets-panel').classList.add('open'); widgetsOpen=true; }
});
$('#close-widgets').addEventListener('click', ()=> { widgetsOpen=false; $('#widgets-panel').classList.remove('open'); });

$('#taskview-btn').addEventListener('click', e=>{
  e.stopPropagation(); const will=!taskViewOpen; closeAllPanels();
  if(will){ renderTaskView(); $('#task-view').classList.add('open'); taskViewOpen=true; }
});
$('#close-taskview').addEventListener('click', ()=> { taskViewOpen=false; $('#task-view').classList.remove('open'); });

$('#quicksettings-btn').addEventListener('click', e=>{
  e.stopPropagation(); const will=!quickOpen; const wasNotif=notifOpen; closeAllPanels();
  if(will && !wasNotif){ $('#quick-settings').classList.add('open'); quickOpen=true; }
});
$('#notif-btn').addEventListener('click', e=>{
  e.stopPropagation(); const will=!notifOpen; closeAllPanels();
  if(will){ $('#notification-center').classList.add('open'); notifOpen=true; }
});
$('#clear-notifs').addEventListener('click', ()=> { $('#notif-list').innerHTML = `<div style="padding:20px;text-align:center;color:#6b7280;font-size:13px">No new notifications</div>`; toast('Notifications cleared','All caught up'); });

document.addEventListener('click', (e)=>{
  if(!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) { if(startOpen) closeStart(); }
  if(!e.target.closest('#widgets-panel') && !e.target.closest('#widgets-btn')) { if(widgetsOpen){ widgetsOpen=false; $('#widgets-panel').classList.remove('open'); } }
  if(!e.target.closest('#quick-settings') && !e.target.closest('#quicksettings-btn')) { if(quickOpen){ quickOpen=false; $('#quick-settings').classList.remove('open'); } }
  if(!e.target.closest('#notification-center') && !e.target.closest('#notif-btn')) { if(notifOpen){ notifOpen=false; $('#notification-center').classList.remove('open'); } }
  if(!e.target.closest('#task-view') && !e.target.closest('#taskview-btn')) { /* keep task view open until close btn or click window */}
  if(!e.target.closest('#desktop-context')) $('#desktop-context').classList.remove('open');
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){ closeAllPanels(); $('#desktop-context').classList.remove('open'); }
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); $('#start-btn').click(); }
  if(e.key==='Meta' || e.key==='OS') { e.preventDefault(); $('#start-btn').click(); }
});

// Toast
function toast(title, msg, color='#0078D4', icon='✓'){
  const c = $('#toasts');
  const el = document.createElement('div');
  el.className='toast';
  el.innerHTML = `<span class="t-icon" style="background:${color}">${icon}</span><div><b>${title}</b><p>${msg}</p></div>`;
  c.appendChild(el);
  setTimeout(()=> { el.style.opacity='0'; el.style.transform='translateX(12px)'; setTimeout(()=> el.remove(), 300); }, 3400);
}

// Window Manager
let zCounter = 20;
let windows = []; // {id, app, title, el, minimized, maximized, desktop, prevRect}
let activeId = null;
let desktops = [{id:0, name:'Desktop 1', windows:[]}, {id:1, name:'Desktop 2', windows:[]}];
let currentDesktop = 0;
let winIdSeq = 1;

const windowsEl = $('#windows');

function getDesktopWindows(){ return windows.filter(w=> w.desktop===currentDesktop && !w.minimized); }

function bringToFront(id){
  const w = windows.find(x=>x.id===id);
  if(!w) return;
  zCounter++;
  w.el.style.zIndex = zCounter;
  windows.forEach(x=> x.el.classList.toggle('active', x.id===id));
  activeId = id;
  syncTaskbar();
  // show window if hidden by desktop
  syncDesktopVisibility();
}

function syncDesktopVisibility(){
  windows.forEach(w=>{
    if(w.desktop !== currentDesktop){
      w.el.style.display = 'none';
    } else {
      w.el.style.display = w.minimized ? 'none' : 'flex';
    }
  });
  $$('.desktop-thumb').forEach((el,i)=>{
    el.classList.toggle('active', i===currentDesktop);
  });
  syncTaskbar();
  renderTaskView();
}

function syncTaskbar(){
  const bar = $('#running-apps');
  bar.innerHTML='';
  windows.filter(w=> w.desktop===currentDesktop).forEach(w=>{
    const btn = document.createElement('button');
    btn.className='task-icon' + (w.id===activeId && !w.minimized ? ' active':'');
    btn.title = w.title;
    btn.innerHTML = getAppIconMini(w.app);
    if(w.minimized) btn.style.opacity='.6';
    btn.addEventListener('click', ()=>{
      if(w.minimized){
        w.minimized=false;
        w.el.style.display='flex';
        bringToFront(w.id);
      } else if(activeId===w.id){
        // minimize
        minimizeWindow(w.id);
      } else {
        bringToFront(w.id);
      }
    });
    bar.appendChild(btn);
  });
  // also highlight dock icons for app running?
  $$('.taskbar-center .task-icon[data-app]').forEach(btn=>{
    const app = btn.dataset.app;
    const isRunning = windows.some(w=> w.app===app && w.desktop===currentDesktop);
    btn.classList.toggle('active', isRunning && windows.some(w=> w.app===app && w.id===activeId && !w.minimized));
  });
}

function getAppIconMini(app){
  switch(app){
    case 'explorer': return `<svg width="18" height="16" viewBox="0 0 24 20" fill="#FFCA28"><path d="M2 6l2-3h6l2 3h8v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/><path d="M2 6h20v2H2z" fill="#FFA000"/></svg>`;
    case 'edge': return `<span class="edge-icon" style="width:20px;height:20px;font-size:12px">e</span>`;
    case 'store': return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7l2-2h14l2 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" fill="white" stroke="#10B981" stroke-width="1.2"/><path d="M8 10h8M12 7v7" stroke="#10B981" stroke-width="1.2" stroke-linecap="round"/></svg>`;
    case 'notepad': return `<span style="width:20px;height:20px;border-radius:4px;background:#60A5FA;display:grid;place-items:center;color:white;font-size:10px">≡</span>`;
    case 'calculator': return `<span style="width:20px;height:20px;border-radius:4px;background:#A78BFA;display:grid;place-items:center;color:white;font-size:11px">±</span>`;
    case 'settings': return `<span style="font-size:14px">⚙</span>`;
    case 'vscode': return `<span style="width:20px;height:20px;border-radius:4px;background:#007ACC;display:grid;place-items:center;color:white;font-size:10px">&lt;/&gt;</span>`;
    case 'photos': return `<span style="width:20px;height:20px;border-radius:4px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:grid;place-items:center;color:white;font-size:10px">◐</span>`;
    default: return `<span style="font-size:12px">⬢</span>`;
  }
}

function getAppMeta(app){
  const map={
    explorer:{title:'File Explorer', icon:'<svg width="16" height="16" viewBox="0 0 24 20" fill="#FFCA28"><path d="M2 6l2-3h6l2 3h8v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>'},
    edge:{title:'Microsoft Edge', icon:'<span style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#0c59a4,#35b6ed);display:inline-grid;place-items:center;color:white;font-size:10px">e</span>'},
    store:{title:'Microsoft Store', icon:'<span style="color:#10B981">🛍</span>'},
    notepad:{title:'Notepad', icon:'<span>📝</span>'},
    calculator:{title:'Calculator', icon:'<span>🧮</span>'},
    settings:{title:'Settings', icon:'<span>⚙</span>'},
    vscode:{title:'Visual Studio Code', icon:'<span style="color:#007ACC">&lt;/&gt;</span>'},
    photos:{title:'Photos', icon:'<span>🖼</span>'},
  };
  return map[app] || {title: app, icon:'⬢'};
}

function createWindow(app, opts={}){
  // if single instance, focus existing
  const existing = windows.find(w=> w.app===app && w.desktop===currentDesktop && !w.minimized && (app==='settings' || app==='calculator' || app==='store' || app==='explorer' ? false : true));
  // For explorer we allow multiple but okay to focus if same path?
  // Always create new for now except calculator/settings - limit one
  const single = ['calculator','settings','vscode'].includes(app);
  if(single){
    const ex = windows.find(w=> w.app===app && w.desktop===currentDesktop);
    if(ex){ if(ex.minimized){ ex.minimized=false; ex.el.style.display='flex'; } bringToFront(ex.id); return ex.id; }
  }

  const id = winIdSeq++;
  const meta = getAppMeta(app);
  const title = opts.title || meta.title;
  const icon = opts.icon || meta.icon;

  const win = document.createElement('div');
  win.className='window active';
  win.dataset.id = id;
  win.style.zIndex = ++zCounter;

  // default size/position cascade
  const idx = windows.filter(w=> w.desktop===currentDesktop).length;
  const offset = 28 * (idx % 4);
  const w = opts.width || (app==='calculator'? 320 : app==='vscode'? 900 : 720);
  const h = opts.height || (app==='calculator'? 460 : app==='vscode'? 520 : 480);
  const vw = window.innerWidth, vh = window.innerHeight - 48;
  const left = opts.left ?? Math.max(12, Math.min(vw - w - 20, 160 + offset));
  const top = opts.top ?? Math.max(12, Math.min(vh - h - 20, 80 + offset));
  win.style.left = left+'px'; win.style.top = top+'px'; win.style.width = w+'px'; win.style.height = h+'px';

  win.innerHTML = `
    <div class="titlebar">
      <span class="titlebar-icon">${icon}</span>
      <span class="titlebar-title">${title}</span>
      <div class="titlebar-controls">
        <button class="min-btn" title="Minimize">—</button>
        <div class="snap-trigger">
          <button class="max-btn" title="Maximize">${app==='calculator'?'□':'▢'}</button>
          <div class="snap-popup">
            <button class="snap-option" data-layout="halves"><span class="active"></span><span class="active"></span></button>
            <button class="snap-option" data-layout="sidebar"><span class="active" style="flex:1.2"></span><span class="active" style="flex:.8"></span></button>
            <button class="snap-option" data-layout="thirds"><span class="active"></span><span class="active"></span><span class="active"></span></button>
            <button class="snap-option" data-layout="grid"><span class="active"></span><span class="active"></span><span class="active"></span><span class="active"></span></button>
            <button class="snap-option" data-layout="left-stack"><span class="active"></span><span style="display:flex;flex-direction:column;gap:3px;flex:1"><span class="active" style="flex:1"></span><span class="active" style="flex:1"></span></span></button>
            <button class="snap-option" data-layout="triple"><span class="active"></span><span class="active" style="flex:1.4"></span><span class="active"></span></button>
          </div>
        </div>
        <button class="close" title="Close">✕</button>
      </div>
    </div>
    <div class="window-body">${getAppHTML(app, opts)}</div>
    <div class="window-resize n"></div><div class="window-resize s"></div><div class="window-resize e"></div><div class="window-resize w"></div>
    <div class="window-resize ne"></div><div class="window-resize nw"></div><div class="window-resize se"></div><div class="window-resize sw"></div>
  `;

  windowsEl.appendChild(win);
  const winObj = {id, app, title, el: win, minimized:false, maximized:false, desktop: currentDesktop, prevRect:null};
  windows.push(winObj);
  // focus
  windows.forEach(x=> x.el.classList.remove('active'));
  win.classList.add('active'); activeId=id;
  desktops[currentDesktop].windows.push(id);

  // events
  win.addEventListener('mousedown', ()=> bringToFront(id));

  win.querySelector('.close').addEventListener('click', ()=> closeWindow(id));
  win.querySelector('.min-btn').addEventListener('click', ()=> minimizeWindow(id));
  win.querySelector('.max-btn').addEventListener('click', ()=> toggleMaximize(id));
  win.querySelectorAll('.snap-option').forEach(o=>{
    o.addEventListener('click', (e)=>{
      e.stopPropagation();
      handleSnap(id, o.dataset.layout);
    });
  });

  // drag
  const titlebar = win.querySelector('.titlebar');
  makeDraggable(winObj, titlebar);
  makeResizable(winObj);
  initApp(win, app, opts);

  syncTaskbar();
  syncDesktopVisibility();
  bringToFront(id);
  return id;
}

function closeWindow(id){
  const idx = windows.findIndex(w=> w.id===id);
  if(idx===-1) return;
  const w = windows[idx];
  w.el.style.transform='scale(.96)'; w.el.style.opacity='0';
  setTimeout(()=> {
    w.el.remove();
    windows.splice(idx,1);
    desktops.forEach(d=> d.windows = d.windows.filter(x=> x!==id));
    if(activeId===id) activeId = windows.filter(x=> x.desktop===currentDesktop && !x.minimized).slice(-1)[0]?.id || null;
    syncTaskbar();
    renderTaskView();
    if(activeId) bringToFront(activeId);
  }, 140);
}
function minimizeWindow(id){
  const w = windows.find(x=> x.id===id);
  if(!w) return;
  w.minimized = true;
  w.el.style.transition='all .22s cubic-bezier(.2,.8,.2,1)';
  w.el.style.transform='scale(.88) translateY(20px)';
  w.el.style.opacity='0';
  setTimeout(()=> { w.el.style.display='none'; w.el.style.transform=''; w.el.style.opacity=''; w.el.style.transition=''; syncTaskbar(); renderTaskView(); }, 220);
}
function toggleMaximize(id){
  const w = windows.find(x=> x.id===id);
  if(!w) return;
  const el = w.el;
  if(!w.maximized){
    w.prevRect = {left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height};
    el.style.left='0px'; el.style.top='0px'; el.style.width='100%'; el.style.height='calc(100% - 0px)';
    el.style.borderRadius='0';
    el.classList.add('maximized');
    w.maximized=true;
  } else {
    if(w.prevRect){
      el.style.left=w.prevRect.left; el.style.top=w.prevRect.top; el.style.width=w.prevRect.width; el.style.height=w.prevRect.height;
    }
    el.style.borderRadius='';
    el.classList.remove('maximized');
    w.maximized=false;
  }
}
function handleSnap(id, layout){
  const w = windows.find(x=> x.id===id);
  if(!w) return;
  const el = w.el;
  w.maximized=false; el.classList.remove('maximized'); el.style.borderRadius='';
  const r = windowsEl.getBoundingClientRect();
  // snap to half etc - for MVP snap only this window, but create overlay hint for other slot
  // layouts: halves -> left 50, sidebar, thirds, grid, left-stack, triple
  // For single window MVP: just snap to appropriate region
  const map = {
    halves: {left:'0', top:'0', width:'50%', height:'100%'},
    sidebar: {left:'0', top:'0', width:'60%', height:'100%'},
    thirds: {left:'0', top:'0', width:'33.33%', height:'100%'},
    grid: {left:'0', top:'0', width:'50%', height:'50%'},
    'left-stack': {left:'0', top:'0', width:'50%', height:'100%'},
    triple: {left:'0', top:'0', width:'33.33%', height:'100%'},
  };
  const rect = map[layout] || map.halves;
  // we need pixel calc because container is absolute
  const vw = windowsEl.clientWidth, vh = windowsEl.clientHeight;
  function perc(v, total){ return v.endsWith('%') ? (parseFloat(v)/100*total)+'px' : v; }
  el.style.left = perc(rect.left, vw);
  el.style.top = perc(rect.top, vh);
  el.style.width = perc(rect.width, vw);
  el.style.height = perc(rect.height, vh);
  el.style.transition='all .24s cubic-bezier(.2,.8,.2,1)';
  setTimeout(()=> el.style.transition='', 260);
  toast('Snap Layout', layout==='halves'?'Window snapped left • Select another window to fill':'Window snapped • ' + layout, '#0078D4','⊞');
  // show snap overlay for partner selection simulation - auto open first other window to right if exists
  const other = windows.find(x=> x.id!==id && x.desktop===currentDesktop && !x.minimized);
  if(other){
    // snap other to complementary region
    const comp = {
      halves: {left:'50%', top:'0', width:'50%', height:'100%'},
      sidebar: {left:'60%', top:'0', width:'40%', height:'100%'},
      thirds: {left:'33.33%', top:'0', width:'33.33%', height:'100%'},
      grid: {left:'50%', top:'0', width:'50%', height:'50%'},
    }[layout];
    if(comp){
      other.el.style.left = perc(comp.left, vw);
      other.el.style.top = perc(comp.top, vh);
      other.el.style.width = perc(comp.width, vw);
      other.el.style.height = perc(comp.height, vh);
      other.maximized=false; other.el.classList.remove('maximized');
    }
  }
}

// Drag logic
function makeDraggable(winObj, handle){
  let startX, startY, startL, startT, dragging=false, moved=false;
  let snapPreview=null;
  handle.addEventListener('mousedown', (e)=>{
    if(e.target.closest('button') || e.target.closest('.snap-popup')) return;
    if(winObj.maximized) return; // cannot drag maximized
    e.preventDefault();
    startX=e.clientX; startY=e.clientY;
    startL=parseInt(winObj.el.style.left)||0;
    startT=parseInt(winObj.el.style.top)||0;
    dragging=true; moved=false;
    winObj.el.style.transition='none';
    bringToFront(winObj.id);
    document.body.style.userSelect='none';
    const onMove=(ev)=>{
      if(!dragging) return;
      const dx=ev.clientX-startX, dy=ev.clientY-startY;
      if(Math.abs(dx)>2||Math.abs(dy)>2) moved=true;
      let nl=startL+dx, nt=startT+dy;
      // clamp
      const vw=windowsEl.clientWidth, vh=windowsEl.clientHeight, w=winObj.el.offsetWidth, h=winObj.el.offsetHeight;
      nl=Math.max(-w+80, Math.min(vw-80, nl));
      nt=Math.max(0, Math.min(vh-40, nt));
      winObj.el.style.left=nl+'px'; winObj.el.style.top=nt+'px';
      // snap edge detection
      const threshold=18;
      const overlay=$('#snap-overlay');
      let snap=null;
      if(ev.clientY < 28) snap='top';
      else if(ev.clientX < threshold) snap='left';
      else if(ev.clientX > window.innerWidth - threshold) snap='right';
      if(snap){
        overlay.innerHTML=''; overlay.className=''; overlay.style.display='grid';
        overlay.style.gridTemplateColumns = snap==='left'||snap==='right' ? '1fr 1fr' : '1fr 1fr 1fr';
        // preview
        if(snap==='left'){ overlay.innerHTML='<div class="snap-preview" style="grid-column:1"></div><div></div>'; overlay.classList.add('show')}
        if(snap==='right'){ overlay.innerHTML='<div></div><div class="snap-preview" style="grid-column:2"></div>'; overlay.classList.add('show')}
        if(snap==='top'){ overlay.innerHTML='<div class="snap-preview" style="grid-column:1/-1"></div>'; overlay.style.gridTemplateColumns='1fr'; overlay.classList.add('show')}
        snapPreview=snap;
      } else {
        $('#snap-overlay').classList.remove('show'); $('#snap-overlay').style.display=''; snapPreview=null;
      }
    };
    const onUp=(ev)=>{
      dragging=false; document.body.style.userSelect=''; winObj.el.style.transition='';
      $('#snap-overlay').classList.remove('show'); $('#snap-overlay').innerHTML=''; $('#snap-overlay').style.display='';
      if(snapPreview){
        if(snapPreview==='left') handleSnap(winObj.id,'halves');
        else if(snapPreview==='right'){ handleSnap(winObj.id,'halves'); // will snap left, then move to right?
          // actually move to right side: override
          const vw=windowsEl.clientWidth, vh=windowsEl.clientHeight;
          winObj.el.style.left=(vw/2)+'px'; winObj.el.style.top='0px'; winObj.el.style.width=(vw/2)+'px'; winObj.el.style.height='100%';
        }
        else if(snapPreview==='top') toggleMaximize(winObj.id);
      }
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  handle.addEventListener('dblclick', ()=> toggleMaximize(winObj.id));
}

function makeResizable(winObj){
  const dirs = ['n','s','e','w','ne','nw','se','sw'];
  dirs.forEach(d=>{
    const h=winObj.el.querySelector(`.window-resize.${d}`);
    if(!h) return;
    h.addEventListener('mousedown', e=>{
      e.preventDefault(); e.stopPropagation();
      bringToFront(winObj.id);
      const startX=e.clientX, startY=e.clientY;
      const rect=winObj.el.getBoundingClientRect();
      const startW=rect.width, startH=rect.height, startL=rect.left, startT=rect.top;
      winObj.el.style.transition='none';
      const onMove=ev=>{
        let dx=ev.clientX-startX, dy=ev.clientY-startY;
        let nl=startL, nt=startT, nw=startW, nh=startH;
        if(d.includes('e')) nw=startW+dx;
        if(d.includes('s')) nh=startH+dy;
        if(d.includes('w')){ nw=startW-dx; nl=startL+dx; }
        if(d.includes('n')){ nh=startH-dy; nt=startT-dy; }
        nw=Math.max(320, Math.min(window.innerWidth-20, nw));
        nh=Math.max(180, Math.min(window.innerHeight-48-20, nh));
        // clamp position if resizing from left/top
        const containerRect=windowsEl.getBoundingClientRect();
        if(d.includes('w')){
          const maxL = startL + startW - 320;
          nl=Math.min(maxL, nl); nl=Math.max(containerRect.left, nl);
          // adjust width if clamped
          if(nl===containerRect.left) nw = startL+startW - nl;
        }
        if(d.includes('n')){
          const maxT = startT + startH - 180;
          nt=Math.min(maxT, nt); nt=Math.max(containerRect.top, nt);
          if(nt===containerRect.top) nh = startT+startH - nt;
        }
        winObj.el.style.width=nw+'px'; winObj.el.style.height=nh+'px';
        winObj.el.style.left=(nl - containerRect.left)+'px';
        winObj.el.style.top=(nt - containerRect.top)+'px';
        winObj.maximized=false; winObj.el.classList.remove('maximized'); winObj.el.style.borderRadius='';
      };
      const onUp=()=>{
        winObj.el.style.transition='';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}

// App HTML generators
function getAppHTML(app, opts){
  switch(app){
    case 'explorer': return explorerHTML(opts);
    case 'edge': return edgeHTML();
    case 'store': return storeHTML();
    case 'notepad': return notepadHTML(opts);
    case 'calculator': return calculatorHTML();
    case 'settings': return settingsHTML();
    case 'vscode': return vscodeHTML();
    case 'photos': return photosHTML();
    default: return `<div style="padding:24px">App not found</div>`;
  }
}
function explorerHTML(opts){
  const path = opts.path || 'This PC';
  return `
  <div class="explorer">
    <div class="command-bar">
      <button class="primary">＋ New</button>
      <button><span>✂</span> Cut</button>
      <button><span>⎘</span> Copy</button>
      <button><span>⎗</span> Paste</button>
      <button><span>🗑</span> Delete</button>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button title="List view" data-view="list">≡</button>
        <button title="Grid view" data-view="grid" style="background:#e0f2fe">⊞</button>
      </div>
    </div>
    <div class="explorer-toolbar">
      <button class="exp-nav-btn" data-nav="back">‹</button>
      <button class="exp-nav-btn" data-nav="forward" disabled>›</button>
      <button class="exp-nav-btn" data-nav="up">↑</button>
      <div class="path-bar" id="path-bar"></div>
      <div class="search-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg><input placeholder="Search" id="explorer-search"></div>
    </div>
    <div class="explorer-main">
      <div class="explorer-sidebar">
        <div class="sidebar-section"><h4>Home</h4>
          <div class="sidebar-item active" data-path="This PC"><span>🏠</span> Home</div>
          <div class="sidebar-item" data-path="This PC"><span>🖥</span> This PC</div>
        </div>
        <div class="sidebar-section"><h4>Quick access</h4>
          <div class="sidebar-item" data-path="Documents"><span>📄</span> Documents</div>
          <div class="sidebar-item" data-path="Downloads"><span>⬇</span> Downloads</div>
          <div class="sidebar-item" data-path="Pictures"><span>🖼</span> Pictures</div>
          <div class="sidebar-item" data-path="Desktop"><span>🖥</span> Desktop</div>
        </div>
        <div class="sidebar-section"><h4>Drives</h4>
          <div class="sidebar-item" data-path="This PC"><span>💾</span> Windows (C:)</div>
          <div class="sidebar-item" data-path="This PC"><span>💾</span> Data (D:)</div>
        </div>
        <div class="sidebar-section"><h4>Network</h4>
          <div class="sidebar-item"><span>🌐</span> Network</div>
        </div>
      </div>
      <div class="explorer-content" id="explorer-content"></div>
    </div>
  </div>`;
}
function edgeHTML(){
  return `
  <div class="browser">
    <div class="browser-tabs">
      <div class="b-tab"><span style="color:#0c59a4">●</span> New Tab <span style="margin-left:auto">✕</span></div>
      <div class="b-tab inactive"><span>📄</span> Windows 11 Docs</div>
      <button style="width:28px;height:28px;border-radius:50%;border:none;background:transparent;cursor:pointer">＋</button>
    </div>
    <div class="browser-bar">
      <button>‹</button><button>›</button><button>↻</button>
      <div class="address-bar"><span style="color:#10B981">🔒</span><input value="https://www.bing.com/search?q=Windows+11+MVP" /><span style="color:#6b7280">☆</span></div>
      <button>⋯</button>
    </div>
    <div class="browser-content">
      <div style="display:flex;align-items:center;gap:12px"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/120px-Microsoft_logo_%282012%29.svg.png" height="22"><span style="font-size:22px;font-weight:300">Bing</span></div>
      <h1 style="margin-top:18px">Good morning, Avery</h1>
      <div class="mock-search"><input placeholder="Search the web"><button style="padding:10px 18px;border-radius:20px;border:none;background:#0078D4;color:white;cursor:pointer">Search</button></div>
      <div class="mock-links">
        <span class="chip">📁 Work</span><span class="chip">📊 Excel Online</span><span class="chip">💬 Teams</span><span class="chip">📝 OneNote</span><span class="chip">☁ OneDrive</span>
      </div>
      <div style="margin-top:22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
        <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:12px;display:flex;gap:10px;align-items:center"><span style="width:36px;height:36px;border-radius:8px;background:#0078D4;display:grid;place-items:center;color:white">W</span><div><b style="font-size:13px">Windows 11</b><div style="font-size:12px;color:#6b7280">Meet the new Windows</div></div></div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:12px"><b style="font-size:13px">Snap Layouts</b><div style="font-size:12px;color:#6b7280;margin-top:4px">Organize windows instantly — hover the maximize button.</div></div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:12px"><b style="font-size:13px">TPM 2.0 Required</b><div style="font-size:12px;color:#6b7280;margin-top:4px">Your device is secure and ready.</div><span style="font-size:11px;color:#059669">✓ Secure Boot active</span></div>
        <div style="background:linear-gradient(135deg,#e0f2fe,#f0f9ff);border:1px solid #bae6fd;border-radius:10px;padding:12px"><b style="font-size:13px">Try Microsoft Store</b><div style="font-size:12px;color:#475569;margin-top:4px">Discover apps for productivity & creativity.</div><button onclick="window._openApp('store')" style="margin-top:8px;padding:6px 12px;border-radius:6px;border:none;background:#0284c7;color:white;cursor:pointer;font-size:12px">Open Store</button></div>
      </div>
      <div style="margin-top:18px;background:white;border:1px solid #e5e7eb;border-radius:10px;padding:14px">
        <b style="font-size:13px">In the spotlight</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
          <img src="https://picsum.photos/seed/bloom/400/200" style="width:100%;border-radius:8px;height:120px;object-fit:cover">
          <div><b style="font-size:14px">The beauty of Windows 11 bloom</b><p style="font-size:12px;color:#6b7280;line-height:1.5">A fresh, calm visual language with rounded corners, mica material and centered navigation — designed for focus and flow.</p></div>
        </div>
      </div>
    </div>
  </div>`;
}
function storeHTML(){
  return `
  <div class="store">
    <div class="store-hero">
      <div><h2>Essential apps for your MVP</h2><p>Curated productivity tools — one click away</p></div>
      <button onclick="document.getElementById('store-search')?.focus()">Search Store</button>
    </div>
    <div style="padding:0 16px;display:flex;gap:8px;align-items:center">
      <div style="flex:1;display:flex;align-items:center;gap:8px;background:white;border:1px solid rgba(0,0,0,.08);border-radius:8px;padding:8px 12px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/></svg><input id="store-search" placeholder="Search apps, games, movies" style="flex:1;border:none;outline:none;font-size:13px"></div>
      <select style="padding:8px 10px;border-radius:8px;border:1px solid rgba(0,0,0,.08);background:white;font-size:13px"><option>All categories</option><option>Productivity</option><option>Creativity</option></select>
    </div>
    <div class="store-apps">
      <div class="store-section"><h3>Featured • Productivity</h3><div class="store-grid" id="store-grid"></div></div>
      <div class="store-section"><h3>Top free apps</h3><div class="store-grid" id="store-grid2"></div></div>
    </div>
  </div>`;
}
function notepadHTML(opts){
  const content = opts.content || `Welcome to Notepad — Windows 11 Web MVP ✦

• Clean, modern interface
• Snap Layouts: hover maximize to organize
• Virtual Desktops for focus
• File Explorer, Store, Edge, and more

Tip: Try dragging this window to the screen edges or using Snap Layouts!

— Built for productivity and calm.`;
  return `
  <div class="notepad">
    <div class="notepad-menu"><span>File</span><span>Edit</span><span>View</span><span style="margin-left:auto;font-size:11px;color:#6b7280">UTF-8 • LF • 100%</span></div>
    <textarea id="notepad-text">${content}</textarea>
  </div>`;
}
function calculatorHTML(){
  return `
  <div class="calc">
    <div class="calc-display"><small id="calc-history"></small><div id="calc-display">0</div></div>
    <div class="calc-grid">
      <button data-c="%">%</button><button data-c="CE">CE</button><button data-c="C">C</button><button data-c="⌫">⌫</button>
      <button data-c="1/x">¹⁄ₓ</button><button data-c="x²">x²</button><button data-c="√">√x</button><button data-c="÷" class="op">÷</button>
      <button data-c="7">7</button><button data-c="8">8</button><button data-c="9">9</button><button data-c="×" class="op">×</button>
      <button data-c="4">4</button><button data-c="5">5</button><button data-c="6">6</button><button data-c="−" class="op">−</button>
      <button data-c="1">1</button><button data-c="2">2</button><button data-c="3">3</button><button data-c="+" class="op">+</button>
      <button data-c="±">±</button><button data-c="0">0</button><button data-c=".">.</button><button data-c="=" class="equals">=</button>
    </div>
  </div>`;
}
function settingsHTML(){
  return `
  <div class="settings">
    <div class="settings-sidebar">
      <h3>Settings</h3>
      <div class="settings-nav">
        <button class="active"><span>🎨</span> Personalization</button>
        <button><span>🔊</span> System</button>
        <button><span>🌐</span> Bluetooth & devices</button>
        <button><span>📶</span> Network & internet</button>
        <button><span>👤</span> Accounts</button>
        <button><span>⏰</span> Time & language</button>
        <button><span>🎮</span> Gaming</button>
        <button><span>♿</span> Accessibility</button>
        <button><span>🔒</span> Privacy & security</button>
        <button><span>🔄</span> Windows Update</button>
      </div>
    </div>
    <div class="settings-content">
      <h2>Personalization</h2>
      <p>Make your MVP feel like yours — light, calm, and focused.</p>
      <div class="setting-card"><span class="icon">🌓</span><div class="meta"><b>Theme</b><small>Light • Acrylic and rounded corners</small></div><div class="toggle on" data-toggle="theme"></div></div>
      <div class="setting-card"><span class="icon">🖼</span><div class="meta"><b>Background</b><small>Bloom • Windows 11 signature gradient</small></div><button style="padding:6px 12px;border-radius:6px;border:1px solid rgba(0,0,0,.08);background:white;cursor:pointer;font-size:12px">Browse</button></div>
      <div class="setting-card"><span class="icon">🎯</span><div class="meta"><b>Taskbar alignment</b><small>Centered • The heart of the new design</small></div><div class="toggle on"></div></div>
      <div class="setting-card"><span class="icon">🔔</span><div class="meta"><b>Notifications</b><small>Get alerts from apps and system</small></div><div class="toggle on"></div></div>
      <div class="setting-card" style="background:#eff6ff;border-color:#bfdbfe"><span class="icon" style="background:#dbeafe">🛡</span><div class="meta"><b>Security baseline</b><small style="color:#1e40af">TPM 2.0 • Secure Boot • Windows Hello — all active</small></div><span style="font-size:12px;color:#1d4ed8;font-weight:600">✓ Secure</span></div>
      <div style="margin-top:18px;padding:14px;background:#f9fafb;border:1px dashed #d1d5db;border-radius:8px;font-size:12px;color:#6b7280">MVP Thinking: security and reliability are non-negotiable foundations. Everything else — widgets, Teams, gaming — layers on top.</div>
    </div>
  </div>`;
}
function vscodeHTML(){
  return `
  <div class="vscode">
    <div class="vs-sidebar">≡<span>⧉</span><span>🔍</span><span>⑂</span><span>🐛</span><span style="margin-top:auto">⚙</span></div>
    <div class="vs-explorer">
      <h4>Explorer</h4>
      <div style="font-weight:600;margin:8px 0 6px">WIN11-WEB</div>
      <div class="vs-file active">› index.html</div>
      <div class="vs-file">› src/style.css</div>
      <div class="vs-file">› src/main.js</div>
      <div class="vs-file">› README.md</div>
      <div style="margin-top:12px;color:#858585;font-size:11px">OUTLINE</div>
      <div style="margin-top:8px;display:flex;gap:6px"><span style="background:#007ACC;color:white;padding:2px 6px;border-radius:4px;font-size:11px">MVP</span><span style="font-size:11px;color:#858585">Zero build, instant preview</span></div>
    </div>
    <div class="vs-editor"><span class="cm">// Windows 11 Web MVP — core value: let users run apps smoothly</span>
<span class="kw">function</span> <span class="fn">createWindow</span>(app) {
  <span class="kw">const</span> win = <span class="str">"acrylic + rounded + shadow"</span>;
  <span class="kw">return</span> {
    productivity: <span class="str">"Snap Layouts + Virtual Desktops"</span>,
    interface: <span class="str">"Centered Start • Mica"</span>,
    security: <span class="str">"TPM 2.0 baseline"</span>,
    performance: <span class="str">"Fast wake, smart scheduling"</span>
  };
}
<span class="cm">// Try: File Explorer → snap me left, Edge → snap right</span>
<span class="fn">toast</span>(<span class="str">"Tip"</span>, <span class="str">"Drag windows to edges to snap!"</span>);
</div>
  </div>`;
}
function photosHTML(){
  return `<div class="gallery">
    ${[1,2,3,4,5,6,7,8].map(i=> `<div class="gallery-item"><img src="https://picsum.photos/seed/win11${i}/400/300" alt=""></div>`).join('')}
  </div>`;
}

function initApp(winEl, app, opts){
  if(app==='explorer') initExplorer(winEl, opts);
  if(app==='store') initStore(winEl);
  if(app==='calculator') initCalculator(winEl);
  if(app==='settings') initSettings(winEl);
  // notepad, edge have no extra init for now
}
function initExplorer(winEl, opts){
  let currentPath = opts.path || 'This PC';
  let view = 'grid';
  let history = ['This PC'];
  let hIdx = 0;
  const contentEl = winEl.querySelector('#explorer-content');
  const pathBar = winEl.querySelector('#path-bar');
  const searchInput = winEl.querySelector('#explorer-search');
  const sidebarItems = winEl.querySelectorAll('.sidebar-item');

  function render(){
    // path bar
    const parts = currentPath.split(' › ');
    pathBar.innerHTML = parts.map((p,i)=> `<span data-part="${p}">${p}</span>${i<parts.length-1?'<span class="sep">›</span>':''}`).join('');
    pathBar.querySelectorAll('span[data-part]').forEach(s=>{
      s.addEventListener('click', ()=>{
        const target = s.dataset.part;
        // naive: jump to that segment
        currentPath = parts.slice(0, parts.indexOf(target)+1).join(' › ');
        render();
      });
    });
    // files
    const files = fileSystem[currentPath] || fileSystem['This PC'] || [];
    const filter = (searchInput.value||'').toLowerCase();
    const filtered = files.filter(f=> f.name.toLowerCase().includes(filter));
    contentEl.className = 'explorer-content ' + (view==='grid'?'':'files-list');
    if(view==='grid'){
      contentEl.innerHTML = `<div class="files-grid">${filtered.map(f=>`
        <div class="file-item" data-name="${f.name}" data-type="${f.type}">
          <span class="file-icon" style="background:${f.type==='folder' || f.type==='drive'?'#e0f2fe':'#f3f4f6'}">${f.icon}</span>
          <span class="file-name">${f.name}</span>
          <span class="file-meta">${f.size}</span>
        </div>
      `).join('')}${filtered.length? '': '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#6b7280">No items match your search.</div>'}</div>`;
    } else {
      contentEl.innerHTML = `
        <div style="display:flex;gap:12px;padding:8px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;text-transform:uppercase;letter-spacing:.06em"><span style="flex:1">Name</span><span style="width:120px">Size</span><span style="width:100px">Date</span></div>
        <div class="files-list">${filtered.map(f=>`
        <div class="file-item" data-name="${f.name}" data-type="${f.type}">
          <span class="file-icon" style="background:${f.type==='folder'?'#e0f2fe':'#f3f4f6'}">${f.icon}</span>
          <span class="file-name" style="flex:1">${f.name}</span>
          <span class="file-meta" style="width:120px">${f.size}</span>
          <span class="file-meta" style="width:100px">${f.date}</span>
        </div>`).join('')}</div>`;
    }
    contentEl.querySelectorAll('.file-item').forEach(el=>{
      el.addEventListener('click', ()=> {
        contentEl.querySelectorAll('.file-item').forEach(x=> x.classList.remove('selected'));
        el.classList.add('selected');
      });
      el.addEventListener('dblclick', ()=>{
        const name = el.dataset.name, type = el.dataset.type;
        if(type==='folder'){
          // navigate
          if(fileSystem[name]){
            history = history.slice(0, hIdx+1); history.push(name); hIdx++;
            currentPath = name;
            updateNavButtons();
            render();
          } else {
            // create virtual folder
            fileSystem[name] = [
              {name:'New Document.txt', type:'text', size:'1 KB', date:'Today', icon:'📝'},
              {name:'Image.png', type:'image', size:'2.3 MB', date:'Today', icon:'🖼'},
            ];
            history.push(name); hIdx++; currentPath=name; updateNavButtons(); render();
            toast('File Explorer', `Opened ${name}`, '#FFCA28','📁');
          }
        } else if(type==='image'){
          createWindow('photos', {title: name, width:560, height:420});
        } else if(type==='text' || type==='doc'){
          createWindow('notepad', {title: name + ' - Notepad', content: `Content of ${name}\n\nThis is a preview of your document in the Windows 11 Web MVP.\n\nTry Snap Layouts to organize this window!`});
        } else if(type==='drive'){
          toast('Drive', `${name} — ${el.querySelector('.file-meta').textContent}`, '#3A96DD','💾');
        } else {
          toast('File Explorer', `Opened ${name}`, '#0078D4','📄');
        }
      });
    });
    sidebarItems.forEach(s=> s.classList.toggle('active', s.dataset.path===currentPath));
  }
  function updateNavButtons(){
    const backBtn = winEl.querySelector('[data-nav="back"]');
    const fwdBtn = winEl.querySelector('[data-nav="forward"]');
    const upBtn = winEl.querySelector('[data-nav="up"]');
    backBtn.disabled = hIdx===0;
    fwdBtn.disabled = hIdx===history.length-1;
    upBtn.disabled = currentPath==='This PC';
  }
  winEl.querySelector('[data-nav="back"]').addEventListener('click', ()=>{
    if(hIdx>0){ hIdx--; currentPath=history[hIdx]; render(); updateNavButtons(); }
  });
  winEl.querySelector('[data-nav="forward"]').addEventListener('click', ()=>{
    if(hIdx<history.length-1){ hIdx++; currentPath=history[hIdx]; render(); updateNavButtons(); }
  });
  winEl.querySelector('[data-nav="up"]').addEventListener('click', ()=>{
    if(currentPath!=='This PC'){ currentPath='This PC'; history.push(currentPath); hIdx=history.length-1; render(); updateNavButtons(); }
  });
  sidebarItems.forEach(s=>{
    s.addEventListener('click', ()=>{
      const p = s.dataset.path;
      if(p){ currentPath=p; history.push(p); hIdx=history.length-1; render(); updateNavButtons(); }
    });
  });
  winEl.querySelectorAll('[data-view]').forEach(b=>{
    b.addEventListener('click', ()=>{
      view = b.dataset.view;
      winEl.querySelectorAll('[data-view]').forEach(x=> x.style.background='');
      b.style.background='#e0f2fe';
      render();
    });
  });
  searchInput.addEventListener('input', render);
  render(); updateNavButtons();
}
function initStore(winEl){
  const grid = winEl.querySelector('#store-grid');
  const grid2 = winEl.querySelector('#store-grid2');
  const search = winEl.querySelector('#store-search');
  function renderStore(filter=''){
    const list = storeApps.filter(a=> a.name.toLowerCase().includes(filter.toLowerCase()) || a.cat.toLowerCase().includes(filter.toLowerCase()));
    const half = Math.ceil(list.length/2);
    const first = list.slice(0, half), second = list.slice(half);
    function card(a){
      return `<div class="app-card" data-app="${a.name}">
        <div class="app-card-top"><span class="app-card-icon" style="background:${a.color}">${a.letter}</span><div><b>${a.name}</b><br><small>${a.cat}</small></div></div>
        <p>${a.desc}</p>
        <div class="app-card-footer"><span class="rating">★ ${a.rating}</span><span style="font-size:11px;color:#6b7280">Free</span><button class="${a.installed?'installed':''}">${a.installed?'Installed':'Get'}</button></div>
      </div>`;
    }
    grid.innerHTML = first.map(card).join('') || `<div style="padding:20px;color:#6b7280">No apps found for "${filter}"</div>`;
    grid2.innerHTML = second.map(card).join('') || ``;
    winEl.querySelectorAll('.app-card button').forEach(btn=>{
      btn.addEventListener('click', e=>{
        e.stopPropagation();
        const card = btn.closest('.app-card');
        const name = card.dataset.app;
        const app = storeApps.find(x=> x.name===name);
        if(btn.classList.contains('installed')){
          toast('Microsoft Store', `${name} is already installed`, '#10B981','✓');
          return;
        }
        btn.textContent='Installing…'; btn.disabled=true;
        setTimeout(()=>{
          btn.textContent='Installed'; btn.classList.add('installed'); btn.disabled=false;
          if(app) app.installed=true;
          toast('Microsoft Store', `${name} installed successfully`, '#10B981','📦');
          // add to notification center
          const n = document.createElement('div'); n.className='notif'; n.innerHTML=`<span class="n-icon" style="background:#10B981">📦</span><div><b>Microsoft Store</b><p>${name} installed successfully</p><span>just now</span></div>`;
          $('#notif-list').prepend(n);
        }, 900);
      });
    });
    winEl.querySelectorAll('.app-card').forEach(c=>{
      c.addEventListener('click', ()=>{
        toast('Microsoft Store', `Viewing ${c.dataset.app}`, '#0078D4','🛍');
      });
    });
  }
  renderStore();
  search.addEventListener('input', e=> renderStore(e.target.value));
}
function initCalculator(winEl){
  let display = '0', history='', waiting=false, lastOp=null, acc=0;
  const dEl = winEl.querySelector('#calc-display');
  const hEl = winEl.querySelector('#calc-history');
  function update(){ dEl.textContent=display; hEl.textContent=history; }
  function input(v){
    if(v>='0' && v<='9'){
      if(display==='0' || waiting){ display=v; waiting=false; } else if(display.length<12) display+=v;
    } else if(v==='.'){
      if(waiting){ display='0.'; waiting=false; } else if(!display.includes('.')) display+='.';
    } else if(['+','−','×','÷'].includes(v)){
      const op = v;
      const num = parseFloat(display);
      if(lastOp && !waiting){
        acc = calc(acc, num, lastOp);
        display = String(trim(acc));
      } else acc = num;
      lastOp=op; history = `${trim(acc)} ${op}`; waiting=true;
    } else if(v==='='){
      if(lastOp){
        const num=parseFloat(display);
        acc = calc(acc, num, lastOp);
        history=''; display=String(trim(acc)); lastOp=null; waiting=true;
      }
    } else if(v==='C'){ display='0'; history=''; acc=0; lastOp=null; waiting=false; }
    else if(v==='CE'){ display='0'; }
    else if(v==='⌫'){ display = display.length>1 ? display.slice(0,-1) : '0'; }
    else if(v==='±'){ display = String(-parseFloat(display)); }
    else if(v==='x²'){ display = String(trim(Math.pow(parseFloat(display),2))); waiting=true; }
    else if(v==='√'){ display = String(trim(Math.sqrt(parseFloat(display)))); waiting=true; }
    else if(v==='1/x'){ display = String(trim(1/parseFloat(display))); waiting=true; }
    else if(v==='%'){ display = String(trim(parseFloat(display)/100)); }
    update();
  }
  function calc(a,b,op){
    if(op==='+' ) return a+b;
    if(op==='−' ) return a-b;
    if(op==='×' ) return a*b;
    if(op==='÷' ) return b===0?0:a/b;
    return b;
  }
  function trim(n){ return Math.round(n*1e8)/1e8; }
  winEl.querySelectorAll('[data-c]').forEach(b=> b.addEventListener('click', ()=> input(b.dataset.c)));
  update();
  // keyboard
  winEl.addEventListener('keydown', e=>{
    const map={Enter:'=', Escape:'C', Backspace:'⌫'};
    let k = map[e.key]||e.key;
    if(k==='*') k='×'; if(k==='/') k='÷'; if(k==='-') k='−';
    if([...winEl.querySelectorAll('[data-c]')].some(b=> b.dataset.c===k)) input(k);
  });
  winEl.setAttribute('tabindex','0'); winEl.focus();
}
function initSettings(winEl){
  winEl.querySelectorAll('.toggle').forEach(t=>{
    t.addEventListener('click', ()=> {
      t.classList.toggle('on');
      toast('Settings', t.classList.contains('on')?'Enabled':'Disabled', '#6B7280','⚙');
    });
  });
  winEl.querySelectorAll('.settings-nav button').forEach(b=>{
    b.addEventListener('click', ()=> {
      winEl.querySelectorAll('.settings-nav button').forEach(x=> x.classList.remove('active'));
      b.classList.add('active');
      toast('Settings', `Opened ${b.textContent.trim()}`, '#0078D4','⚙');
    });
  });
}

// Open app helpers
function openApp(app, opts={}){
  switch(app){
    case 'explorer': createWindow('explorer', {path: opts.path || 'This PC', width:780, height:500}); break;
    case 'edge': createWindow('edge', {width:880, height:560}); break;
    case 'store': createWindow('store', {width:820, height:540}); break;
    case 'notepad': createWindow('notepad', {width:560, height:380, ...opts}); break;
    case 'calculator': createWindow('calculator'); break;
    case 'settings': createWindow('settings', {width:820, height:500}); break;
    case 'vscode': createWindow('vscode'); break;
    case 'photos': createWindow('photos', {width:720, height:480, title:'Photos'}); break;
    case 'search': $('#start-btn').click(); setTimeout(()=> $('#start-search').focus(), 120); break;
    default: toast('Coming soon', `${app} will be available in a future update.`, '#6B7280','✦');
  }
}
window._openApp = openApp;

// Taskbar app buttons
$$('.task-icon[data-app]').forEach(btn=>{
  btn.addEventListener('click', ()=> openApp(btn.dataset.app));
});
// Desktop icons
$$('.desktop-icon').forEach(icon=>{
  let clicks=0;
  icon.addEventListener('click', ()=>{
    clicks++;
    if(clicks===1){ setTimeout(()=> clicks=0, 400); $$('.desktop-icon').forEach(i=> i.classList.remove('selected')); icon.classList.add('selected'); }
  });
  icon.addEventListener('dblclick', ()=>{
    const app = icon.dataset.app; const path = icon.dataset.path;
    if(app==='explorer') openApp('explorer', {path: path||'This PC'});
    else openApp(app);
    $$('.desktop-icon').forEach(i=> i.classList.remove('selected'));
  });
  // also single click open for touch friendliness after 2 quick clicks? double click is main
  icon.addEventListener('click', (e)=>{
    if(e.detail===2){} // handled
  });
});

// Right click desktop -> context menu
const desktopContext = $('#desktop-context');
document.addEventListener('contextmenu', e=>{
  // if on window, ignore? still show desktop menu only if not on window
  if(e.target.closest('.window') || e.target.closest('#taskbar') || e.target.closest('#start-menu') || e.target.closest('.context-menu')) return;
  e.preventDefault();
  desktopContext.style.left = Math.min(window.innerWidth-240, e.clientX)+'px';
  desktopContext.style.top = Math.min(window.innerHeight-48-200, e.clientY)+'px';
  desktopContext.classList.add('open');
});
$('#ctx-new-folder').addEventListener('click', ()=>{
  const name = 'New folder';
  if(!fileSystem['This PC'].some(f=> f.name===name)){
    fileSystem['This PC'].unshift({name, type:'folder', size:'—', date:'Today', icon:'📁'});
    toast('File Explorer', 'New folder created on Desktop', '#FFCA28','📁');
  }
  desktopContext.classList.remove('open');
});

// Virtual Desktops / Task View
function renderTaskView(){
  const bar = $('#desktops-bar');
  if(!bar) return;
  bar.innerHTML = desktops.map((d,idx)=>`
    <div class="desktop-thumb ${idx===currentDesktop?'active':''}" data-idx="${idx}">
      <div class="dt-preview">${windows.filter(w=> w.desktop===idx).length ? windows.filter(w=> w.desktop===idx).map(w=> `<span style="display:inline-block;padding:2px 6px;margin:2px;background:white;border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.08);font-size:11px">${getAppIconMini(w.app)}</span>`).join('') : 'No open windows'}</div>
      <div class="dt-label"><span>${d.name}</span>${desktops.length>1?`<button data-close="${idx}">✕</button>`:''}</div>
    </div>
  `).join('');
  bar.querySelectorAll('.desktop-thumb').forEach(el=>{
    el.addEventListener('click', e=>{
      if(e.target.closest('button[data-close]')) return;
      currentDesktop = parseInt(el.dataset.idx);
      syncDesktopVisibility();
      $('#task-view').classList.remove('open'); taskViewOpen=false;
    });
    const closeBtn = el.querySelector('button[data-close]');
    if(closeBtn){
      closeBtn.addEventListener('click', e=>{
        e.stopPropagation();
        const idx = parseInt(closeBtn.dataset.close);
        if(desktops.length<=1) return;
        // move windows to current desktop
        windows.forEach(w=> { if(w.desktop===idx) w.desktop = currentDesktop; });
        desktops.splice(idx,1);
        if(currentDesktop>=desktops.length) currentDesktop=desktops.length-1;
        desktops.forEach((d,i)=> d.name=`Desktop ${i+1}`);
        renderTaskView(); syncDesktopVisibility();
      });
    }
  });
  const tvWindows = $('#tv-windows');
  const curWins = windows.filter(w=> w.desktop===currentDesktop);
  if(!curWins.length){
    tvWindows.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:#6b7280"><div style="font-size:28px;margin-bottom:8px">⊞</div><b>No windows open</b><div style="font-size:13px;margin-top:4px">Open an app to see it here. Try File Explorer or Edge.</div><button onclick="window._openApp('explorer')" style="margin-top:12px;padding:8px 14px;border-radius:6px;border:none;background:#0078D4;color:white;cursor:pointer">Open File Explorer</button></div>`;
  } else {
    tvWindows.innerHTML = curWins.map(w=>`
      <div class="tv-win" data-id="${w.id}">
        <div class="tv-win-header"><span style="background:#60A5FA"></span> ${w.title} <span style="margin-left:auto;cursor:pointer" data-close="${w.id}">✕</span></div>
        <div class="tv-win-body">${w.app==='explorer'?'📁 File Explorer':w.app==='edge'?'🌐 Microsoft Edge':w.app==='store'?'🛍 Store':w.title}</div>
      </div>
    `).join('');
    tvWindows.querySelectorAll('.tv-win').forEach(el=>{
      el.addEventListener('click', e=>{
        if(e.target.closest('[data-close]')){ closeWindow(parseInt(e.target.dataset.close)); renderTaskView(); return; }
        const id=parseInt(el.dataset.id);
        $('#task-view').classList.remove('open'); taskViewOpen=false;
        const w=windows.find(x=> x.id===id);
        if(w){ if(w.minimized){ w.minimized=false; w.el.style.display='flex'; } bringToFront(id); }
      });
    });
  }
}
$('#new-desktop').addEventListener('click', ()=>{
  if(desktops.length>=4){ toast('Desktops', 'Maximum 4 desktops allowed', '#6B7280','🖥'); return; }
  desktops.push({id:Date.now(), name:`Desktop ${desktops.length+1}`, windows:[]});
  currentDesktop = desktops.length-1;
  syncDesktopVisibility(); renderTaskView();
  toast('Desktops', `Switched to ${desktops[currentDesktop].name}`, '#0078D4','🖥');
});

renderTaskView();

// Snap overlay click to clear
$('#snap-overlay').addEventListener('click', ()=> { $('#snap-overlay').classList.remove('show'); $('#snap-overlay').innerHTML=''; });

// Show desktop (tray)
$('.tray-show-desktop').addEventListener('click', ()=>{
  const anyVisible = windows.some(w=> w.desktop===currentDesktop && !w.minimized);
  if(anyVisible){
    windows.filter(w=> w.desktop===currentDesktop).forEach(w=>{ w.minimized=true; w.el.style.display='none'; });
  } else {
    windows.filter(w=> w.desktop===currentDesktop).forEach(w=>{ w.minimized=false; w.el.style.display='flex'; });
    if(windows.filter(w=> w.desktop===currentDesktop).length) bringToFront(windows.filter(w=> w.desktop===currentDesktop).slice(-1)[0].id);
  }
  syncTaskbar(); renderTaskView();
});

// Demo: open initial windows to showcase MVP
setTimeout(()=>{
  createWindow('explorer', {path:'This PC', width:760, height:460, left:120, top:70});
}, 1800);
setTimeout(()=>{
  createWindow('edge', {width:560, height:420, left:420, top:140});
}, 2200);

// Keyboard shortcuts
document.addEventListener('keydown', e=>{
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='d'){ e.preventDefault(); $('.tray-show-desktop').click(); }
  if(e.key==='F11'){ e.preventDefault(); if(activeId) toggleMaximize(activeId); }
  // Win+Z for snap (simulate)
  if((e.metaKey || e.altKey) && e.key.toLowerCase()==='z'){
    e.preventDefault();
    if(activeId){
      const w=windows.find(x=> x.id===activeId);
      if(w) w.el.querySelector('.max-btn')?.dispatchEvent(new MouseEvent('mouseenter', {bubbles:true}));
      toast('Snap Layouts', 'Hover the maximize button to choose a layout', '#0078D4','⊞');
    }
  }
  if(e.altKey && e.key==='Tab'){ e.preventDefault(); $('#taskview-btn').click(); }
});

// Slider interactions
$('#brightness').addEventListener('input', e=> toast('Display', `Brightness ${e.target.value}%`, '#F59E0B','☀'));
$('#volume').addEventListener('input', e=> toast('Sound', `Volume ${e.target.value}%`, '#10B981','🔊'));

// Prevent dragging image
document.addEventListener('dragstart', e=> e.preventDefault());

// Resize handling - keep windows in bounds
window.addEventListener('resize', ()=>{
  windows.forEach(w=>{
    const el=w.el;
    if(w.maximized) return;
    const vw=windowsEl.clientWidth, vh=windowsEl.clientHeight;
    let l=parseInt(el.style.left)||0, t=parseInt(el.style.top)||0, ww=el.offsetWidth, hh=el.offsetHeight;
    if(l+ww>vw) el.style.left=(vw-ww-8)+'px';
    if(t+hh>vh) el.style.top=(vh-hh-8)+'px';
    if(l<0) el.style.left='8px';
    if(t<0) el.style.top='8px';
  });
});

// Expose for debug
window.createWindow = createWindow;
window.openApp = openApp;

