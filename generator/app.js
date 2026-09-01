(() => {
  'use strict';

  const E = window.SoundtrackEngine;
  const DIMS = ['drama','romance','danger','mystery','hope','loneliness','nostalgia','chaos','power','freedom','melancholy','tenderness','rebellion','darkness','epic','energy'];
  const EQ = [
    ['drama','Драма'],['romance','Романтика'],['danger','Опасность'],['mystery','Тайна'],['hope','Надежда'],['loneliness','Одиночество'],['nostalgia','Ностальгия'],['chaos','Хаос'],
    ['power','Сила'],['freedom','Свобода'],['melancholy','Меланхолия'],['tenderness','Нежность'],['rebellion','Бунт'],['darkness','Тьма'],['epic','Эпичность'],['energy','Энергия']
  ];
  const SOURCES = ['alternative','gothic-industrial','modern-heavy','female-alternative','classic-rock','russian-rock','dark-folk','soundtracks','anime','metal-rock'];
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c));
  const clamp = (n,a=0,b=10) => Math.max(a,Math.min(b,Number(n)||0));
  const blank = () => Object.fromEntries(DIMS.map(k => [k,0]));

  let options = null;
  let scoring = null;
  let music = [];
  const visualState = {portrait:'',images:[]};

  const roleMods = {
    'герой':{hope:1,epic:1},'антигерой':{drama:1,darkness:1,rebellion:1},'злодей':{danger:1,darkness:2,power:1},
    'трикстер':{chaos:2,freedom:1,energy:1},'изгой':{loneliness:2,freedom:1},'избранный':{epic:2,power:1,drama:1},
    'исследователь':{mystery:2,drama:1},'искатель':{mystery:1,freedom:1,hope:1},'защитник':{tenderness:1,power:1,hope:1},
    'хранитель':{mystery:1,nostalgia:1},'проводник':{mystery:2,freedom:1},'странник':{freedom:2,loneliness:1},
    'беглец':{freedom:2,danger:1,loneliness:1},'изгнанник':{loneliness:2,rebellion:1},'одиночка':{loneliness:2,freedom:1},
    'лидер':{power:2,epic:1},'наследник':{power:1,nostalgia:1,drama:1},'узурпатор':{power:2,rebellion:2,drama:1},
    'правитель':{power:2,drama:1},'аристократ':{power:1,nostalgia:1,romance:1},'дипломат':{mystery:1,hope:1},
    'наставник':{hope:2,tenderness:1,nostalgia:1},'ученик':{hope:1,energy:1,mystery:1},'подопечный':{tenderness:2,hope:1},
    'детектив':{mystery:2,drama:1},'следопыт':{mystery:1,freedom:1,danger:1},'охотник':{danger:2,rebellion:1,power:1},
    'телохранитель':{danger:1,power:2,tenderness:1},'солдат':{danger:2,drama:1,epic:1},'ветеран':{nostalgia:2,melancholy:1,drama:1},
    'наёмник':{danger:2,freedom:1},'разведчик':{mystery:2,danger:1},'шпион':{mystery:2,danger:1},'контрабандист':{danger:1,freedom:2,chaos:1},
    'преступник':{danger:2,rebellion:1,chaos:1},'мошенник':{chaos:2,freedom:1},'вор':{freedom:2,chaos:1},'чистильщик':{danger:2,darkness:1},
    'целитель':{hope:2,tenderness:2},'медик':{hope:1,tenderness:1,drama:1},'священник':{hope:2,mystery:1},'оккультист':{mystery:2,darkness:1},
    'ритуалист':{mystery:2,epic:1},'алхимик':{mystery:2,energy:1},'артефактор':{mystery:2,power:1},'прорицатель':{mystery:2,epic:1,nostalgia:1},
    'медиум':{mystery:2,loneliness:1,nostalgia:1},'экстрасенс':{mystery:2,energy:1},'архивист':{nostalgia:2,mystery:1},
    'учёный':{mystery:1,energy:1},'инженер':{energy:1,power:1},'программист':{mystery:1,energy:2},'хакер':{rebellion:2,energy:2,freedom:1},
    'художник':{romance:1,melancholy:1,energy:1},'писатель':{drama:1,mystery:1,nostalgia:1},'поэт':{romance:1,melancholy:2},'музыкант':{energy:1,romance:1,nostalgia:1},
    'актёр':{drama:2,romance:1},'фотограф':{nostalgia:1,mystery:1,melancholy:1},'журналист':{mystery:1,drama:1,rebellion:1},
    'преподаватель':{hope:1,tenderness:1},'студент':{energy:1,hope:1},'спортсмен':{energy:2,power:1},'врач':{hope:2,tenderness:1},
    'адвокат':{drama:1,power:1,mystery:1},'предприниматель':{power:2,energy:1},'владелец бизнеса':{power:2,freedom:1},'бармен':{mystery:1,tenderness:1},
    'антиквар':{nostalgia:2,mystery:1},'торговец':{freedom:1,chaos:1},'садовник':{hope:2,tenderness:1},'рейнджер':{freedom:2,danger:1},
    'курьер':{energy:2,freedom:1},'волонтёр':{hope:2,tenderness:1},'активист':{rebellion:2,hope:1},'информатор':{mystery:2,danger:1},
    'агент':{mystery:2,danger:1},'проводник между мирами':{mystery:3,freedom:1},'хранитель портала':{mystery:2,power:1,epic:1},
    'человек, который просто пытается жить спокойно':{hope:1,tenderness:1,melancholy:1}
  };

  function fill(id, items){
    const el=$(id); if(!el)return;
    el.innerHTML='';
    (items||[]).forEach((x,i)=>{const o=document.createElement('option');o.value=x.id??x;o.textContent=x.label??x;if(i===0)o.selected=true;el.appendChild(o);});
  }

  function renderOptions(){
    fill('s-race',options.races);fill('s-role',options.roles);fill('s-sphere',options.life_spheres);fill('s-start',options.starting_points);fill('s-current',options.current_arcs);fill('s-future',options.future_arcs);
  }

  function renderEq(){
    const el=$('single-eq'); if(!el)return;
    el.innerHTML='';
    EQ.forEach(([k,label])=>{
      const box=document.createElement('div');box.className='slider';
      box.innerHTML=`<label><span>${label}</span><span id="s-${k}-v">5</span></label><input id="s-${k}" type="range" min="0" max="10" step="1" value="5">`;
      el.appendChild(box);
      box.querySelector('input').addEventListener('input',e=>{ $('s-'+k+'-v').textContent=e.target.value; });
    });
  }

  function fileToDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}

  function renderVisual(){
    const host=$('single-visual');if(!host)return;
    host.innerHTML=`<section class="visual-card"><div class="visual-head"><h2>Визуальный образ персонажа</h2><span class="visual-note">Фото можно дать ссылкой или загрузить с устройства</span></div><div class="portrait-row"><div class="field" style="margin:0"><label>Главное фото персонажа</label><input id="s-portrait-url" type="url" placeholder="https://…"><input id="s-portrait-file" class="file-input" type="file" accept="image/*"></div><div id="s-portrait-preview"></div></div><div style="margin-top:18px"><h3>4 изображения, которые его/её характеризуют</h3><div class="small">Например: место, предмет, одежда, символ, пейзаж, деталь или важная сцена.</div><div id="s-gallery" class="gallery-grid"></div></div></section>`;
    const gallery=$('s-gallery');
    for(let i=0;i<4;i++){
      const slot=document.createElement('div');slot.className='visual-slot';slot.innerHTML=`<label>Изображение ${i+1} · обязательно</label><input id="s-img-url-${i}" type="url" placeholder="Ссылка на изображение"><input id="s-img-file-${i}" type="file" accept="image/*">`;gallery.appendChild(slot);
      $('s-img-url-'+i).addEventListener('input',()=>{visualState.images[i]=$('s-img-url-'+i).value.trim();});
      $('s-img-file-'+i).addEventListener('change',async e=>{const f=e.target.files?.[0];if(f)visualState.images[i]=await fileToDataURL(f);});
    }
    $('s-portrait-url').addEventListener('input',()=>{visualState.portrait=$('s-portrait-url').value.trim();drawPortrait();});
    $('s-portrait-file').addEventListener('change',async e=>{const f=e.target.files?.[0];if(f){visualState.portrait=await fileToDataURL(f);drawPortrait();}});
  }

  function drawPortrait(){const p=$('s-portrait-preview');if(p)p.innerHTML=visualState.portrait?`<div class="portrait-preview"><img src="${esc(visualState.portrait)}" alt="Портрет"></div>`:'';}

  function readCharacter(){
    const p=blank();
    EQ.forEach(([k])=>p[k]=Number($('s-'+k)?.value||5));
    const race=$('s-race')?.value||'',role=$('s-role')?.value||'',sphere=$('s-sphere')?.value||'',start=$('s-start')?.value||'',current=$('s-current')?.value||'',future=$('s-future')?.value||'';
    Object.assign(p,roleMods[role]||{});
    const sm=scoring?.story_modifiers||{};
    if(sm[start])Object.assign(p,sm[start]);
    if(sm[current])Object.assign(p,sm[current]);
    const futureMap={
      'счастливый финал':{hope:4,tenderness:2},'горькая победа':{drama:2,hope:1,melancholy:2},'катастрофа':{danger:3,drama:3,darkness:2},
      'искупление':{hope:3,drama:2,darkness:1},'новая жизнь':{hope:3,freedom:2},'большая любовь':{romance:3,tenderness:2,hope:2},
      'одиночество':{loneliness:3,melancholy:2},'война':{danger:3,drama:2,epic:2},'неизвестность':{mystery:2,loneliness:1},
      'возвращение домой':{nostalgia:2,hope:2,tenderness:2},'самопожертвование':{drama:3,tenderness:2,epic:1},'предательство':{drama:3,melancholy:2},
      'воссоединение':{hope:3,tenderness:3,nostalgia:2},'освобождение':{freedom:3,hope:2},'падение':{darkness:3,drama:2},
      'возвышение':{power:3,epic:2},'примирение':{hope:3,tenderness:2},'пробуждение силы':{power:3,energy:2},'снятие проклятия':{hope:2,darkness:-2},
      'открытый финал':{mystery:2,freedom:1},'изменение судьбы':{epic:2,rebellion:2,hope:2},'цена спасения':{drama:3,melancholy:2},
      'исчезновение':{loneliness:3,mystery:2},'новый цикл':{mystery:2,nostalgia:1}
    };
    if(futureMap[future])Object.assign(p,futureMap[future]);
    return {name:($('s-name')?.value||'').trim()||'Безымянный',race,role,sphere,start,current,future,storyModifiers:p,storyProfile:p};
  }

  function descriptor(profile,track){
    const top=[...DIMS].sort((a,b)=>profile[b]-profile[a]);
    const genreMap={alternative:'альтернативный рок','gothic-industrial':'готик-рок и индастриал','modern-heavy':'тяжёлый альтернативный рок','female-alternative':'женский альтернативный рок','classic-rock':'классический рок','russian-rock':'русский рок','dark-folk':'тёмный фолк','soundtracks':'кинематографический саундтрек','anime':'аниме-рок','metal-rock':'готик-метал'};
    const moodMap={melancholy:'меланхоличный',danger:'опасный',romance:'романтический',darkness:'тёмный',mystery:'таинственный',hope:'светлый',loneliness:'одинокий',nostalgia:'ностальгический',chaos:'хаотичный',power:'сильный',freedom:'свободный',tenderness:'нежный',rebellion:'бунтарский',drama:'драматичный',epic:'эпический',energy:'напряжённый'};
    const tempo=profile.energy<=3?'медленно и почти незаметно нарастающий':profile.energy<=5?'постепенно набирающий силу':profile.danger+profile.energy>=15?'резкий и неустойчивый':'уверенно движущийся вперёд';
    return {genre:genreMap[track?.category]||'альтернативный рок',tempo,mood:top.slice(0,3).map(k=>moodMap[k]).filter(Boolean).join(' · '),energy:Math.round(clamp(profile.energy))};
  }

  function story(c,p,meta){
    const top=[...DIMS].sort((a,b)=>p[b]-p[a]).slice(0,4);
    const primary={
      drama:['Это история человека, который слишком долго жил с последствиями собственного выбора. Прошлое не отпускает его — оно возвращается в самых неожиданных местах и каждый раз требует новой платы.','Это история человека, который однажды сделал шаг, после которого прежней жизни уже не осталось. Теперь ему приходится решать не только, что делать дальше, но и сколько прошлого он готов взять с собой.'],
      romance:['Это история человека, который привык держать чувства под контролем, пока однажды они не перестали спрашивать разрешения. То, что сначала казалось слабостью, постепенно становится главным испытанием.','Это история человека, для которого близость никогда не была простой. Чем сильнее он пытается сохранить равновесие, тем очевиднее становится: некоторые чувства невозможно пережить, не изменившись.'],
      danger:['Это история человека, который слишком долго находился рядом с опасностью и однажды перестал понимать, где заканчивается риск и начинается привычка.','Это история человека, научившегося жить там, где ошибка стоит слишком дорого. Но прошлое постепенно подводит его к выбору, от которого уже нельзя отступить.'],
      mystery:['Это история человека, который слишком долго чувствовал: в его жизни есть что-то недосказанное. Чем ближе он подходит к ответу, тем больше вопросов появляется вместо него.','Это история человека, который привык искать объяснения всему вокруг, пока однажды загадка не оказалась связана с ним самим.'],
      hope:['Это история человека, который пережил достаточно, чтобы перестать верить в счастливые случайности, но всё ещё не научился окончательно сдаваться.','Это история человека, который продолжает идти не потому, что уверен в будущем, а потому, что однажды решил не останавливаться.'],
      loneliness:['Это история человека, который сделал одиночество своей защитой. Со временем защита стала привычкой, а привычка — клеткой, из которой уже не так просто выйти.','Это история человека, привыкшего рассчитывать только на себя. Но чем дольше он идёт один, тем труднее понять, чего именно он пытается избежать.'],
      nostalgia:['Это история человека, который слишком хорошо помнит то, что другие предпочли бы забыть. Прошлое для него не стало воспоминанием — оно осталось частью настоящего.','Это история человека, чья жизнь постоянно возвращается к одному и тому же месту, времени или обещанию. Некоторые двери закрываются, но не перестают существовать.'],
      chaos:['Это история человека, чья жизнь давно перестала подчиняться прежним правилам. Когда привычный порядок рушится, приходится впервые выбирать не то, что правильно, а то, что действительно твоё.','Это история человека, который слишком долго пытался удержать мир в руках, пока мир не решил ответить тем же.'],
      power:['Это история человека, привыкшего держать ситуацию под контролем. Но всякая власть имеет цену, и однажды приходится решить, чем именно ты готов за неё заплатить.','Это история человека, который научился быть сильным раньше, чем научился быть счастливым.'],
      freedom:['Это история человека, который слишком долго жил по чужим правилам. Чем ближе становится возможность выбрать собственную жизнь, тем страшнее оказывается цена свободы.','Это история человека, который однажды понял: самое трудное — не сбежать, а решить, куда идти после побега.'],
      melancholy:['Это история человека, который научился жить рядом с утратой. Некоторые вещи нельзя вернуть, но можно решить, что они будут значить дальше.','Это история человека, для которого прошлое звучит громче настоящего. И всё же даже самая тихая жизнь однажды требует нового выбора.'],
      tenderness:['Это история человека, который не привык показывать слабость. Именно поэтому редкая близость становится для него не утешением, а настоящим риском.','Это история человека, который научился защищать всё вокруг, кроме самого себя.'],
      rebellion:['Это история человека, который однажды перестал соглашаться. Сначала это было маленькое неповиновение, затем — необходимость выбрать, кому и чему он больше не позволит решать за себя.','Это история человека, который слишком долго жил по правилам, написанным кем-то другим.'],
      darkness:['Это история человека, который слишком долго смотрел в сторону собственной тени. Со временем становится ясно: от неё нельзя просто уйти — с ней приходится договориться.','Это история человека, который привык к темноте настолько, что однажды перестал замечать, насколько далеко зашёл.'],
      epic:['Это история человека, чьи личные решения постепенно оказываются частью чего-то гораздо большего. Судьба здесь не падает с неба — её приходится создавать собственными руками.','Это история человека, который начинал с одной маленькой цели, а оказался перед выбором, способным изменить не только его жизнь.'],
      energy:['Это история человека, который слишком долго двигался вперёд, чтобы однажды просто остановиться. С каждым новым шагом ставки становятся выше.','Это история человека, для которого покой никогда не был настоящим домом.']
    };
    const p1=primary[top[0]]?.[Math.abs(Math.round(p.drama+p.romance+p.danger+p.mystery))%2]||primary.drama[0];
    const endings={
      hope:'В этой истории остаётся место для надежды — но она не приходит сама: её приходится выбрать.',
      darkness:'Здесь нет простого спасения: прошлое всё равно потребует ответа.',
      romance:'Главное испытание здесь — не чувство само по себе, а то, кем человек становится рядом с ним.',
      mystery:'Ответ оказывается важен меньше, чем то, что человек делает после его открытия.',
      freedom:'В конце важнее всего оказывается не победа, а право впервые выбрать собственный путь.',
      loneliness:'И потому главный вопрос истории — останется ли одиночество защитой или станет приговором.',
      drama:'Всё сводится к одному вопросу: можно ли изменить последствия, не изменив самого себя?',
      danger:'Каждое решение здесь имеет цену, и отложить её выплату уже не получится.',
      power:'Вопрос оказывается не в том, сможет ли человек удержать власть, а в том, что останется у него в руках после этого.',
      nostalgia:'Прошлое не исчезает — меняется только то, какую власть мы ему отдаём.',
      melancholy:'И всё же даже после утраты история не заканчивается там, где казалось.',
      tenderness:'Самое уязвимое здесь постепенно становится самым важным.',
      rebellion:'Свобода начинается ровно в тот момент, когда человек перестаёт ждать разрешения.',
      chaos:'Когда старые правила больше не работают, остаётся только собственный выбор.',
      epic:'Личная история постепенно становится частью легенды, которую ещё только предстоит написать.',
      energy:'Остановиться становится страшнее, чем сделать следующий шаг.'
    };
    return `${p1} ${endings[top[1]]||endings.drama} Музыкально это ${meta.tempo}: история не рассказывается сразу, а постепенно собирается в единый образ. Настроение — ${meta.mood}.`;
  }

  function renderOutput(c,r){
    const track=r.tracks?.[0];
    if(!track)throw new Error('Не удалось подобрать трек. Проверьте, что музыкальная библиотека загружена.');
    const meta=descriptor(r.targetProfile,track);
    const visual=(visualState.portrait||visualState.images.some(Boolean))?`<div class="visual-output"><div class="small"><b>Визуальный образ</b></div>${visualState.portrait?`<div class="portrait-preview"><img src="${esc(visualState.portrait)}" alt="Портрет"></div>`:''}${visualState.images.some(Boolean)?`<div class="visual-output-gallery">${visualState.images.filter(Boolean).map((src,i)=>`<figure><img src="${esc(src)}" alt="Образ ${i+1}"></figure>`).join('')}</div>`:''}</div>`:'';
    $('single-out').innerHTML=`<section class="card"><h2>🎧 Саундтрек вашей истории</h2><div class="story-meta"><div class="meta-box"><div class="meta-label">Жанр</div><div class="meta-value">${esc(meta.genre)}</div></div><div class="meta-box"><div class="meta-label">Темп</div><div class="meta-value">${esc(meta.tempo)}</div></div><div class="meta-box"><div class="meta-label">Настроение</div><div class="meta-value">${esc(meta.mood)}</div></div><div class="meta-box"><div class="meta-label">Энергия</div><div class="meta-value">${meta.energy}/10</div></div></div><div class="story-lead">${esc(story(c,r.targetProfile,meta))}</div><div class="hero-track"><div class="small">🎵 ВАШ ТРЕК</div><div class="song"><b>${esc(track.title)}</b> — ${esc(track.artist)}</div><div class="score">Итоговый score: ${Number(track.finalScore??track.score??0).toFixed(2)} · ${esc(meta.genre)}</div></div>${visual}<div class="result-divider"></div><div class="small">Трек выбран из музыкальной библиотеки по сочетанию истории персонажа и значений эмоционального эквалайзера.</div></section>`;
  }

  async function fetchJSON(path,label){
    const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),15000);
    try{const r=await fetch(path,{cache:'no-store',signal:ctl.signal});if(!r.ok)throw new Error(`${label}: HTTP ${r.status}`);return await r.json();}
    finally{clearTimeout(timer);}
  }

  async function load(){
    const status=$('status'),button=$('single-run');
    try{
      if(!E||typeof E.generatePersonalSoundtrack!=='function')throw new Error('Музыкальный движок не загружен.');
      status.textContent='Загружаю настройки…';
      options=await fetchJSON('../data/character-options.json','character-options.json');
      scoring=await fetchJSON('../data/music-scoring.json','music-scoring.json');
      music=[];const seen=new Set();
      for(let i=0;i<SOURCES.length;i++){
        status.textContent=`Загружаю музыку… ${i+1}/${SOURCES.length}`;
        try{
          const data=await fetchJSON(`../data/music/${SOURCES[i]}.json`,SOURCES[i]);
          for(const t of (data.tracks||[])){const key=`${t.artist}::${t.title}`.toLowerCase();if(!seen.has(key)){seen.add(key);music.push({...t,category:SOURCES[i]});}}
        }catch(e){console.warn('Не загружен источник',SOURCES[i],e);}
      }
      if(!music.length)throw new Error('Музыкальная библиотека пуста.');
      renderOptions();renderEq();renderVisual();
      button.disabled=false;status.textContent=`✓ Загружено ${music.length} треков · генератор готов`;
    }catch(e){button.disabled=true;status.innerHTML=`<span class="error">Не удалось загрузить генератор: ${esc(e.name==='AbortError'?'Превышено время ожидания загрузки.':(e.stack||e.message))}</span>`;}
  }

  $('single-run').addEventListener('click',()=>{
    try{
      const c=readCharacter();
      const r=E.generatePersonalSoundtrack(c,music,scoring,{limit:1});
      renderOutput(c,r);
      $('single-out').scrollIntoView({behavior:'smooth',block:'start'});
    }catch(e){$('single-out').innerHTML=`<div class="error">${esc(e.stack||e.message)}</div>`;}
  });

  load();
})();
