/* Personal Soundtrack Generator — scoring engine v3
 * Browser-first, deterministic, no AI/API required.
 * Pair mode treats two characters, relationship, trajectory and focus separately.
 */
const DEFAULT_DIMENSIONS=['drama','romance','danger','mystery','hope','loneliness','nostalgia','chaos','power','freedom','melancholy','tenderness','rebellion','darkness','epic','energy'];
const clamp=(v,min=0,max=10)=>Math.max(min,Math.min(max,Number(v)||0));
const emptyProfile=(d=DEFAULT_DIMENSIONS)=>Object.fromEntries(d.map(k=>[k,0]));
function addProfile(t,s,m=1){if(!s)return t;for(const[k,v]of Object.entries(s))if(typeof v==='number'&&k in t)t[k]=(t[k]||0)+v*m;return t;}
function normalizeProfile(p,d=DEFAULT_DIMENSIONS){return Object.fromEntries(d.map(k=>[k,clamp(p[k])]));}
function profileDistance(a,b,d=DEFAULT_DIMENSIONS){return d.reduce((s,k)=>s+Math.abs((a[k]||0)-(b[k]||0)),0)/d.length;}
function profileSimilarity(a,b,d=DEFAULT_DIMENSIONS){return 10-profileDistance(a,b,d);}
function titleSignalProfile(track,scoring){const p=emptyProfile(scoring.dimensions||DEFAULT_DIMENSIONS),text=`${track.title||''} ${track.artist||''}`.toLowerCase();for(const[signal,mods]of Object.entries(scoring.title_signals||{}))if(text.includes(signal.toLowerCase()))addProfile(p,mods,.45);return p;}
function categoryProfile(track,scoring){const c=track.category||track.layer||'';return scoring.base_profiles?.[c]?.dimensions||emptyProfile(scoring.dimensions||DEFAULT_DIMENSIONS);}
function buildCharacterProfile(character,scoring){const d=scoring.dimensions||DEFAULT_DIMENSIONS,p=emptyProfile(d),r=scoring.race_modifiers||{};if(character.race)addProfile(p,r[character.race],.65);if(character.secondaryRace)addProfile(p,r[character.secondaryRace],.35);addProfile(p,character.storyModifiers,1);addProfile(p,character.storyProfile,1);return normalizeProfile(p,d);}

const REL_ALIASES={friends:['друзья','лучшие друзья'],best_friends:['лучшие друзья'],sibling:['семья','родственники'],siblings:['семья','родственники'],family:['семья'],forced_alliance:['союзники','напарники'],allies:['союзники'],rivals:['соперники'],enemies:['враги'],former_allies:['бывшие союзники'],lovers:['любовники'],unrequited_love:['неразделённые чувства'],mutual_attraction:['взаимное притяжение'],complicated_attachment:['сложная привязанность'],mutual_dislike:['взаимная неприязнь'],duty:['долг'],oath:['клятва'],contract:['контракт'],debtor_creditor:['должник и кредитор'],protector_protected:['защитник и подопечный'],shared_secret:['связанные общей тайной'],shared_curse:['связанные проклятием'],hunter_prey:['охотник и добыча']};
const TRAJECTORY_ALIASES={no_change:['no_change'],enemies_to_allies:['enemies_to_allies'],alienation_to_reunion:['alienation_to_reunion'],forced_allies_to_true_bond:['forced_allies_to_true_bond'],friends_to_enemies:['friends_to_enemies'],enemies_to_lovers:['enemies_to_lovers'],strangers_to_allies:['strangers_to_allies'],rivalry_to_respect:['rivalry_to_respect'],loss_to_recovery:['loss_to_recovery'],descent:['descent'],redemption:['redemption']};
function resolveModifier(modifiers,id,aliases={}){if(!id)return null;if(modifiers?.[id])return modifiers[id];for(const key of(aliases[id]||[]))if(modifiers?.[key])return modifiers[key];return null;}
const NON_ROMANTIC_REL=new Set(['sibling','siblings','family','friends','best_friends','forced_alliance','allies','rivals','enemies','former_allies','mutual_dislike','duty','oath','contract','debtor_creditor','protector_protected','shared_secret','shared_curse','hunter_prey']);
const ROMANTIC_REL=new Set(['lovers','unrequited_love','mutual_attraction','complicated_attachment','enemies_to_lovers']);

