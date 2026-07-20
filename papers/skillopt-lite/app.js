const RESULTS = {"GPT-4o": {"SearchQA": [64.6, 70.1, 71.5], "Spreadsheet": [44.1, 48.7, 49.8], "ALFWorld": [82.3, 95.3, 97.8], "LiveMath": [25.9, 31.2, 58.8], "OfficeQA": [21.0, 30.2, 32.4], "DocVQA": [78.3, 85.2, 86.4]}, "GPT-5.4-nano": {"SearchQA": [50.9, 68.8, 66.9], "Spreadsheet": [29.9, 51.6, 66.2], "ALFWorld": [34.3, 71.8, 81.3], "LiveMath": [26.4, 30.3, 55.7], "OfficeQA": [10.8, 18.4, 15.5], "DocVQA": [63.4, 80.4, 82.1]}, "GPT-5.4-mini": {"SearchQA": [69.6, 72.3, 73.1], "Spreadsheet": [28.2, 47.5, 73.3], "ALFWorld": [82.3, 100.0, 100.0], "LiveMath": [34.9, 41.2, 63.2], "OfficeQA": [23.0, 32.1, 30.4], "DocVQA": [85.3, 90.9, 92.5]}, "GPT-5.4": {"SearchQA": [68.3, 77.5, 76.3], "Spreadsheet": [39.9, 61.5, 79.4], "ALFWorld": [88.1, 100.0, 100.0], "LiveMath": [46.2, 54.0, 66.0], "OfficeQA": [29.7, 40.2, 45.3], "DocVQA": [87.7, 90.3, 91.2]}, "GPT-5.5": {"SearchQA": [72.4, 78.8, 79.0], "Spreadsheet": [37.4, 76.2, 79.7], "ALFWorld": [90.1, 100.0, 100.0], "LiveMath": [36.6, 64.8, 73.6], "OfficeQA": [33.2, 72.2, 76.2], "DocVQA": [89.0, 91.2, 94.2]}};
const HARNESS = {"GPT-5.4-nano": [29.89, 51.6, 66.19, 76.51, 77.58], "GPT-5.4-mini": [28.21, 47.5, 73.31, 81.14, 82.56], "GPT-5.4": [39.86, 61.5, 79.36, 83.63, 85.05], "GPT-5.5": [37.37, 76.2, 79.72, 83.63, 85.77]};
const BENCHES = ["SearchQA","Spreadsheet","ALFWorld","LiveMath","OfficeQA","DocVQA"];
const METHODS = ["Init","SkillOpt","SkillOpt-Lite"];
const METHOD_COLORS = ["#9da6aa","#526dc9","#237a68"];
const H_METHODS = ["Init","SkillOpt","SkillOpt-Lite","HarnessOpt w/o skill","HarnessOpt + skill"];

async function loadPage() {
  const app = document.getElementById('app');
  try {
    const responses = await Promise.all(['content-a.html','content-b.html'].map(path => fetch(path)));
    if (responses.some(r => !r.ok)) throw new Error('页面片段加载失败');
    const parts = await Promise.all(responses.map(r => r.text()));
    app.innerHTML = parts.join('');
    initPage();
  } catch (error) {
    app.innerHTML = `<main class="wrap" style="padding:5rem 1rem"><div class="warning"><div>⚠</div><div><strong>页面内容加载失败。</strong><br>请刷新页面，或直接阅读 <a href="https://arxiv.org/abs/2607.03451">论文原文</a>。<br><small>${String(error)}</small></div></div></main>`;
  }
}

