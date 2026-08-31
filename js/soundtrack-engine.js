/* Personal Soundtrack Generator — scoring engine
 * Browser-first build. Deterministic local scoring; no AI/API required.
 * Pair mode: two character profiles + relationship + trajectory + focus + five-stage arc.
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

function buildRelationshipProfile(a,b,type,trajectory,scoring){
 const d=scoring.dimensions||DEFAULT_DIMENSIONS,p=emptyProfile(d);
 addProfile(p,resolveModifier(scoring.relationship_modifiers,type,REL_ALIASES),1.25);
 const tr=resolveModifier(scoring.trajectory_modifiers,trajectory,TRAJECTORY_ALIASES);
 if(Array.isArray(tr))for(const tag of tr)if(d.includes(tag))p[tag]=(p[tag]||0)+1.15;else addProfile(p,tr,1.05);
 const pa=buildCharacterProfile(a,scoring),pb=buildCharacterProfile(b,scoring);
 for(const k of d){p[k]+=Math.min(pa[k],pb[k])*.12;if(['drama','danger','chaos','power','darkness','rebellion'].includes(k))p[k]+=Math.abs(pa[k]-pb[k])*.05;}
 return normalizeProfile(p,d);
}
function buildStoryProfile(character,scoring){return buildCharacterProfile(character,scoring);}

function getFocusWeights(scoring,focus='connection'){
 const aliases={connection:['connection','bond'],bond:['bond','connection'],events:['events','trajectory'],conflict:['conflict'],individual:['individual']};
 const candidates=[focus,...(aliases[focus]||[])];
 for(const id of candidates){const found=scoring.focus_modes?.find(m=>m.id===id);if(found)return found.weights;}
 return {relationship_profile:.48,emotional_intersection:.16,character_contrast:.08,trajectory:.18,individual_context:.10};
}

function buildPairTarget(a,b,type,trajectory,scoring,focus='connection'){
 const d=scoring.dimensions||DEFAULT_DIMENSIONS,pa=buildCharacterProfile(a,scoring),pb=buildCharacterProfile(b,scoring),rel=buildRelationshipProfile(a,b,type,trajectory,scoring),w=getFocusWeights(scoring,focus),target=emptyProfile(d);
 for(const k of d){const intersection=Math.min(pa[k],pb[k]),contrast=Math.abs(pa[k]-pb[k]),individual=(pa[k]+pb[k])/2;target[k]=rel[k]*w.relationship_profile+intersection*w.emotional_intersection+contrast*w.character_contrast+rel[k]*w.trajectory+individual*w.individual_context;}
 return normalizeProfile(target,d);
}

function blendProfiles(profiles,weights,d=DEFAULT_DIMENSIONS){const out=emptyProfile(d);profiles.forEach((p,i)=>addProfile(out,p,weights[i]??0));return normalizeProfile(out,d);}
function shift(p,changes,d=DEFAULT_DIMENSIONS){const out={...p};for(const[k,v]of Object.entries(changes))if(k in out)out[k]+=v;return normalizeProfile(out,d);}

/* Five musical story stages. They are intentionally structural, not romantic by default. */
const ARC_TEMPLATES={
 sibling:{stages:[{name:'Общее прошлое',changes:{nostalgia:2,tenderness:2,hope:1}},{name:'Разлом',changes:{drama:2,melancholy:2,loneliness:1}},{name:'Точка боли',changes:{drama:3,melancholy:2,danger:1}},{name:'Возвращение',changes:{hope:2,tenderness:2,nostalgia:1}},{name:'Домой',changes:{hope:3,tenderness:3,nostalgia:2,loneliness:-2}}]},
 friends:{stages:[{name:'Свои люди',changes:{hope:2,tenderness:2,freedom:1}},{name:'Общее безумие',changes:{energy:2,chaos:2,freedom:2}},{name:'Проверка',changes:{drama:2,danger:1}},{name:'Выбор друг друга',changes:{hope:3,loyalty:2,tenderness:2}},{name:'Вместе',changes:{hope:3,energy:1,tenderness:2}}]},
 enemies:{stages:[{name:'Столкновение',changes:{danger:3,rebellion:2}},{name:'Противостояние',changes:{power:2,drama:3,energy:2}},{name:'Точка невозврата',changes:{danger:3,chaos:2,darkness:2}},{name:'Последствия',changes:{melancholy:2,drama:2}},{name:'После войны',changes:{freedom:2,hope:1,nostalgia:1}}]},
 forced_alliance:{stages:[{name:'Вынуждены быть рядом',changes:{danger:2,drama:2}},{name:'Недоверие',changes:{mystery:2,loneliness:1}},{name:'Общая угроза',changes:{danger:3,energy:2,epic:2}},{name:'Доверие',changes:{hope:2,tenderness:2}},{name:'Настоящий союз',changes:{hope:3,epic:2,loyalty:2}}]},
 lovers:{stages:[{name:'Притяжение',changes:{romance:3,tenderness:2}},{name:'Сближение',changes:{romance:2,hope:2}},{name:'Испытание',changes:{drama:2,danger:1}},{name:'Выбор',changes:{romance:2,drama:2}},{name:'После выбора',changes:{tenderness:3,hope:2}}]},
 generic:{stages:[{name:'Встреча',changes:{mystery:1,energy:1}},{name:'Сближение',changes:{tenderness:1,hope:1}},{name:'Испытание',changes:{drama:2,danger:1}},{name:'Перелом',changes:{drama:2,melancholy:1}},{name:'Новая точка',changes:{hope:2,freedom:1}}]}
};
function arcKey(type,trajectory){if(ROMANTIC_REL.has(type)||trajectory==='enemies_to_lovers')return'lovers';if(['sibling','siblings','family'].includes(type))return'sibling';if(['friends','best_friends'].includes(type))return'friends';if(['enemies','rivals','mutual_dislike'].includes(type)||trajectory==='friends_to_enemies')return'enemies';if(['forced_alliance','allies','former_allies'].includes(type)||['enemies_to_allies','forced_allies_to_true_bond','strangers_to_allies','rivalry_to_respect'].includes(trajectory))return'forced_alliance';return'generic';}
function buildPairArc(a,b,type,trajectory,scoring,focus){
 const d=scoring.dimensions||DEFAULT_DIMENSIONS,base=buildPairTarget(a,b,type,trajectory,scoring,focus),key=arcKey(type,trajectory),template=ARC_TEMPLATES[key]||ARC_TEMPLATES.generic;
 return template.stages.map((stage,i)=>({stage:i+1,name:stage.name,profile:shift(base,stage.changes,d)}));
}