/* Semantic vocabulary is deliberately separate from emotional dimensions. */
const REL_SEMANTICS={
 sibling:{positive:['brother','sister','sisters','brothers','family','home','blood','childhood','together','kin','relative','родн','брат','сестр','семь','дом','кров','детств'],negative:['love','lover','kiss','desire','crush','sexy','baby','darling']},
 friends:{positive:['friend','friends','together','best','youth','road','forever','side','buddy','друз','вместе','товарищ'],negative:['lover','kiss','desire','sexy']},
 enemies:{positive:['enemy','enemies','war','fight','battle','hate','revenge','kill','blood','войн','враг','битв','ненав','месть','убий'],negative:['tender','home','friendship']},
 forced_alliance:{positive:['together','united','stand','team','allies','ally','survive','war','fight','союз','вместе','команд','выжив','войн'],negative:[]},
 lovers:{positive:['love','lover','lovers','kiss','heart','desire','romance','beautiful','baby','darling','любов','целу','сердц','желан'],negative:[]},
 generic:{positive:['together','story','time','road','night','memory'],negative:[]}
};
const STAGE_SEMANTICS={
 'Общее прошлое':['home','memory','memories','childhood','youth','blood','family','together','вместе','дом','памят','детств','прошл'],
 'Свои люди':['friend','friends','together','best','forever','side','друз','вместе'],
 'Столкновение':['enemy','fight','battle','war','conflict','враг','бой','битв','войн'],
 'Вынуждены быть рядом':['together','survive','allies','team','союз','вместе','выжив'],
 'Притяжение':['love','kiss','heart','desire','любов','целу','сердц'],
 'Встреча':['meet','stranger','begin','first','встр','перв'],
 'Разлом':['goodbye','lost','alone','break','away','distance','farewell','прощ','один','потер','разрыв'],
 'Недоверие':['trust','secret','lie','doubt','shadow','тайн','лож','сомн','тен'],
 'Противостояние':['war','fight','battle','power','enemy','войн','бой','битв','враг'],
 'Точка боли':['pain','hurt','broken','death','dead','cry','blood','боль','слом','смерт','кров'],
 'Точка невозврата':['death','end','never','lost','fire','war','смерт','конец','никогд','огн'],
 'Проверка':['test','trial','fight','storm','risk','испыт','бур','риск'],
 'Общая угроза':['danger','threat','war','run','fire','survive','угроз','опасн','войн','бег','огн'],
 'Доверие':['trust','believe','faith','together','stand','вер','довер','вместе'],
 'Выбор друг друга':['choose','choice','stay','together','forever','выбор','остань','вместе'],
 'Возвращение':['home','return','back','again','together','forgive','верн','дом','снов','вместе','прощ'],
 'Домой':['home','homecoming','return','together','family','blood','forever','дом','возвращ','семь','кров','вместе'],
 'После войны':['after','peace','home','free','freedom','после','мир','дом','свобод'],
 'Настоящий союз':['allies','ally','together','united','stand','team','союз','вместе','команд'],
 'Вместе':['together','forever','friend','friends','вместе','навсег','друз'],
 'Связь':['together','bond','connection','heart','blood','вместе','связ','сердц','кров']
};
function textOfTrack(track){return `${track.title||''} ${track.artist||''} ${(track.tags||[]).join(' ')}`.toLowerCase();}
function semanticHits(track,words){const text=textOfTrack(track);return words.reduce((n,w)=>n+(text.includes(w.toLowerCase())?1:0),0);}
function relationshipKey(type){if(['sibling','siblings','family'].includes(type))return'sibling';if(['friends','best_friends'].includes(type))return'friends';if(['enemies','rivals','mutual_dislike'].includes(type))return'enemies';if(['forced_alliance','allies','former_allies'].includes(type))return'forced_alliance';if(ROMANTIC_REL.has(type))return'lovers';return'generic';}
function relationshipSemanticScore(track,type){const sem=REL_SEMANTICS[relationshipKey(type)]||REL_SEMANTICS.generic;return semanticHits(track,sem.positive)*5-semanticHits(track,sem.negative)*12;}
function stageSemanticScore(track,stageName){return semanticHits(track,STAGE_SEMANTICS[stageName]||[])*3;}

