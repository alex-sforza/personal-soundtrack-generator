(() => {
  'use strict';

  const E = window.SoundtrackEngine;
  const DIMS = ['drama','romance','danger','mystery','hope','loneliness','nostalgia','chaos','power','freedom','melancholy','tenderness','rebellion','darkness','epic','energy'];
  const SOURCES = ['alternative','gothic-industrial','modern-heavy','female-alternative','classic-rock','russian-rock','dark-folk','soundtracks','anime','metal-rock'];
  const EQ = [
    ['drama','Драма'],['romance','Романтика'],['danger','Опасность'],['mystery','Тайна'],
    ['hope','Надежда'],['loneliness','Одиночество'],['nostalgia','Ностальгия'],['chaos','Хаос'],
    ['power','Сила'],['freedom','Свобода'],['melancholy','Меланхолия'],['tenderness','Нежность'],
    ['rebellion','Бунт'],['darkness','Тьма'],['epic','Эпичность'],['energy','Энергия']
  ];
  const NON_ROMANTIC = new Set(['семья','родственники','друзья','лучшие друзья','союзники','напарники','наставник и ученик','соперники','враги','бывшие союзники','бывшие близкие','взаимная неприязнь','долг','клятва','контракт','должник и кредитор','защитник и подопечный','случайные знакомые','соседи','коллеги','работодатель и работник','учитель и ученик','политические союзники','сообщники','фамильяр и хозяин','создатель и творение','создатель и мнимыш','связанные общей тайной','связанные проклятием','охотник и добыча','охотник и сверхъестественное существо','вампир и донор','оборотень и альфа','член одного клана','член одной стаи']);
  const REL = [
    ['семья','Семья'],['родственники','Родственники'],['друзья','Друзья'],['лучшие друзья','Лучшие друзья'],['союзники','Союзники'],['напарники','Напарники'],['наставник и ученик','Наставник и ученик'],['соперники','Соперники'],['враги','Враги'],['бывшие союзники','Бывшие союзники'],['бывшие близкие','Бывшие близкие'],['любовники','Любовники'],['неразделённые чувства','Неразделённые чувства'],['взаимное притяжение','Взаимное притяжение'],['сложная привязанность','Сложная привязанность'],['взаимная неприязнь','Взаимная неприязнь'],['долг','Долг'],['клятва','Клятва'],['контракт','Контракт'],['должник и кредитор','Должник и кредитор'],['защитник и подопечный','Защитник и подопечный'],['случайные знакомые','Случайные знакомые'],['соседи','Соседи'],['коллеги','Коллеги'],['работодатель и работник','Работодатель и работник'],['учитель и ученик','Учитель и ученик'],['политические союзники','Политические союзники'],['сообщники','Сообщники'],['фамильяр и хозяин','Фамильяр и хозяин'],['создатель и творение','Создатель и творение'],['создатель и мнимыш','Создатель и мнимыш'],['связанные общей тайной','Связанные общей тайной'],['связанные проклятием','Связанные проклятием'],['охотник и добыча','Охотник и добыча'],['охотник и сверхъестественное существо','Охотник и сверхъестественное существо'],['вампир и донор','Вампир и донор'],['оборотень и альфа','Оборотень и альфа'],['член одного клана','Член одного клана'],['член одной стаи','Член одной стаи'],['связанные судьбой','Связанные судьбой'],['небесный и падший','Небесный и падший'],['демон и заключивший контракт','Демон и заключивший контракт'],['соперники за одну цель','Соперники за одну цель']
  ];
  const TRAJ = [
    ['no_change','Ничего не меняется'],['strangers_to_friends','От чужих к друзьям'],['strangers_to_enemies','От чужих к врагам'],['enemies_to_allies','От врагов к союзникам'],['rivals_to_allies','От соперников к союзникам'],['friends_to_enemies','От друзей к врагам'],['trust_to_betrayal','От доверия к предательству'],['attachment_to_freedom','От привязанности к свободе'],['alienation_to_reunion','От отчуждения к примирению'],['protector_to_protected','От защитника к равным'],['hunter_to_hunted','Охотник становится добычей'],['mentor_to_equal','От наставника к равным'],['forced_allies_to_true_bond','От вынужденного союза к настоящей связи'],['enemies_to_lovers','От вражды к любви'],['loss_to_recovery','От утраты к восстановлению'],['redemption','Искупление'],['descent','Падение']
  ];
  const REL_TERMS = {
    'семья':['family','brother','sister','blood','home','родн','семь','брат','сестр','кров'],
    'родственники':['family','relative','blood','home','родн','семь','кров'],
    'друзья':['friend','friendship','together','друз','вместе'],
    'лучшие друзья':['friend','best','together','forever','друз','вместе','навсег'],
    'союзники':['ally','allies','team','together','united','союз','команд','вместе'],
    'напарники':['team','together','partner','road','команд','вместе'],
    'наставник и ученик':['mentor','student','learn','teach','wisdom','настав','учен','учит'],
    'соперники':['rival','competition','fight','power','сопер','борьб','бой'],
    'враги':['enemy','enemies','war','fight','battle','hate','revenge','kill','враг','войн','бой','ненав','месть'],
    'бывшие союзники':['former','ally','goodbye','loss','mistrust','бывш','союз','потер','недовер'],
    'бывшие близкие':['former','goodbye','lost','memory','бывш','прошл','прощ'],
    'любовники':['love','lover','kiss','heart','romance','desire','любов','целу','сердц','желан'],
    'неразделённые чувства':['love','alone','longing','lost','любов','один','тос'],
    'взаимное притяжение':['love','heart','desire','attraction','притяж','сердц','желан'],
    'сложная привязанность':['love','desire','chaos','broken','attachment','любов','желан','хаос'],
    'взаимная неприязнь':['hate','anger','fight','enemy','ненав','злост','бой'],
    'долг':['duty','debt','oath','promise','долг','обещ','клятв'],
    'клятва':['oath','promise','forever','клятв','обещ','навсег'],
    'контракт':['contract','deal','devil','debt','контракт','сделк','долг'],
    'должник и кредитор':['debt','owe','money','contract','долг','контракт'],
    'защитник и подопечный':['protect','guard','safe','save','guardian','защит','спас','хран'],
    'связанные общей тайной':['secret','truth','shadow','mystery','тайн','правд','тен'],
    'связанные проклятием':['curse','blood','dark','fate','проклят','кров','тьм','судьб'],
    'охотник и добыча':['hunt','hunter','prey','run','chase','охот','добыч','бег'],
    'охотник и сверхъестественное существо':['hunt','monster','beast','hunter','охот','чудовищ','звер'],
    'вампир и донор':['blood','night','thirst','vampire','кров','ноч','жажд'],
    'оборотень и альфа':['wolf','pack','moon','alpha','ста','волк','лун'],
    'член одного клана':['clan','blood','family','tribe','клан','кров','семь'],
    'член одной стаи':['pack','wolf','together','ста','волк','вместе'],
    'связанные судьбой':['fate','destiny','forever','thread','судьб','рок','навсег'],
    'небесный и падший':['angel','fallen','heaven','devil','ангел','падш','небес'],
    'демон и заключивший контракт':['devil','demon','hell','contract','дьявол','демон','ад','контракт'],
    'соперники за одну цель':['rival','goal','competition','fight','цель','сопер','борьб']
  };
  const STAGES = {
    sibling:[['Общее прошлое',{nostalgia:2.2,tenderness:2.2,hope:1}],['Разлом',{drama:2.2,melancholy:2.1,loneliness:1.2}],['Точка боли',{drama:3,melancholy:2.5,danger:1}],['Возвращение',{hope:2.5,tenderness:2.2,nostalgia:1.2}],['Домой',{hope:3,tenderness:3,nostalgia:2.5,loneliness:-2}]],
    friends:[['Свои люди',{hope:2,tenderness:2,freedom:1}],['Общее безумие',{energy:2,chaos:2,freedom:2}],['Проверка',{drama:2,danger:1}],['Выбор друг друга',{hope:3,tenderness:2}],['Вместе',{hope:3,energy:1,tenderness:2}]],
    enemies:[['Столкновение',{danger:3,rebellion:2}],['Противостояние',{power:2,drama:3,energy:2}],['Точка невозврата',{danger:3,chaos:2,darkness:2}],['Последствия',{melancholy:2,drama:2}],['После войны',{freedom:2,hope:1,nostalgia:1}]],
    forced:[['Вынуждены быть рядом',{danger:2,drama:2}],['Недоверие',{mystery:2,loneliness:1}],['Общая угроза',{danger:3,energy:2,epic:2}],['Доверие',{hope:2,tenderness:2}],['Настоящий союз',{hope:3,epic:2}]],
    lovers:[['Притяжение',{romance:3,tenderness:2}],['Сближение',{romance:2,hope:2}],['Испытание',{drama:2,danger:1}],['Выбор',{romance:2,drama:2}],['После выбора',{tenderness:3,hope:2}]],
    generic:[['Встреча',{mystery:1,energy:1}],['Сближение',{tenderness:1,hope:1}],['Испытание',{drama:2,danger:1}],['Перелом',{drama:2,melancholy:1}],['Новая точка',{hope:2,freedom:1}]]
  };
  const TRAJ_SHIFT = {
    no_change:[{},{} ,{}, {}, {hope:.5}], strangers_to_friends:[{mystery:1},{loneliness:1},{trust:1,hope:1},{tenderness:1,hope:1},{hope:2,tenderness:1}], strangers_to_enemies:[{mystery:1},{drama:1},{danger:2},{darkness:1,danger:1},{danger:2,freedom:1}], enemies_to_allies:[{danger:1},{mystery:1,drama:1},{danger:2,epic:1},{hope:1,tenderness:1},{hope:2,epic:1}], rivals_to_allies:[{rebellion:1},{danger:1,energy:1},{power:1,drama:1},{hope:1,tenderness:1},{hope:1,freedom:1}], friends_to_enemies:[{nostalgia:1},{drama:1},{danger:2,darkness:1},{melancholy:1,drama:1},{freedom:1,melancholy:1}], trust_to_betrayal:[{hope:1},{trust:1},{drama:2,mistrust:1},{pain:1,melancholy:1},{melancholy:2,freedom:1}], attachment_to_freedom:[{romance:1,dependence:1},{drama:1},{loneliness:1,freedom:1},{freedom:2,drama:1},{freedom:3,hope:1}], alienation_to_reunion:[{nostalgia:1},{melancholy:1},{drama:1.5,loneliness:1},{hope:1.5,tenderness:1},{hope:2,nostalgia:1}], protector_to_protected:[{duty:1},{danger:1},{tenderness:1,danger:1},{hope:1,tenderness:1},{hope:2}], hunter_to_hunted:[{danger:1},{power:1,chaos:1},{danger:2},{darkness:1,danger:1},{danger:2,chaos:1}], mentor_to_equal:[{power:1},{growth:1},{drama:1},{respect:1,hope:1},{freedom:1,power:1}], forced_allies_to_true_bond:[{danger:1},{mystery:1},{drama:1,danger:1},{tenderness:1,hope:1},{hope:2,tenderness:1}], enemies_to_lovers:[{danger:1,romance:1},{romance:2,drama:1},{romance:2,danger:1},{romance:3,tenderness:1},{romance:3,hope:2}], loss_to_recovery:[{nostalgia:1},{melancholy:2},{drama:1.5},{hope:1.5},{hope:2,tenderness:1}], redemption:[{darkness:1},{drama:1},{melancholy:1},{hope:2},{hope:3,freedom:1}], descent:[{mystery:1},{darkness:1},{danger:2},{chaos:2,darkness:1},{darkness:2,melancholy:1}]
  };
  const ROLE_MOD = {
    'герой':{hope:1,epic:1},'антигерой':{drama:1,darkness:1,rebellion:1},'злодей':{danger:1,darkness:2,power:1},'трикстер':{chaos:2,freedom:1,energy:1},'изгой':{loneliness:2,freedom:1},'избранный':{epic:2,power:1,drama:1},'исследователь':{mystery:2,drama:1},'искатель':{mystery:1,freedom:1,hope:1},'защитник':{tenderness:1,power:1,hope:1},'хранитель':{duty:1,mystery:1,nostalgia:1},'проводник':{mystery:2,freedom:1},'странник':{freedom:2,loneliness:1},'беглец':{freedom:2,danger:1,loneliness:1},'изгнанник':{loneliness:2,rebellion:1},'одиночка':{loneliness:2,freedom:1},'лидер':{power:2,epic:1},'наследник':{power:1,nostalgia:1,drama:1},'правитель':{power:2,drama:1},'аристократ':{power:1,nostalgia:1,romance:1},'дипломат':{mystery:1,hope:1,tenderness:1},'медиатор':{hope:1,tenderness:2},'наставник':{hope:1,power:1,tenderness:1},'ученик':{hope:1,mystery:1},'детектив':{mystery:2,drama:1},'следопыт':{mystery:1,freedom:1,danger:1},'охотник':{danger:2,rebellion:1,power:1},'телохранитель':{danger:1,power:2,tenderness:1},'солдат':{danger:2,drama:1,epic:1},'ветеран':{nostalgia:2,melancholy:1,drama:1},'наёмник':{danger:2,freedom:1},'шпион':{mystery:2,danger:1},'преступник':{danger:2,rebellion:1,chaos:1},'вор':{freedom:2,chaos:1},'целитель':{hope:2,tenderness:2},'медик':{hope:1,tenderness:1,drama:1},'оккультист':{mystery:2,darkness:1},'ритуалист':{mystery:2,epic:1},'прорицатель':{mystery:2,epic:1,nostalgia:1},'медиум':{mystery:2,loneliness:1,nostalgia:1},'экстрасенс':{mystery:2,energy:1},'архивист':{nostalgia:2,mystery:1},'учёный':{mystery:1,energy:1},'инженер':{energy:1,power:1},'программист':{mystery:1,energy:2},'хакер':{rebellion:2,energy:2,freedom:1},'художник':{romance:1,melancholy:1,energy:1},'писатель':{drama:1,mystery:1,nostalgia:1},'поэт':{romance:1,melancholy:2},'музыкант':{energy:1,romance:1,nostalgia:1},'актёр':{drama:2,romance:1},'журналист':{mystery:1,drama:1,rebellion:1},'преподаватель':{hope:1,tenderness:1},'спортсмен':{energy:2,power:1},'врач':{hope:1,tenderness:1,drama:1},'адвокат':{power:1,mystery:1,rebellion:1},'предприниматель':{power:2,energy:1},'бармен':{tenderness:1,nostalgia:1},'повар':{tenderness:1,energy:1},'антиквар':{nostalgia:2,mystery:1},'рейнджер':{freedom:2,danger:1},'волонтёр':{hope:2,tenderness:2},'активист':{rebellion:2,hope:1},'информатор':{mystery:2,danger:1},'агент':{mystery:1,danger:1},'коллекционер':{nostalgia:2,mystery:1}
  };
  const SPHERE_MOD = {'наука':{mystery:1},'медицина':{hope:1,tenderness:1,drama:1},'право':{power:1,drama:1},'искусство':{romance:1,melancholy:1},'литература':{drama:1,mystery:1,nostalgia:1},'музыка':{energy:1,romance:1,nostalgia:1},'театр':{drama:2,romance:1},'кино':{drama:2,mystery:1},'журналистика':{mystery:1,drama:1,rebellion:1},'медиа':{energy:1,chaos:1},'IT':{energy:2,mystery:1},'кибербезопасность':{danger:1,mystery:2},'инженерия':{power:1,energy:1},'археология':{mystery:2,nostalgia:1},'история':{nostalgia:2,mystery:1},'архивы':{nostalgia:2,mystery:2},'антиквариат':{nostalgia:2,mystery:1},'эзотерика':{mystery:2,darkness:1},'криминал':{danger:2,rebellion:1},'подполье':{danger:2,chaos:1},'военное дело':{danger:2,epic:1,power:1},'разведка':{mystery:2,danger:1},'охрана':{danger:1,power:1},'спорт':{energy:2,power:1},'туризм':{freedom:2,energy:1},'природа':{freedom:2,nostalgia:1},'экология':{hope:1,freedom:1},'торговля':{power:1,energy:1},'сфера услуг':{tenderness:1,energy:1},'ресторанный бизнес':{tenderness:1,energy:1},'гостеприимство':{tenderness:2,nostalgia:1},'исследования Изнанки':{mystery:2,darkness:1,epic:1},'исследования сверхъестественного':{mystery:2,danger:1,epic:1},'между мирами':{mystery:2,freedom:1,loneliness:1}};

  let options = null, scoring = null, music = [];

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c));
  const clamp = (n,a=0,b=10) => Math.max(a,Math.min(b,Number(n)||0));
  const blank = () => Object.fromEntries(DIMS.map(k => [k,0]));
  const add = (p,m) => { if(!m) return p; for(const [k,v] of Object.entries(m)) if(k in p && Number.isFinite(v)) p[k]+=v; return p; };
  const normalize = p => Object.fromEntries(DIMS.map(k => [k,clamp(p[k])]));
  const text = t => `${t.title||''} ${t.artist||''}`.toLowerCase();
  const hit = (t,w) => text(t).includes(String(w).toLowerCase());
  const hits = (t,arr=[]) => arr.reduce((n,w)=>n+(hit(t,w)?1:0),0);

  function renderOptions(){
    const race = options.races || [], roles=options.roles||[], spheres=options.life_spheres||[], starts=options.starting_points||[], current=options.current_arcs||[], future=options.future_arcs||[];
    const fill=(id,items,labelKey='label')=>{ const el=$(id); el.innerHTML=''; items.forEach((x,i)=>{const o=document.createElement('option');o.value=x.id??x;o.textContent=x[labelKey]??x;if(i===0)o.selected=true;el.appendChild(o);}); };
    fill('s-race',race);fill('s-role',roles);fill('s-sphere',spheres);fill('s-start',starts);fill('s-current',current);fill('s-future',future);
    ['p1','p2'].forEach(prefix=>{
      $(prefix+'-fields').innerHTML=`<div class="field"><label>Имя</label><input id="${prefix}-name" type="text" placeholder="Персонаж"></div><div class="field"><label>Раса</label><select id="${prefix}-race"></select></div><div class="field"><label>Роль</label><select id="${prefix}-role"></select></div><div class="field"><label>Сфера жизни</label><select id="${prefix}-sphere"></select></div><div class="field"><label>Отправная точка</label><select id="${prefix}-start"></select></div><div class="field"><label>Текущая линия</label><select id="${prefix}-current"></select></div><div class="field"><label>Возможное будущее</label><select id="${prefix}-future"></select></div>`;
      fill(prefix+'-race',race);fill(prefix+'-role',roles);fill(prefix+'-sphere',spheres);fill(prefix+'-start',starts);fill(prefix+'-current',current);fill(prefix+'-future',future);
    });
    const relEl=$('p-rel'); relEl.innerHTML=''; REL.forEach(([v,l])=>relEl.add(new Option(l,v))); relEl.value='друзья';
    const trEl=$('p-traj'); trEl.innerHTML=''; TRAJ.forEach(([v,l])=>trEl.add(new Option(l,v))); trEl.value='no_change';
  }

  function renderEq(id,prefix){
    const el=$(id); el.innerHTML='';
    EQ.forEach(([k,label])=>{const box=document.createElement('div');box.className='slider';box.innerHTML=`<label><span>${label}</span><span id="${prefix}-${k}-v">5</span></label><input id="${prefix}-${k}" type="range" min="0" max="10" step="1" value="5">`;el.appendChild(box);box.querySelector('input').addEventListener('input',e=>$(prefix+'-'+k+'-v').textContent=e.target.value);});
  }

  function readCharacter(prefix){
    const p=blank();
    EQ.forEach(([k])=>p[k]=Number($(prefix+'-'+k).value));
    const role=$(prefix+'-role').value, sphere=$(prefix+'-sphere').value, start=$(prefix+'-start').value, cur=$(prefix+'-current').value, future=$(prefix+'-future').value, race=$(prefix+'-race').value;
    add(p,ROLE_MOD[role]); add(p,SPHERE_MOD[sphere]);
    if(scoring.race_modifiers && scoring.race_modifiers[race]) add(p,Object.fromEntries(Object.entries(scoring.race_modifiers[race]).filter(([k])=>k in p).map(([k,v])=>[k,v*.65])));
    const sm=scoring.story_modifiers||{}; add(p,sm[start]); add(p,sm[cur]);
    const futureMap={'счастливый финал':{hope:4,tenderness:2},'горькая победа':{drama:2,hope:1,melancholy:2},'катастрофа':{danger:3,drama:3,darkness:2},'искупление':{hope:3,drama:2,darkness:1},'новая жизнь':{hope:3,freedom:2},'большая любовь':{romance:3,tenderness:2,hope:2},'одиночество':{loneliness:3,melancholy:2},'война':{danger:3,drama:2,epic:2},'неизвестность':{mystery:2,loneliness:1},'возвращение домой':{nostalgia:2,hope:2,tenderness:2},'самопожертвование':{drama:3,tenderness:2,epic:1},'предательство':{drama:3,mistrust:2,melancholy:2},'воссоединение':{hope:3,tenderness:3,nostalgia:2},'освобождение':{freedom:3,hope:2},'падение':{darkness:3,drama:2},'возвышение':{power:3,epic:2},'примирение':{hope:3,tenderness:2},'пробуждение силы':{power:3,energy:2},'снятие проклятия':{hope:2,darkness:-2},'принятие своей природы':{hope:2,identity:1},'открытый финал':{mystery:2,freedom:1},'изменение судьбы':{epic:2,rebellion:2,hope:2},'цена спасения':{drama:3,melancholy:2},'исчезновение':{loneliness:3,mystery:2},'новый цикл':{mystery:2,nostalgia:1}}; add(p,futureMap[future]);
    return {name:$(`${prefix}-name`).value.trim()||'Безымянный',race,role,sphere,start,current:cur,future,storyProfile:normalize(p),storyModifiers:normalize(p)};
  }

  function pairRelationProfile(a,b,type,trajectory){
    const p=blank();
    const relDim={
      'семья':{tenderness:4,nostalgia:4,drama:2,hope:1},'родственники':{tenderness:3,nostalgia:4,drama:2},'друзья':{hope:3,tenderness:4,freedom:2,nostalgia:2},'лучшие друзья':{hope:4,tenderness:5,freedom:2,nostalgia:3},'союзники':{hope:2,power:2,epic:1},'напарники':{hope:2,energy:2,danger:1},'наставник и ученик':{hope:3,tenderness:2,power:2,nostalgia:1},'соперники':{danger:2,rebellion:3,energy:2,power:2},'враги':{danger:5,darkness:3,chaos:2,drama:4,power:2},'бывшие союзники':{drama:4,nostalgia:2,danger:2,melancholy:2},'бывшие близкие':{nostalgia:3,melancholy:3,loneliness:2,drama:3},'любовники':{romance:5,tenderness:4,danger:1,drama:2},'неразделённые чувства':{romance:4,loneliness:4,melancholy:4,drama:3},'взаимное притяжение':{romance:5,danger:2,energy:2},'сложная привязанность':{romance:3,drama:4,danger:2,melancholy:3,chaos:2},'взаимная неприязнь':{danger:3,rebellion:2,drama:3},'долг':{drama:3,epic:2,power:1},'клятва':{drama:3,power:2,epic:3},'контракт':{danger:4,darkness:3,power:3,drama:2},'должник и кредитор':{danger:3,power:3,drama:3},'защитник и подопечный':{hope:3,tenderness:3,danger:2,drama:2},'связанные общей тайной':{mystery:5,drama:3,danger:2},'связанные проклятием':{darkness:4,drama:5,danger:3,melancholy:3},'охотник и добыча':{danger:5,mystery:3,energy:3},'связанные судьбой':{epic:4,drama:4,mystery:3,romance:2},'небесный и падший':{drama:4,hope:3,darkness:3,epic:3},'демон и заключивший контракт':{danger:5,darkness:5,power:4,drama:3},'соперники за одну цель':{energy:3,danger:3,rebellion:2,power:2}
    };
    add(p,relDim[type]||{mystery:1,drama:1});
    const pa=a.storyProfile,pb=b.storyProfile;
    for(const k of DIMS){const inter=Math.min(pa[k],pb[k]),contrast=Math.abs(pa[k]-pb[k]);p[k]+=(inter*.22);if(['drama','danger','chaos','power','darkness','rebellion'].includes(k))p[k]+=contrast*.10;}
    const tr=TRAJ_SHIFT[trajectory]||[]; if(tr.length) add(p,tr[2]||{});
    return normalize(p);
  }

  function arcKey(type,trajectory){
    if(trajectory==='enemies_to_lovers' || ['любовники','неразделённые чувства','взаимное притяжение','сложная привязанность'].includes(type)) return 'lovers';
    if(type==='семья' || type==='родственники') return 'sibling';
    if(type==='друзья' || type==='лучшие друзья') return 'friends';
    if(type==='враги' || type==='соперники' || type==='взаимная неприязнь' || trajectory==='friends_to_enemies') return 'enemies';
    if(['союзники','напарники','бывшие союзники'].includes(type) || ['enemies_to_allies','forced_allies_to_true_bond','strangers_to_friends','rivals_to_allies','protector_to_protected','mentor_to_equal'].includes(trajectory)) return 'forced';
    return 'generic';
  }

  function buildArc(base,type,trajectory){
    const template=STAGES[arcKey(type,trajectory)]||STAGES.generic, shifts=TRAJ_SHIFT[trajectory]||[];
    return template.map((s,i)=>({stage:i+1,name:s[0],profile:normalize(add(add({...base},s[1]),shifts[i]||{}))}));
  }

  function romantic(t){return /(love|lover|lovers|kiss|romance|romantic|desire|crush|sexy|sexual|beautiful|baby|darling|любов|целу|романс|желан|сердц)/i.test(text(t));}
  function semanticStage(t,stage,type){
    const stageTerms={
      'Общее прошлое':['home','family','memory','childhood','blood','past','дом','семь','памят','детств','прошл'],
      'Разлом':['goodbye','lost','alone','break','away','farewell','прощ','потер','разрыв'],
      'Точка боли':['pain','hurt','broken','death','dead','blood','боль','слом','смерт','кров'],
      'Возвращение':['return','reunion','forgive','home','again','возвращ','воссоедин','прощ','дом','снов'],
      'Домой':['home','family','reunion','together','forever','дом','семь','воссоедин','вместе','навсег'],
      'Свои люди':['friend','friends','together','best','forever','друз','вместе'],
      'Общее безумие':['adventure','chaos','freedom','fun','road','приключ','хаос','свобод','дорог'],
      'Проверка':['test','trial','risk','storm','испыт','риск'],
      'Выбор друг друга':['choose','choice','stay','together','forever','выбор','остань','вместе'],
      'Вместе':['friend','friends','together','forever','друз','вместе','навсег'],
      'Столкновение':['enemy','fight','battle','war','враг','бой','битв','войн'],
      'Противостояние':['enemy','fight','battle','war','power','враг','бой','битв','войн','сил'],
      'Точка невозврата':['death','end','never','lost','fire','war','смерт','конец','никогд','огн'],
      'Последствия':['loss','alone','broken','after','потер','один','послед'],
      'После войны':['peace','home','freedom','recovery','after','survive','мир','дом','свобод','после','выжив'],
      'Вынуждены быть рядом':['survival','allies','team','together','выжив','союз','команд','вместе'],
      'Недоверие':['doubt','secret','lie','suspicion','mystery','недовер','тайн','лож','сомн','подозр'],
      'Общая угроза':['danger','threat','survival','enemy','war','угроз','опасн','выжив','враг','войн'],
      'Доверие':['trust','faith','loyalty','believe','довер','вер','верност'],
      'Настоящий союз':['alliance','allies','team','unity','united','союз','команд','един'],
      'Притяжение':['love','kiss','heart','desire','romance','любов','целу','сердц','желан'],
      'Сближение':['love','together','heart','close','любов','вместе','сердц'],
      'Испытание':['test','trial','danger','risk','испыт','опасн','риск'],
      'Выбор':['choice','choose','stay','forever','выбор','остань','навсег'],
      'После выбора':['forever','home','together','hope','навсег','дом','вместе','надеж']
    };
    return hits(t,stageTerms[stage]||[])*10 + hits(t,REL_TERMS[type]||[])*9;
  }
  function scorePair(t,target,stage,type){
    let s=E.scoreTrack(t,target,scoring,{relationshipType:null,stageName:null});
    s+=semanticStage(t,stage,type);
    if(NON_ROMANTIC.has(type) && romantic(t)) s-=100;
    if(!NON_ROMANTIC.has(type) && romantic(t)) s+=16;
    return s;
  }
  function fingerprint(t){
    const tx=text(t), groups={family:['family','brother','sister','blood','home','семь','брат','сестр','кров','дом'],friendship:['friend','together','loyalty','друз','вместе','верност'],romance:['love','lover','kiss','heart','romance','любов','целу','сердц'],conflict:['war','fight','battle','enemy','hate','войн','бой','враг'],loss:['death','dead','goodbye','lost','alone','смерт','прощ','потер'],hope:['hope','free','home','again','rise','надеж','свобод','дом','снов']};
    return Object.keys(groups).filter(g=>groups[g].some(w=>tx.includes(w)));
  }
  function diversityPenalty(t,selected){let p=0;for(const x of selected){if(x.artist===t.artist)p+=90;if(x.category===t.category)p+=2;const a=fingerprint(x),b=fingerprint(t),over=a.filter(v=>b.includes(v)).length;if(over>=2)p+=12;else if(over===1)p+=3;}return p;}
  function chooseFive(arc,type){
    const used=[],out=[];
    for(const stage of arc){
      const ranked=music.map(t=>({...t,_score:scorePair(t,stage.profile,stage.name,type)})).sort((a,b)=>b._score-a._score);
      const candidates=ranked.filter(t=>!used.some(u=>u.artist===t.artist)&&!used.some(u=>u.title===t.title&&u.artist===t.artist));
      const pool=candidates.length?candidates:ranked.filter(t=>!used.some(u=>u.title===t.title&&u.artist===t.artist));
      let best=null,bs=-Infinity; for(const t of pool.slice(0,100)){const s=t._score-diversityPenalty(t,used);if(s>bs){bs=s;best=t;}}
      if(best){used.push(best);out.push({...best,finalScore:bs,stage:stage.stage,stageName:stage.name,stageProfile:stage.profile});}
    }
    return out;
  }

  function tone(profile){
    if(profile.romance>=7 && profile.tenderness>=6) return 'romantic';
    if(profile.darkness>=7 || profile.danger>=7) return 'dark';
    if(profile.chaos>=7 || profile.energy>=8) return 'chaotic';
    if(profile.epic>=7 || profile.power>=8) return 'epic';
    if(profile.drama>=7 || profile.melancholy>=7) return 'dramatic';
    return 'quiet';
  }
  function prediction(type,trajectory,focus,arc){
    const t=REL.find(x=>x[0]===type)?.[1]||type, tr=TRAJ.find(x=>x[0]===trajectory)?.[1]||trajectory;
    const last=arc[arc.length-1]?.name||'финал';
    const byTraj={
      no_change:`Их связь останется узнаваемой: внешние обстоятельства могут меняться, но главное между ними сохранится.`,
      strangers_to_friends:`Сначала им придётся научиться видеть друг в друге союзника, а уже потом — человека, которому можно доверять.`,
      strangers_to_enemies:`Чем больше они узнают друг о друге, тем труднее будет сохранить нейтралитет: недоверие постепенно станет открытым противостоянием.`,
      enemies_to_allies:`Вынужденное сотрудничество сначала будет держаться на необходимости, но общая опасность заставит их пересмотреть старые представления друг о друге.`,
      rivals_to_allies:`Соперничество не исчезнет сразу: уважение возникнет именно потому, что каждый увидит пределы и силу другого.`,
      friends_to_enemies:`То, что когда-то давало им чувство дома, может стать самым болезненным местом конфликта.`,
      trust_to_betrayal:`Доверие станет их главной ставкой — и именно поэтому возможное предательство изменит отношения сильнее любого внешнего врага.`,
      attachment_to_freedom:`Им придётся решить, где заканчивается близость и начинается зависимость; освобождение одного неизбежно затронет другого.`,
      alienation_to_reunion:`Разрыв не отменит их общей истории. Если они смогут пройти через старую боль, возвращение окажется не возвратом в прошлое, а созданием новой связи.`,
      protector_to_protected:`Роли будут постепенно меняться: тот, кто привык спасать, однажды окажется вынужденным довериться другому.`,
      hunter_to_hunted:`Охота перевернётся, и тот, кто считал себя контролирующим ситуацию, окажется уязвимым.`,
      mentor_to_equal:`Старая иерархия будет разрушена, когда ученик перестанет быть учеником, а наставник признает в нём равного.`,
      forced_allies_to_true_bond:`Их союз начнётся с необходимости, но пережитая опасность может превратить временное партнёрство в настоящую привязанность.`,
      enemies_to_lovers:`Притяжение будет расти именно там, где им хотелось бы сохранить дистанцию; выбор между гордостью и близостью станет главным испытанием.`,
      loss_to_recovery:`После утраты отношения будут собираться заново — медленно, через принятие прошлого и осторожное возвращение надежды.`,
      redemption:`Их связь станет частью пути к искуплению: важнее всего окажется не забыть прошлое, а сделать следующий выбор иначе.`,
      descent:`Каждый следующий шаг будет вести глубже; вопрос не в том, кто победит, а в том, сколько они готовы потерять по дороге.`
    };
    return `Их история начинается с типа связи «${t}» и движется по траектории «${tr}». ${byTraj[trajectory]||'Их отношения будут меняться под давлением обстоятельств, а каждое решение станет частью общей истории.'} На этапе «${last}» станет ясно, что именно удерживает их рядом. Фокус генерации — ${focus==='connection'?'они сами':focus==='bond'?'их связь':focus==='events'?'то, что с ними происходит':'их конфликт'}.`;
  }
  function storyText(character){
    const p=character.storyProfile,t=tone(p),future=character.future||'неизвестность';
    const opening=t==='dark'?'история начинается с тени и ощущения скрытой угрозы':t==='romantic'?'история начинается с притяжения, которое невозможно полностью объяснить':t==='epic'?'история начинается как личная история, но постепенно выходит за пределы одного человека':t==='chaotic'?'история начинается с ощущения, что привычные правила уже перестали работать':t==='dramatic'?'история начинается с внутреннего напряжения и прошлого, которое ещё не отпустило':'история начинается тихо, почти незаметно';
    return `${opening}. Затем ${character.current||'герой оказывается перед новым выбором'}, а возможное будущее — «${future}». Музыкально это история о ${p.hope>=7?'надежде':p.darkness>=7?'тени':p.melancholy>=7?'памяти и утрате':p.freedom>=7?'свободе':'поиске собственного пути'}.`;
  }

  function renderProfile(p,label){
    const top=[...DIMS].sort((a,b)=>p[b]-p[a]).slice(0,8);
    return `<div class="small"><b>${esc(label)}</b></div><div class="profile">${top.map(k=>`<span class="pill">${EQ.find(x=>x[0]===k)?.[1]||k} ${p[k].toFixed(1)}</span>`).join('')}</div>`;
  }
  function renderTracks(tracks){return tracks.map((x,i)=>`<div class="result"><div class="stage">${x.stage?`Этап ${x.stage} · ${esc(x.stageName)}`:`${i+1}. Результат`}</div><div class="song"><b>${i+1}. ${esc(x.title)}</b> — ${esc(x.artist)}</div><div class="score">Итоговый score: ${Number(x.finalScore??x.score??0).toFixed(2)} · ${esc(x.category||'—')}</div></div>`).join('');}

  async function load(){
    try{
      const [opt,sc]=await Promise.all([fetch('../data/character-options.json').then(r=>r.json()),fetch('../data/music-scoring.json').then(r=>r.json())]); options=opt;scoring=sc;
      const groups=await Promise.all(SOURCES.map(c=>fetch(`../data/music/${c}.json`).then(r=>r.json()).then(d=>(d.tracks||[]).map(t=>({...t,category:c})) )));
      const seen=new Set(); music=groups.flat().filter(t=>{const k=`${t.artist}::${t.title}`.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
      renderOptions();renderEq('single-eq','s');renderEq('p1-eq','p1');renderEq('p2-eq','p2');
      $('single-run').disabled=false;$('pair-run').disabled=false;$('status').textContent=`✓ Загружено ${music.length} треков · новый генератор готов`;
    }catch(e){$('status').className='status';$('status').innerHTML=`<span class="error">Не удалось загрузить генератор: ${esc(e.stack||e.message)}</span>`;}
  }

  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$(btn.dataset.mode).classList.add('active');}));
  $('single-run').addEventListener('click',()=>{try{const c=readCharacter('s');const r=E.generatePersonalSoundtrack(c,music,scoring,{limit:5});$('single-out').innerHTML=`<section class="card"><h2>Результат</h2>${renderProfile(r.targetProfile,'Музыкальный профиль')}${renderTracks(r.tracks)}<div class="prediction"><strong>Если бы его/её история была песней</strong><p>${esc(storyText(c))}</p></div></section>`;}catch(e){$('single-out').innerHTML=`<div class="error">${esc(e.stack||e.message)}</div>`;}});
  $('pair-run').addEventListener('click',()=>{try{const a=readCharacter('p1'),b=readCharacter('p2'),type=$('p-rel').value,tr=$('p-traj').value,focus=$('p-focus').value;base=pairRelationProfile(a,b,type,tr);const arc=buildArc(base,type,tr);const tracks=chooseFive(arc,type);$('pair-out').innerHTML=`<section class="card"><h2>Их музыкальная история</h2>${renderProfile(base,'Общий профиль отношений')}<div class="small" style="margin-top:12px">${esc(a.name)} × ${esc(b.name)} · ${esc(REL.find(x=>x[0]===type)?.[1]||type)} · ${esc(TRAJ.find(x=>x[0]===tr)?.[1]||tr)}</div>${renderTracks(tracks)}<div class="prediction"><strong>Предсказание для их отношений</strong><p>${esc(prediction(type,tr,focus,arc))}</p></div></section>`;}catch(e){$('pair-out').innerHTML=`<div class="error">${esc(e.stack||e.message)}</div>`;}});
  load();
})();