function initPage() {
  const modelSelect = document.getElementById('modelSelect');
  const harnessSelect = document.getElementById('harnessSelect');
  Object.keys(RESULTS).forEach(m => modelSelect.add(new Option(m,m)));
  Object.keys(HARNESS).forEach(m => harnessSelect.add(new Option(m,m)));
  modelSelect.value = 'GPT-5.5';
  harnessSelect.value = 'GPT-5.4-nano';

  const fmt = n => Number(n).toFixed(1);
  const signed = n => `${n > 0 ? '+' : ''}${n.toFixed(1)}`;

  function renderResultChart(model){
    const root = document.getElementById('resultBars'); root.innerHTML = '';
    BENCHES.forEach(bench => {
      const row = document.createElement('div'); row.className = 'bench-row';
      row.innerHTML = `<div class="bench-name">${bench}</div><div class="bar-stack"></div>`;
      const stack = row.querySelector('.bar-stack');
      RESULTS[model][bench].forEach((v,i) => {
        const line = document.createElement('div'); line.className = 'bar-line';
        line.innerHTML = `<span>${METHODS[i]}</span><div class="bar-track"><div class="bar-fill" style="--bar:${METHOD_COLORS[i]}"></div></div><span class="bar-value">${fmt(v)}</span>`;
        stack.appendChild(line);
        requestAnimationFrame(()=> line.querySelector('.bar-fill').style.width = `${v}%`);
      });
      root.appendChild(row);
    });
    renderSummary(model);
  }

  function allRows(){
    return Object.entries(RESULTS).flatMap(([model,benches]) => Object.entries(benches).map(([bench,v]) => ({model,bench,init:v[0],skill:v[1],lite:v[2],delta:v[2]-v[1]})));
  }
  function avg(arr){return arr.reduce((a,b)=>a+b,0)/arr.length}
  function renderSummary(model){
    const rows = BENCHES.map(b => RESULTS[model][b]);
    const d = rows.map(v=>v[2]-v[1]);
    const wins=d.filter(x=>x>1e-9).length, ties=d.filter(x=>Math.abs(x)<=1e-9).length, losses=d.filter(x=>x< -1e-9).length;
    const bestIndex = d.indexOf(Math.max(...d));
    document.getElementById('resultSummary').innerHTML = `
      <div class="sketch"><div class="mini-label">${model}</div><div class="metric">${avg(rows.map(v=>v[2])).toFixed(2)}</div><div class="stat-note">Lite 六基准宏平均</div></div>
      <div class="sketch"><div class="mini-label">相对 SkillOpt</div><div class="metric">${signed(avg(d))}</div><div class="stat-note">平均百分点</div></div>
      <div class="sketch"><div class="mini-label">胜 / 平 / 负</div><div class="metric">${wins} / ${ties} / ${losses}</div><div class="stat-note">该模型的六项对照</div></div>
      <div class="sketch"><div class="mini-label">最大单项增益</div><div class="metric">${signed(Math.max(...d))}</div><div class="stat-note">${BENCHES[bestIndex]}</div></div>`;
  }

  function renderHeatmap(){
    const root = document.getElementById('heatmap'); root.innerHTML='';
    root.appendChild(Object.assign(document.createElement('div'),{className:'heat-head',textContent:'模型 / Δ'}));
    BENCHES.forEach(b=>root.appendChild(Object.assign(document.createElement('div'),{className:'heat-head',textContent:b})));
    Object.entries(RESULTS).forEach(([model,benches])=>{
      root.appendChild(Object.assign(document.createElement('div'),{className:'heat-model',textContent:model}));
      BENCHES.forEach(b=>{
        const v=benches[b], d=v[2]-v[1], cell=document.createElement('div'); cell.className='heat-cell';
        const intensity=Math.min(Math.abs(d)/28,1);
        const rgb=d>0?'35,122,104':d<0?'185,66,66':'157,166,170';
        cell.style.background=`rgba(${rgb},${0.12+intensity*.68})`;
        cell.style.color=intensity>.48?'#fff':'var(--ink)';
        cell.title=`${model} · ${b}: SkillOpt ${v[1]}, Lite ${v[2]}, Δ ${signed(d)}`;
        cell.innerHTML=`${signed(d)}<small>${v[1]} → ${v[2]}</small>`; root.appendChild(cell);
      });
    });
  }

  function renderHarness(model){
    const root=document.getElementById('harnessBars'); root.innerHTML='';
    HARNESS[model].forEach((v,i)=>{
      const row=document.createElement('div'); row.className='h-row';
      row.innerHTML=`<strong>${H_METHODS[i]}</strong><div class="h-track"><div class="h-fill"></div></div><span class="bar-value">${v.toFixed(2)}</span>`;
      root.appendChild(row); requestAnimationFrame(()=>row.querySelector('.h-fill').style.width=`${v}%`);
    });
  }

  function downloadCSV(){
    const lines=['model,benchmark,init,skillopt,skillopt_lite,delta_lite_vs_skillopt'];
    allRows().forEach(r=>lines.push([r.model,r.bench,r.init,r.skill,r.lite,r.delta.toFixed(1)].join(',')));
    const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='skillopt-lite-table2.csv';a.click();URL.revokeObjectURL(a.href);
  }

  modelSelect.addEventListener('change',e=>renderResultChart(e.target.value));
  harnessSelect.addEventListener('change',e=>renderHarness(e.target.value));
  document.getElementById('csvBtn').addEventListener('click',downloadCSV);
  document.getElementById('printBtn').addEventListener('click',()=>window.print());
  const themeStore = {
    get(){ try { return localStorage.getItem('skillopt-theme'); } catch (_) { return null; } },
    set(v){ try { localStorage.setItem('skillopt-theme',v); } catch (_) {} }
  };
  document.getElementById('themeBtn').addEventListener('click',()=>{
    document.body.classList.toggle('dark'); themeStore.set(document.body.classList.contains('dark')?'dark':'light');
  });
  if(themeStore.get()==='dark')document.body.classList.add('dark');
  addEventListener('scroll',()=>{
    const max=document.documentElement.scrollHeight-innerHeight;
    document.getElementById('progress').style.width=`${max>0?scrollY/max*100:0}%`;
  },{passive:true});

  renderResultChart(modelSelect.value); renderHeatmap(); renderHarness(harnessSelect.value);
}

loadPage();