function buildRelationshipProfile(a,b,type,trajectory,scoring){const d=scoring.dimensions||DEFAULT_DIMENSIONS,p=emptyProfile(d);addProfile(p,resolveModifier(scoring.relationship_modifiers,type,REL_ALIASES),1.35);const tr=resolveModifier(scoring.trajectory_modifiers,trajectory,TRAJECTORY_ALIASES);if(Array.isArray(tr))for(const tag of tr)if(d.includes(tag))p[tag]=(p[tag]||0)+1.25;else addProfile(p,tr,1.1);const pa=buildCharacterProfile(a,scoring),pb=buildCharacterProfile(b,scoring);for(const k of d){p[k]+=Math.min(pa[k],pb[k])*.14;if(['drama','danger','chaos','power','darkness','rebellion'].includes(k))p[k]+=Math.abs(pa[k]-pb[k])*.05;}return normalizeProfile(p,d);}
function buildStoryProfile(character,scoring){return buildCharacterProfile(character,scoring);}
function getFocusWeights(scoring,focus='connection'){const aliases={connection:['connection','bond'],bond:['bond','connection'],events:['events','trajectory'],conflict:['conflict'],individual:['individual']};const candidates=[focus,...(aliases[focus]||[])];for(const id of candidates){const found=scoring.focus_modes?.find(m=>m.id===id);if(found)return found.weights;}return{relationship_profile:.45,emotional_intersection:.16,character_contrast:.08,trajectory:.21,individual_context:.10};}
function buildPairTarget(a,b,type,trajectory,scoring,focus='connection'){const d=scoring.dimensions||DEFAULT_DIMENSIONS,pa=buildCharacterProfile(a,scoring),pb=buildCharacterProfile(b,scoring),rel=buildRelationshipProfile(a,b,type,trajectory,scoring),w=getFocusWeights(scoring,focus),target=emptyProfile(d);for(const k of d){const intersection=Math.min(pa[k],pb[k]),contrast=Math.abs(pa[k]-pb[k]),individual=(pa[k]+pb[k])/2;target[k]=rel[k]*w.relationship_profile+intersection*w.emotional_intersection+contrast*w.character_contrast+rel[k]*w.trajectory+individual*w.individual_context;}return normalizeProfile(target,d);}
function shift(p,changes,d=DEFAULT_DIMENSIONS){const out={...p};for(const[k,v]of Object.entries(changes))if(k in out)out[k]+=v;return normalizeProfile(out,d);}

