(() => {
  'use strict';

  const E = window.SoundtrackEngine;
  const DIMS = ['drama','romance','danger','mystery','hope','loneliness','nostalgia','chaos','power','freedom','melancholy','tenderness','rebellion','darkness','epic','energy'];
  const SOURCES = ['alternative','gothic-industrial','modern-heavy','female-alternative','classic-rock','russian-rock','dark-folk','soundtracks','anime','metal-rock'];
  const EQ = [
    ['drama','Драма'],['romance','Романтика'],['danger','Опасность'],['mystery','Тайна'],['hope','Надежда'],['loneliness','Одиночество'],['nostalgia','Ностальгия'],['chaos','Хаос'],
    ['power','Сила'],['freedom','Свобода'],['melancholy','Меланхолия'],['tenderness','Нежность'],['rebellion','Бунт'],['darkness','Тьма'],['epic','Эпичность'],['energy','Энергия']
  ];
  const REL = [
    ['семья','Семья'],['родственники','Родственники'],['друзья','Друзья'],['лучшие друзья','Лучшие друзья'],['союзники','Союзники'],['напарники','Напарники'],['наставник и ученик','Наставник и ученик'],['соперники','Соперники'],['враги','Враги'],['бывшие союзники','Бывшие союзники'],['бывшие близкие','Бывшие близкие'],['любовники','Любовники'],['неразделённые чувства','Неразделённые чувства'],['взаимное притяжение','Взаимное притяжение'],['сложная привязанность','Сложная привязанность'],['взаимная неприязнь','Взаимная неприязнь'],['долг','Долг'],['клятва','Клятва'],['контракт','Контракт'],['должник и кредитор','Должник и кредитор'],['защитник и подопечный','Защитник и подопечный'],['случайные знакомые','Случайные знакомые'],['соседи','Соседи'],['коллеги','Коллеги'],['работодатель и работник','Работодатель и работник'],['учитель и ученик','Учитель и ученик'],['политические союзники','Политические союзники'],['сообщники','Сообщники'],['фамильяр и хозяин','Фамильяр и хозяин'],['создатель и творение','Создатель и творение'],['создатель и мнимыш','Создатель и мнимыш'],['связанные общей тайной','Связанные общей тайной'],['связанные проклятием','Связанные проклятием'],['охотник и добыча','Охотник и добыча'],['охотник и сверхъестественное существо','Охотник и сверхъестественное существо'],['вампир и донор','Вампир и донор'],['оборотень и альфа','Оборотень и альфа'],['член одного клана','Член одного клана'],['член одной стаи','Член одной стаи'],['связанные судьбой','Связанные судьбой'],['небесный и падший','Небесный и падший'],['демон и заключивший контракт','Демон и заключивший контракт'],['соперники за одну цель','Соперники за одну цель']
  ];
  const TRAJ = [
    ['no_change','Ничего не меняется'],['strangers_to_friends','От чужих к друзьям'],['strangers_to_enemies','От чужих к врагам'],['enemies_to_allies','От врагов к союзникам'],['rivals_to_allies','От соперников к союзникам'],['friends_to_enemies','От друзей к врагам'],['trust_to_betrayal','От доверия к предательству'],['attachment_to_freedom','От привязанности к свободе'],['alienation_to_reunion','От отчуждения к примирению'],['protector_to_protected','От защитника к равным'],['hunter_to_hunted','Охотник становится добычей'],['mentor_to_equal','От наставника к равным'],['forced_allies_to_true_bond','От вынужденного союза к настоящей связи'],['enemies_to_lovers','От вражды к любви'],['loss_to_recovery','От утраты к восстановлению'],['redemption','Искупление'],['descent','Падение']
  ];

  let options = null, scoring = null, music = [];
  const visualState = {s:{portrait:'',images:[]},p1:{portrait:'',images:[]},p2:{portrait:'',images:[]}};
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c));
  const clamp = (n,a=0,b=10) => Math.max(a,Math.min(b,Number(n)||0));
  const blank = () => Object.fromEntries(DIMS.map(k => [k,0]));
  const add = (p,m) => { if(!m) return p; for(const [k,v] of Object.entries(m)) if(k in p && Number.isFinite(v)) p[k]+=v; return p; };
  const normalize = p => Object.fromEntries(DIMS.map(k => [k,clamp(p[k])]));

  function renderOptions(){
    const race=options.races||[], roles=options.roles||[], spheres=options.life_spheres||[], starts=options.starting_points||[], current=options.current_arcs||[], future=options.future_arcs||[];
    const fill=(id,items)=>{const el=$(id);el.innerHTML='';items.forEach((x,i)=>{const o=document.createElement('option');o.value=x.id??x;o.textContent=x.label??x;if(i===0)o.selected=true;el.appendChild(o);});};
    fill('s-race',race);fill('s-role',roles);fill('s-sphere',spheres);fill('s-start',starts);fill('s-current',current);fill('s-future',future);
    ['p1','p2'].forEach(prefix=>{
      $(prefix+'-fields').innerHTML=`<div class="field"><label>Имя</label><input id="${prefix}-name" type="text" placeholder="Персонаж"></div><div class="field"><label>Раса</label><select id="${prefix}-race"></select></div><div class="field"><label>Роль</label><select id="${prefix}-role"></select></div><div class="field"><label>Сфера жизни</label><select id="${prefix}-sphere"></select></div><div class="field"><label>Отправная точка</label><select id="${prefix}-start"></select></div><div class="field"><label>Текущая линия</label><select id="${prefix}-current"></select></div><div class="field"><label>Возможное будущее</label><select id="${prefix}-future"></select></div>`;
      fill(prefix+'-race',race);fill(prefix+'-role',roles);fill(prefix+'-sphere',spheres);fill(prefix+'-start',starts);fill(prefix+'-current',current);fill(prefix+'-future',future);
    });
    const rel=$('p-rel');rel.innerHTML='';REL.forEach(([v,l])=>rel.add(new Option(l,v)));rel.value='друзья';
    const tr=$('p-traj');tr.innerHTML='';TRAJ.forEach(([v,l])=>tr.add(new Option(l,v)));tr.value='no_change';
  }

  function renderEq(id,prefix){
    const el=$(id);el.innerHTML='';EQ.forEach(([k,label])=>{const box=document.createElement('div');box.className='slider';box.innerHTML=`<label><span>${label}</span><span id="${prefix}-${k}-v">5</span></label><input id="${prefix}-${k}" type="range" min="0" max="10" step="1" value="5">`;el.appendChild(box);box.querySelector('input').addEventListener('input',e=>$(prefix+'-'+k+'-v').textContent=e.target.value);});
  }

  function fileToDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
  function renderVisualEditor(containerId,prefix,title){
    $(containerId).innerHTML=`<section class="visual-card"><div class="visual-head"><h2>${esc(title)}</h2><span class="visual-note">Фото можно дать ссылкой или загрузить с устройства</span></div><div class="portrait-row"><div class="field" style="margin:0"><label>Главное фото персонажа</label><input id="${prefix}-portrait-url" type="url" placeholder="https://…"><input id="${prefix}-portrait-file" class="file-input" type="file" accept="image/*"></div><div id="${prefix}-portrait-preview"></div></div><div style="margin-top:18px"><h3>4–6 изображений, которые его/её характеризуют</h3><div class="small">Например: место, предмет, одежда, символ, пейзаж, деталь или важная сцена.</div><div id="${prefix}-gallery" class="gallery-grid"></div></div></section>`;
    const gallery=$(prefix+'-gallery');
    for(let i=0;i<6;i++){
      const slot=document.createElement('div');slot.className='visual-slot';slot.innerHTML=`<label>Изображение ${i+1}${i<4?' · обязательно':' · необязательно'}</label><input id="${prefix}-img-url-${i}" type="url" placeholder="Ссылка на изображение"><input id="${prefix}-img-file-${i}" type="file" accept="image/*">`;gallery.appendChild(slot);
      $(prefix+'-img-url-'+i).addEventListener('input',()=>{visualState[prefix].images[i]=$(prefix+'-img-url-'+i).value.trim();renderVisualPreview(prefix);});
      $(prefix+'-img-file-'+i).addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;visualState[prefix].images[i]=await fileToDataURL(f);renderVisualPreview(prefix);});
    }
    $(prefix+'-portrait-url').addEventListener('input',()=>{visualState[prefix].portrait=$(prefix+'-portrait-url').value.trim();renderVisualPreview(prefix);});
    $(prefix+'-portrait-file').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;visualState[prefix].portrait=await fileToDataURL(f);renderVisualPreview(prefix);});
    renderVisualPreview(prefix);
  }
  function renderVisualPreview(prefix){
    const state=visualState[prefix], p=$(prefix+'-portrait-preview');
    if(p){p.innerHTML=state.portrait?`<div class="portrait-preview"><img src="${esc(state.portrait)}" alt="Портрет"></div>`:'';}
  }
  function visualGallery(prefix){return visualState[prefix].images.filter(Boolean).slice(0,6);}
  function renderVisualOutput(prefix,label){
    const state=visualState[prefix],imgs=visualGallery(prefix);if(!state.portrait&&!imgs.length)return '';
    return `<div class="visual-output"><div class="small"><b>${esc(label)}</b></div>${state.portrait?`<div class="portrait-preview"><img src="${esc(state.portrait)}" alt="${esc(label)}"></div>`:''}${imgs.length?`<div class="visual-output-gallery">${imgs.map((src,i)=>`<figure><img src="${esc(src)}" alt="Образ ${i+1}"></figure>`).join('')}</div>`:''}</div>`;
  }

  function readCharacter(prefix){
    const p=blank();EQ.forEach(([k])=>p[k]=Number($(prefix+'-'+k).value));
    const race=$(prefix+'-race').value,role=$(prefix+'-role').value,sphere=$(prefix+'-sphere').value,start=$(prefix+'-start').value,current=$(prefix+'-current').value,future=$(prefix+'-future').value;
    const roleMods={};
    const localRoleMods={'герой':{hope:1,epic:1},'антигерой':{drama:1,darkness:1,rebellion:1},'злодей':{danger:1,darkness:2,power:1},'трикстер':{chaos:2,freedom:1,energy:1},'изгой':{loneliness:2,freedom:1},'избранный':{epic:2,power:1,drama:1},'исследователь':{mystery:2,drama:1},'искатель':{mystery:1,freedom:1,hope:1},'защитник':{tenderness:1,power:1,hope:1},'хранитель':{mystery:1,nostalgia:1},'проводник':{mystery:2,freedom:1},'странник':{freedom:2,loneliness:1},'беглец':{freedom:2,danger:1,loneliness:1},'изгнанник':{loneliness:2,rebellion:1},'одиночка':{loneliness:2,freedom:1},'лидер':{power:2,epic:1},'наследник':{power:1,nostalgia:1,drama:1},'правитель':{power:2,drama:1},'аристократ':{power:1,nostalgia:1,romance:1},'детектив':{mystery:2,drama:1},'охотник':{danger:2,rebellion:1,power:1},'телохранитель':{danger:1,power:2,tenderness:1},'солдат':{danger:2,drama:1,epic:1},'ветеран':{nostalgia:2,melancholy:1,drama:1},'наёмник':{danger:2,freedom:1},'шпион':{mystery:2,danger:1},'преступник':{danger:2,rebellion:1,chaos:1},'вор':{freedom:2,chaos:1},'целитель':{hope:2,tenderness:2},'медик':{hope:1,tenderness:1,drama:1},'оккультист':{mystery:2,darkness:1},'прорицатель':{mystery:2,epic:1,nostalgia:1},'медиум':{mystery:2,loneliness:1,nostalgia:1},'архивист':{nostalgia:2,mystery:1},'учёный':{mystery:1,energy:1},'инженер':{energy:1,power:1},'программист':{mystery:1,energy:2},'хакер':{rebellion:2,energy:2,freedom:1},'художник':{romance:1,melancholy:1,energy:1},'писатель':{drama:1,mystery:1,nostalgia:1},'поэт':{romance:1,melancholy:2},'музыкант':{energy:1,romance:1,nostalgia:1},'актёр':{drama:2,romance:1},'журналист':{mystery:1,drama:1,rebellion:1},'преподаватель':{hope:1,tenderness:1},'спортсмен':{energy:2,power:1},'врач':{hope:1,tenderness:1,drama:1},'адвокат':{power:1,mystery:1,rebellion:1},'предприниматель':{power:2,energy:1},'бармен':{tenderness:1,nostalgia:1},'повар':{tenderness:1,energy:1},'антиквар':{nostalgia:2,mystery:1},'рейнджер':{freedom:2,danger:1},'волонтёр':{hope:2,tenderness:2},'активист':{rebellion:2,hope:1},'информатор':{mystery:2,danger:1},'агент':{mystery:1,danger:1},'коллекционер':{nostalgia:2,mystery:1}};
    Object.assign(roleMods,localRoleMods[role]||{});add(p,roleMods);
    const sphereMods={'наука':{mystery:1},'медицина':{hope:1,tenderness:1,drama:1},'право':{power:1,drama:1},'искусство':{romance:1,melancholy:1},'литература':{drama:1,mystery:1,nostalgia:1},'музыка':{energy:1,romance:1,nostalgia:1},'театр':{drama:2,romance:1},'кино':{drama:2,mystery:1},'журналистика':{mystery:1,drama:1,rebellion:1},'медиа':{energy:1,chaos:1},'IT':{energy:2,mystery:1},'кибербезопасность':{danger:1,mystery:2},'инженерия':{power:1,energy:1},'археология':{mystery:2,nostalgia:1},'история':{nostalgia:2,mystery:1},'архивы':{nostalgia:2,mystery:2},'антиквариат':{nostalgia:2,mystery:1},'эзотерика':{mystery:2,darkness:1},'криминал':{danger:2,rebellion:1},'подполье':{danger:2,chaos:1},'военное дело':{danger:2,epic:1,power:1},'разведка':{mystery:2,danger:1},'охрана':{danger:1,power:1},'спорт':{energy:2,power:1},'туризм':{freedom:2,energy:1},'природа':{freedom:2,nostalgia:1},'экология':{hope:1,freedom:1},'торговля':{power:1,energy:1},'сфера услуг':{tenderness:1,energy:1},'гостеприимство':{tenderness:2,nostalgia:1},'исследования Изнанки':{mystery:2,darkness:1,epic:1},'исследования сверхъестественного':{mystery:2,danger:1,epic:1},'между мирами':{mystery:2,freedom:1,loneliness:1}};add(p,sphereMods[sphere]);
    if(scoring.race_modifiers?.[race])add(p,Object.fromEntries(Object.entries(scoring.race_modifiers[race]).filter(([k])=>k in p).map(([k,v])=>[k,v*.65])));
    const sm=scoring.story_modifiers||{};add(p,sm[start]);add(p,sm[current]);
    const futureMap={'счастливый финал':{hope:4,tenderness:2},'горькая победа':{drama:2,hope:1,melancholy:2},'катастрофа':{danger:3,drama:3,darkness:2},'искупление':{hope:3,drama:2,darkness:1},'новая жизнь':{hope:3,freedom:2},'большая любовь':{romance:3,tenderness:2,hope:2},'одиночество':{loneliness:3,melancholy:2},'война':{danger:3,drama:2,epic:2},'неизвестность':{mystery:2,loneliness:1},'возвращение домой':{nostalgia:2,hope:2,tenderness:2},'самопожертвование':{drama:3,tenderness:2,epic:1},'предательство':{drama:3,melancholy:2},'воссоединение':{hope:3,tenderness:3,nostalgia:2},'освобождение':{freedom:3,hope:2},'падение':{darkness:3,drama:2},'возвышение':{power:3,epic:2},'примирение':{hope:3,tenderness:2},'пробуждение силы':{power:3,energy:2},'снятие проклятия':{hope:2,darkness:-2},'открытый финал':{mystery:2,freedom:1},'изменение судьбы':{epic:2,rebellion:2,hope:2},'цена спасения':{drama:3,melancholy:2},'исчезновение':{loneliness:3,mystery:2},'новый цикл':{mystery:2,nostalgia:1}};add(p,futureMap[future]);
    return {name:$(`${prefix}-name`).value.trim()||'Безымянный',race,role,sphere,start,current,future,storyProfile:normalize(p),storyModifiers:normalize(p)};
  }

  function descriptor(profile,tracks,relationship){
    const top=(n)=>[...DIMS].sort((a,b)=>profile[b]-profile[a]).slice(0,n);
    const genreMap={alternative:'alternative', 'gothic-industrial':'gothic alternative','modern-heavy':'alternative metal','female-alternative':'female alternative','classic-rock':'classic rock','russian-rock':'русский рок','dark-folk':'dark folk','soundtracks':'cinematic alternative','anime':'anime rock','metal-rock':'gothic metal'};
    const genre=genreMap[tracks[0]?.category]||'alternative';
    const e=clamp(Math.round(profile.energy),0,10);
    const moodMap={melancholy:'melancholic',danger:'dangerous',romance:'romantic',darkness:'dark',mystery:'mysterious',hope:'hopeful',loneliness:'lonely',nostalgia:'nostalgic',chaos:'chaotic',power:'powerful',freedom:'free',tenderness:'tender',rebellion:'rebellious',drama:'dramatic',epic:'epic'};
    const moods=top(3).map(k=>moodMap[k]).filter(Boolean).join(' · ');
    const slow=profile.energy<=4?'slow burn':profile.energy<=6?'steady build':profile.danger+profile.energy>=14?'volatile':'driving';
    return {genre,tempo:slow,mood:moods||'melancholic · atmospheric · intense',energy:e};
  }

  function singleStory(c,p,meta){
    const sorted=[...DIMS].sort((a,b)=>p[b]-p[a]);
    const lead=sorted[0], second=sorted[1];
    const phrases={drama:'прошлого, которое до сих пор требует расплаты',romance:'чувства, которые невозможно держать под контролем',danger:'опасности, к которой человек постепенно привыкает',mystery:'тайны, на которую слишком долго не решались посмотреть прямо',hope:'надежды, которая упрямо остаётся даже после потерь',loneliness:'одиночества, которое стало одновременно защитой и тюрьмой',nostalgia:'памяти о том, что уже невозможно вернуть',chaos:'жизни, в которой старые правила перестали работать',power:'контроля и цены, которую приходится за него платить',freedom:'попытки наконец выбрать собственную жизнь',melancholy:'памяти, утраты и невозможности просто оставить прошлое',tenderness:'редкой близости, которую страшно потерять',rebellion:'отказа жить по чужим правилам',darkness:'тени, которая становится частью самого героя',epic:'личной истории, которая постепенно оказывается больше одного человека',energy:'движения вперёд, когда остановиться уже невозможно'};
    const name=c.name==='Безымянный'?'этого человека':`человека по имени ${c.name}`;
    return `Это история ${name}, который слишком долго пытался сохранить контроль над собственной жизнью. Чем сильнее он пытается выбраться из прошлого, тем глубже оказывается в нём. В центре — ${phrases[lead]||'внутренней борьбы'}; рядом постоянно ощущается ${phrases[second]||'перемен'}. Здесь нет настоящих героев и злодеев — только человек, который однажды сделал выбор и теперь живёт с его последствиями. Музыкально это ${meta.tempo}: история не раскрывает всё сразу, а постепенно наращивает напряжение.`;
  }

  function pairStory(a,b,type,tr,focus,meta){
    const rel=REL.find(x=>x[0]===type)?.[1]||type,trajectory=TRAJ.find(x=>x[0]===tr)?.[1]||tr;
    const text={
      alienation_to_reunion:'они слишком много потеряли друг в друге, чтобы сделать вид, будто ничего не было; возвращение возможно только после честной встречи со старой болью',
      enemies_to_allies:'общая угроза заставит их временно поставить в сторону неприязнь, а затем обнаружить, что доверие иногда рождается именно там, где его никто не ожидал',
      forced_allies_to_true_bond:'вынужденное соседство постепенно превратится в настоящую связь, если они переживут момент, когда проще всего снова разойтись',
      friends_to_enemies:'то, что делало их близкими, станет одновременно главным источником боли и причиной конфликта',
      enemies_to_lovers:'притяжение будет расти именно там, где оба пытаются сохранить дистанцию',
      no_change:'внешние обстоятельства могут меняться, но главное между ними останется узнаваемым',
      loss_to_recovery:'отношения будут собираться заново — медленно, через принятие прошлого и возвращение доверия',
      redemption:'их связь станет частью пути к искуплению и заставит обоих сделать выбор иначе',
      descent:'каждый следующий шаг будет вести глубже, пока цена их связи не станет очевидной'
    }[tr]||'их отношения будут меняться под давлением обстоятельств, а каждое решение станет частью общей истории';
    const focusText={connection:'их самих',bond:'их связи',events:'того, что с ними происходит',conflict:'их конфликта'}[focus]||'их связи';
    return `Это история двух людей — ${a.name} и ${b.name}. Их исходная связь — «${rel}», а траектория — «${trajectory}». ${text}. Фокус этой истории — ${focusText}: не набор случайных песен, а один музыкальный образ того, к чему они неизбежно приходят. По настроению это ${meta.tempo}, где напряжение постепенно превращается в кульминацию.`;
  }

  function renderMeta(meta){return `<div class="story-meta"><div class="meta-box"><div class="meta-label">Жанр</div><div class="meta-value">${esc(meta.genre)}</div></div><div class="meta-box"><div class="meta-label">Темп</div><div class="meta-value">${esc(meta.tempo)}</div></div><div class="meta-box"><div class="meta-label">Настроение</div><div class="meta-value">${esc(meta.mood)}</div></div><div class="meta-box"><div class="meta-label">Энергия</div><div class="meta-value">${meta.energy}/10</div></div></div>`;}
  function renderHeroTrack(track){if(!track)return `<div class="error">Не удалось подобрать трек.</div>`;return `<div class="hero-track"><div class="stage">🎵 Ваш трек</div><div class="song"><b>${esc(track.title)}</b> — ${esc(track.artist)}</div><div class="score">Итоговый score: ${Number(track.finalScore??track.score??0).toFixed(2)} · ${esc(track.category||'—')}</div></div>`;}
  function renderPairVisualEditor(){
    $('pair-visual').innerHTML=`<div class="pair-visuals"><div><h3>Персонаж 1 · визуальный образ</h3><div id="p1-visual-editor"></div></div><div><h3>Персонаж 2 · визуальный образ</h3><div id="p2-visual-editor"></div></div></div>`;
    renderVisualEditor('p1-visual-editor','p1','Визуальный образ');renderVisualEditor('p2-visual-editor','p2','Визуальный образ');
  }

  async function fetchJSON(path,label){
    const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),12000);
    try{const r=await fetch(path,{cache:'no-store',signal:ctl.signal});if(!r.ok)throw new Error(`${label}: HTTP ${r.status}`);return await r.json();}finally{clearTimeout(timer);}
  }
  async function load(){
    try{
      $('status').textContent='Загружаю настройки…';
      options=await fetchJSON('../data/character-options.json','character-options.json');
      scoring=await fetchJSON('../data/music-scoring.json','music-scoring.json');
      music=[];const seen=new Set();
      for(let i=0;i<SOURCES.length;i++){
        $('status').textContent=`Загружаю музыку… ${i+1}/${SOURCES.length}`;
        const data=await fetchJSON(`../data/music/${SOURCES[i]}.json`,SOURCES[i]);
        for(const t of (data.tracks||[])){const key=`${t.artist}::${t.title}`.toLowerCase();if(!seen.has(key)){seen.add(key);music.push({...t,category:SOURCES[i]});}}
      }
      renderOptions();renderEq('single-eq','s');renderEq('p1-eq','p1');renderEq('p2-eq','p2');renderVisualEditor('single-visual','s','Визуальный образ персонажа');renderPairVisualEditor();
      $('single-run').disabled=false;$('pair-run').disabled=false;$('status').textContent=`✓ Загружено ${music.length} треков · генератор готов`;
    }catch(e){$('single-run').disabled=true;$('pair-run').disabled=true;$('status').innerHTML=`<span class="error">Не удалось загрузить генератор: ${esc(e.name==='AbortError'?'Превышено время ожидания загрузки.':(e.stack||e.message))}</span>`;}
  }

  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$(btn.dataset.mode).classList.add('active');}));

  $('single-run').addEventListener('click',()=>{try{
    const c=readCharacter('s'),r=E.generatePersonalSoundtrack(c,music,scoring,{limit:1}),track=r.tracks?.[0],meta=descriptor(r.targetProfile,r.tracks,false);
    $('single-out').innerHTML=`<section class="card"><h2>🎧 Саундтрек вашей истории</h2>${renderMeta(meta)}<div class="story-lead">${esc(singleStory(c,r.targetProfile,meta))}</div>${renderHeroTrack(track)}${renderVisualOutput('s',c.name) }<div class="result-divider"></div><div class="small">Музыкальный профиль рассчитан из параметров персонажа, истории и эмоционального эквалайзера. В результате остаётся один главный трек — тот, который лучше всего выражает историю целиком.</div></section>`;
  }catch(e){$('single-out').innerHTML=`<div class="error">${esc(e.stack||e.message)}</div>`;}});

  $('pair-run').addEventListener('click',()=>{try{
    const a=readCharacter('p1'),b=readCharacter('p2'),type=$('p-rel').value,tr=$('p-traj').value,focus=$('p-focus').value;
    const r=E.generateSharedSoundtrackV4(a,b,music,scoring,{focus,relationshipType:type,trajectory:tr,limit:1}),track=r.tracks?.[0],meta=descriptor(r.targetProfile,r.tracks,true);
    $('pair-out').innerHTML=`<section class="card"><h2>🎧 Саундтрек вашей истории</h2>${renderMeta(meta)}<div class="story-lead">${esc(pairStory(a,b,type,tr,focus,meta))}</div>${renderHeroTrack(track)}${renderVisualOutput('p1',a.name)}${renderVisualOutput('p2',b.name)}<div class="result-divider"></div><div class="small">Связь: ${esc(REL.find(x=>x[0]===type)?.[1]||type)} · траектория: ${esc(TRAJ.find(x=>x[0]===tr)?.[1]||tr)} · фокус: ${esc(focus)}</div></section>`;
  }catch(e){$('pair-out').innerHTML=`<div class="error">${esc(e.stack||e.message)}</div>`;}});

  load();
})();