function titleRomanceSignal(track){const text=`${track.title||''} ${track.artist||''}`.toLowerCase();return /(love|lover|lovers|kiss|heart|romance|desire|crush|beautiful|baby|darling|sexy|do me|#1 crush)/i.test(text);}
function scoreTrack(track,target,scoring,context={}){
 const d=scoring.dimensions||DEFAULT_DIMENSIONS,song=normalizeProfile(addProfile({...categoryProfile(track,scoring)},titleSignalProfile(track,scoring)),d);
 let score=profileSimilarity(song,target,d)*10;
 if(context.preferredCategories?.includes(track.category))score+=7;
 if(context.avoidCategories?.includes(track.category))score-=8;
 if(Array.isArray(track.tags)&&Array.isArray(context.tags))score+=Math.min(12,track.tags.filter(t=>context.tags.includes(t)).length*2);
 if(context.nonRomantic&&titleRomanceSignal(track))score-=14;
 if(context.romantic&&!titleRomanceSignal(track)&&((song.romance||0)+(song.tenderness||0))<10)score-=3;
 return score;
}
function diversityPenalty(track,selected,index){let p=index*.5;for(const prev of selected){if(prev.artist===track.artist)p+=35;if(prev.category===track.category)p+=3;if(prev.title===track.title)p+=100;}return p;}
function rankTracks(tracks,target,scoring,options={}){
 const limit=options.limit||5,ranked=tracks.map(t=>({...t,score:scoreTrack(t,target,scoring,options)})).sort((a,b)=>b.score-a.score),selected=[],pool=[...ranked];
 while(selected.length<limit&&pool.length){let bi=0,bs=-Infinity;for(let i=0;i<pool.length;i++){const s=pool[i].score-diversityPenalty(pool[i],selected,selected.length);if(s>bs){bs=s;bi=i;}}const chosen=pool.splice(bi,1)[0];const penalty=diversityPenalty(chosen,selected,selected.length);selected.push({...chosen,finalScore:chosen.score-penalty});}
 return selected;
}
function rankArc(tracks,arc,scoring,options={}){
 const used=[],result=[];for(const stage of arc){const opts={...options,limit:Math.max(8,options.stagePool||10),nonRomantic:options.nonRomantic};const ranked=rankTracks(tracks,stage.profile,scoring,opts).filter(t=>!used.some(u=>u.title===t.title&&u.artist===t.artist));const chosen=ranked[0];if(chosen){used.push(chosen);result.push({...chosen,stage:stage.stage,stageName:stage.name,stageProfile:stage.profile});}}
 if(result.length<(options.limit||5)){const fallback=rankTracks(tracks,arc[Math.min(result.length,arc.length-1)].profile,scoring,{...options,limit:options.limit||5,nonRomantic:options.nonRomantic}).filter(t=>!used.some(u=>u.title===t.title&&u.artist===t.artist));result.push(...fallback.slice(0,(options.limit||5)-result.length).map(t=>({...t,stage:result.length+1,stageName:'Финальный подбор',stageProfile:arc[Math.min(result.length,arc.length-1)].profile})));}
 return result.slice(0,options.limit||5);
}
function generatePersonalSoundtrack(character,tracks,scoring,options={}){const target=buildStoryProfile(character,scoring);return{targetProfile:target,tracks:rankTracks(tracks,target,scoring,options)};}
function generateSharedSoundtrack(a,b,tracks,scoring,options={}){
 const focus=options.focus||'connection',type=options.relationshipType,trajectory=options.trajectory,target=buildPairTarget(a,b,type,trajectory,scoring,focus),arc=buildPairArc(a,b,type,trajectory,scoring,focus);
 const nonRomantic=NON_ROMANTIC_REL.has(type)&&trajectory!=='enemies_to_lovers';
 const tracksOut=rankArc(tracks,arc,scoring,{...options,nonRomantic,limit:options.limit||5});
 return{focus,relationshipType:type,trajectory,targetProfile:target,arc:arc.map(x=>({stage:x.stage,name:x.name,profile:x.profile})),tracks:tracksOut};
}
window.SoundtrackEngine={buildCharacterProfile,buildStoryProfile,buildRelationshipProfile,buildPairTarget,buildPairArc,generatePersonalSoundtrack,generateSharedSoundtrack,rankTracks,scoreTrack,normalizeProfile};