const ARC_TEMPLATES={
 sibling:{stages:[{name:'Общее прошлое',changes:{nostalgia:2.2,tenderness:2.2,hope:1}},{name:'Разлом',changes:{drama:2,melancholy:2.2,loneliness:1.2}},{name:'Точка боли',changes:{drama:3,melancholy:2.5,danger:1}},{name:'Возвращение',changes:{hope:2.5,tenderness:2.2,nostalgia:1.2}},{name:'Домой',changes:{hope:3,tenderness:3,nostalgia:2.5,loneliness:-2}}]},
 friends:{stages:[{name:'Свои люди',changes:{hope:2,tenderness:2,freedom:1}},{name:'Общее безумие',changes:{energy:2,chaos:2,freedom:2}},{name:'Проверка',changes:{drama:2,danger:1}},{name:'Выбор друг друга',changes:{hope:3,tenderness:2}},{name:'Вместе',changes:{hope:3,energy:1,tenderness:2}}]},
 enemies:{stages:[{name:'Столкновение',changes:{danger:3,rebellion:2}},{name:'Противостояние',changes:{power:2,drama:3,energy:2}},{name:'Точка невозврата',changes:{danger:3,chaos:2,darkness:2}},{name:'Последствия',changes:{melancholy:2,drama:2}},{name:'После войны',changes:{freedom:2,hope:1,nostalgia:1}}]},
 forced_alliance:{stages:[{name:'Вынуждены быть рядом',changes:{danger:2,drama:2}},{name:'Недоверие',changes:{mystery:2,loneliness:1}},{name:'Общая угроза',changes:{danger:3,energy:2,epic:2}},{name:'Доверие',changes:{hope:2,tenderness:2}},{name:'Настоящий союз',changes:{hope:3,epic:2}}]},
 lovers:{stages:[{name:'Притяжение',changes:{romance:3,tenderness:2}},{name:'Сближение',changes:{romance:2,hope:2}},{name:'Испытание',changes:{drama:2,danger:1}},{name:'Выбор',changes:{romance:2,drama:2}},{name:'После выбора',changes:{tenderness:3,hope:2}}]},
 generic:{stages:[{name:'Встреча',changes:{mystery:1,energy:1}},{name:'Сближение',changes:{tenderness:1,hope:1}},{name:'Испытание',changes:{drama:2,danger:1}},{name:'Перелом',changes:{drama:2,melancholy:1}},{name:'Новая точка',changes:{hope:2,freedom:1}}]}
};
const TRAJECTORY_STAGE={
 alienation_to_reunion:[{nostalgia:1},{melancholy:1},{drama:1.5,loneliness:1},{hope:1.5,tenderness:1},{hope:2,nostalgia:1}],
 enemies_to_allies:[{danger:1},{mystery:1,drama:1},{danger:2,epic:1},{hope:1,tenderness:1},{hope:2,epic:1}],
 forced_allies_to_true_bond:[{danger:1},{mystery:1},{drama:1,danger:1},{tenderness:1,hope:1},{hope:2,tenderness:1}],
 friends_to_enemies:[{nostalgia:1},{drama:1},{danger:2,darkness:1},{melancholy:1,drama:1},{freedom:1,melancholy:1}],
 rivalry_to_respect:[{rebellion:1},{danger:1,energy:1},{power:1,drama:1},{hope:1,tenderness:1},{respect:1,hope:1}],
 loss_to_recovery:[{nostalgia:1},{melancholy:2},{drama:1.5},{hope:1.5},{hope:2,tenderness:1}],
 redemption:[{darkness:1},{drama:1},{melancholy:1},{hope:2},{hope:3,freedom:1}],
 descent:[{mystery:1},{darkness:1},{danger:2},{chaos:2,darkness:1},{darkness:2,melancholy:1}]
};
function arcKey(type,trajectory){if(ROMANTIC_REL.has(type)||trajectory==='enemies_to_lovers')return'lovers';if(['sibling','siblings','family'].includes(type))return'sibling';if(['friends','best_friends'].includes(type))return'friends';if(['enemies','rivals','mutual_dislike'].includes(type)||trajectory==='friends_to_enemies')return'enemies';if(['forced_alliance','allies','former_allies'].includes(type)||['enemies_to_allies','forced_allies_to_true_bond','strangers_to_allies','rivalry_to_respect'].includes(trajectory))return'forced_alliance';return'generic';}
function buildPairArc(a,b,type,trajectory,scoring,focus){const d=scoring.dimensions||DEFAULT_DIMENSIONS,base=buildPairTarget(a,b,type,trajectory,scoring,focus),key=arcKey(type,trajectory),template=ARC_TEMPLATES[key]||ARC_TEMPLATES.generic,trajectoryStages=TRAJECTORY_STAGE[trajectory]||[];return template.stages.map((stage,i)=>({stage:i+1,name:stage.name,profile:shift(base,{...(trajectoryStages[i]||{}),...(stage.changes||{})},d)}));}
function titleRomanceSignal(track){const text=textOfTrack(track);return/(love|lover|lovers|kiss|romance|desire|crush|beautiful|baby|darling|sexy|do me|#1 crush|любов|целу|романс|желан|сердц)/i.test(text);}
function scoreTrack(track,target,scoring,context={}){const d=scoring.dimensions||DEFAULT_DIMENSIONS,song=normalizeProfile(addProfile({...categoryProfile(track,scoring)},titleSignalProfile(track,scoring)),d);let score=profileSimilarity(song,target,d)*10;if(context.preferredCategories?.includes(track.category))score+=7;if(context.avoidCategories?.includes(track.category))score-=8;if(Array.isArray(track.tags)&&Array.isArray(context.tags))score+=Math.min(12,track.tags.filter(t=>context.tags.includes(t)).length*2);if(context.relationshipType)score+=relationshipSemanticScore(track,context.relationshipType);if(context.stageName)score+=stageSemanticScore(track,context.stageName);if(context.nonRomantic&&titleRomanceSignal(track))score-=20;if(context.romantic&&!titleRomanceSignal(track)&&((song.romance||0)+(song.tenderness||0))<10)score-=3;return score;}
function semanticFingerprint(track){const text=textOfTrack(track),groups={time:['time','hour','clock','вечер','ноч','врем'],family:['brother','sister','family','blood','home','брат','сестр','семь','дом','кров'],romance:['love','lover','kiss','heart','любов','целу','сердц'],conflict:['war','fight','battle','enemy','hate','войн','бой','враг'],loss:['death','dead','goodbye','lost','alone','смерт','прощ','потер'],hope:['hope','free','home','again','rise','надеж','свобод','дом','снов']};return Object.keys(groups).filter(g=>groups[g].some(w=>text.includes(w)));}
function diversityPenalty(track,selected,index){let p=index*.5;for(const prev of selected){if(prev.artist===track.artist)p+=35;if(prev.category===track.category)p+=3;if(prev.title===track.title)p+=100;const a=semanticFingerprint(prev),b=semanticFingerprint(track);if(a.length&&b.length&&a.filter(x=>b.includes(x)).length>=2)p+=8;}return p;}
function rankTracks(tracks,target,scoring,options={}){const limit=options.limit||5,ranked=tracks.map(t=>({...t,score:scoreTrack(t,target,scoring,options)})).sort((a,b)=>b.score-a.score),selected=[],pool=[...ranked];while(selected.length<limit&&pool.length){let bi=0,bs=-Infinity;for(let i=0;i<pool.length;i++){const s=pool[i].score-diversityPenalty(pool[i],selected,selected.length);if(s>bs){bs=s;bi=i;}}const chosen=pool.splice(bi,1)[0],penalty=diversityPenalty(chosen,selected,selected.length);selected.push({...chosen,finalScore:chosen.score-penalty});}return selected;}
function rankArc(tracks,arc,scoring,options={}){const used=[],result=[];for(const stage of arc){const opts={...options,limit:Math.max(12,options.stagePool||12),nonRomantic:options.nonRomantic,relationshipType:options.relationshipType,stageName:stage.name};const ranked=rankTracks(tracks,stage.profile,scoring,opts).filter(t=>!used.some(u=>u.title===t.title&&u.artist===t.artist));const chosen=ranked[0];if(chosen){used.push(chosen);result.push({...chosen,stage:stage.stage,stageName:stage.name,stageProfile:stage.profile});}}return result.slice(0,options.limit||5);}
function generatePersonalSoundtrack(character,tracks,scoring,options={}){const target=buildStoryProfile(character,scoring);return{targetProfile:target,tracks:rankTracks(tracks,target,scoring,options)};}
function generateSharedSoundtrack(a,b,tracks,scoring,options={}){const focus=options.focus||'connection',type=options.relationshipType,trajectory=options.trajectory,target=buildPairTarget(a,b,type,trajectory,scoring,focus),arc=buildPairArc(a,b,type,trajectory,scoring,focus),nonRomantic=NON_ROMANTIC_REL.has(type)&&trajectory!=='enemies_to_lovers',tracksOut=rankArc(tracks,arc,scoring,{...options,nonRomantic,relationshipType:type,limit:options.limit||5});return{focus,relationshipType:type,trajectory,targetProfile:target,arc:arc.map(x=>({stage:x.stage,name:x.name,profile:x.profile})),tracks:tracksOut};}
window.SoundtrackEngine={buildCharacterProfile,buildStoryProfile,buildRelationshipProfile,buildPairTarget,buildPairArc,generatePersonalSoundtrack,generateSharedSoundtrack,rankTracks,scoreTrack,normalizeProfile};
