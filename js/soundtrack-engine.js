/* Personal Soundtrack Generator — scoring engine
 * Browser-first build. Deterministic local scoring; no AI/API required.
 */
const DEFAULT_DIMENSIONS=['drama','romance','danger','mystery','hope','loneliness','nostalgia','chaos','power','freedom','melancholy','tenderness','rebellion','darkness','epic','energy'];
const clamp=(v,min=0,max=10)=>Math.max(min,Math.min(max,Number(v)||0));
const emptyProfile=(d=DEFAULT_DIMENSIONS)=>Object.fromEntries(d.map(k=>[k,0]));
function addProfile(t,s,m=1){if(!s)return t;for(const[k,v]of Object.entries(s))if(typeof v==='number')t[k]=(t[k]||0)+v*m;return t;}
function normalizeProfile(p,d=DEFAULT_DIMENSIONS){return Object.fromEntries(d.map(k=>[k,clamp(p[k])]));}
function profileDistance(a,b,d=DEFAULT_DIMENSIONS){return d.reduce((s,k)=>s+Math.abs((a[k]||0)-(b[k]||0)),0)/d.length;}
function profileSimilarity(a,b,d=DEFAULT_DIMENSIONS){return 10-profileDistance(a,b,d);}
function titleSignalProfile(track,scoring){const p=emptyProfile(scoring.dimensions||DEFAULT_DIMENSIONS),text=`${track.title||''} ${track.artist||''}`.toLowerCase();for(const[signal,mods]of Object.entries(scoring.title_signals||{}))if(text.includes(signal.toLowerCase()))addProfile(p,mods,.45);return p;}
function categoryProfile(track,scoring){const c=track.category||track.layer||'';return scoring.base_profiles?.[c]?.dimensions||emptyProfile(scoring.dimensions||DEFAULT_DIMENSIONS);}
function buildCharacterProfile(character,scoring){const d=scoring.dimensions||DEFAULT_DIMENSIONS,p=emptyProfile(d),r=scoring.race_modifiers||{};if(character.race)addProfile(p,r[character.race],.65);if(character.secondaryRace)addProfile(p,r[character.secondaryRace],.35);addProfile(p,character.storyModifiers,1);addProfile(p,character.storyProfile,1);return normalizeProfile(p,d);}

const REL_ALIASES={
 friends:['друзья','лучшие друзья'],
 best_friends:['лучшие друзья'],
 sibling:['семья','родственники'],
 siblings:['семья','родственники'],
 family:['семья'],
 forced_alliance:['союзники','напарники'],
 allies:['союзники'],
 rivals:['соперники'],
 enemies:['враги'],
 former_allies:['бывшие союзники'],
 lovers:['любовники'],
 unrequited_love:['неразделённые чувства'],
 mutual_attraction:['взаимное притяжение'],
 complicated_attachment:['сложная привязанность'],
 mutual_dislike:['взаимная неприязнь'],
 duty:['долг'],
 oath:['клятва'],
 contract:['контракт'],
 debtor_creditor:['должник и кредитор'],
 protector_protected:['защитник и подопечный'],
 shared_secret:['связанные общей тайной'],
 shared_curse:['связанные проклятием'],
 hunter_prey:['охотник и добыча']
};
const TRAJECTORY_ALIASES={
 no_change:['no_change'],
 enemies_to_allies:['enemies_to_allies'],
 alienation_to_reunion:['alienation_to_reunion'],
 forced_allies_to_true_bond:['forced_allies_to_true_bond'],
 friends_to_enemies:['friends_to_enemies'],
 enemies_to_lovers:['enemies_to_lovers'],
 strangers_to_allies:['strangers_to_allies'],
 rivalry_to_respect:['rivalry_to_respect'],
 loss_to_recovery:['loss_to_recovery'],
 descent:['descent'],
 redemption:['redemption']
};
function resolveModifier(modifiers,id,aliases={}){
 if(!id)return null;
 if(modifiers?.[id])return modifiers[id];
 const candidates=aliases[id]||[];
 for(const key of candidates)if(modifiers?.[key])return modifiers[key];
 return null;
}
function buildRelationshipProfile(a,b,type,trajectory,scoring){
 const d=scoring.dimensions||DEFAULT_DIMENSIONS,p=emptyProfile(d);
 const rel=resolveModifier(scoring.relationship_modifiers,type,REL_ALIASES);
 addProfile(p,rel,1);
 const tr=resolveModifier(scoring.trajectory_modifiers,trajectory,TRAJECTORY_ALIASES);
 if(Array.isArray(tr))tr.forEach(tag=>{if(d.includes(tag))p[tag]=(p[tag]||0)+.9;});else addProfile(p,tr,.9);
 const pa=buildCharacterProfile(a,scoring),pb=buildCharacterProfile(b,scoring);
 for(const k of d){p[k]+=Math.min(pa[k],pb[k])*.18;if(['drama','danger','chaos','power','darkness','rebellion'].includes(k))p[k]+=Math.abs(pa[k]-pb[k])*.08;}
 return normalizeProfile(p,d);
}
function buildStoryProfile(character,scoring){const p=buildCharacterProfile(character,scoring);return normalizeProfile(p,scoring.dimensions||DEFAULT_DIMENSIONS);}
function scoreTrack(track,target,scoring,context={}){const d=scoring.dimensions||DEFAULT_DIMENSIONS,song=normalizeProfile(addProfile({...categoryProfile(track,scoring)},titleSignalProfile(track,scoring)),d);let score=profileSimilarity(song,target,d)*10;if(context.preferredCategories?.includes(track.category))score+=7;if(context.avoidCategories?.includes(track.category))score-=5;if(Array.isArray(track.tags)&&Array.isArray(context.tags))score+=Math.min(12,track.tags.filter(t=>context.tags.includes(t)).length*2);return score;}
function diversityPenalty(track,selected,index){let p=index*.5;for(const prev of selected){if(prev.artist===track.artist)p+=35;if(prev.category===track.category)p+=3;if(prev.title===track.title)p+=100;}return p;}
function rankTracks(tracks,target,scoring,options={}){const limit=options.limit||5,ranked=tracks.map(t=>({...t,score:scoreTrack(t,target,scoring,options)})).sort((a,b)=>b.score-a.score),selected=[],pool=[...ranked];while(selected.length<limit&&pool.length){let bi=0,bs=-Infinity;for(let i=0;i<pool.length;i++){const s=pool[i].score-diversityPenalty(pool[i],selected,selected.length);if(s>bs){bs=s;bi=i;}}const chosen=pool.splice(bi,1)[0];selected.push({...chosen,finalScore:chosen.score-diversityPenalty(chosen,selected,selected.length)});}return selected;}
function getFocusWeights(scoring,focus='connection'){const aliases={connection:['connection','bond'],bond:['bond','connection'],events:['events','trajectory'],conflict:['conflict'],individual:['individual']};const candidates=[focus,...(aliases[focus]||[])];for(const id of candidates){const found=scoring.focus_modes?.find(m=>m.id===id);if(found)return found.weights;}return{relationship_profile:.4,emotional_intersection:.25,character_contrast:.15,trajectory:.1,individual_context:.1};}
function buildPairTarget(a,b,type,trajectory,scoring,focus='connection'){const d=scoring.dimensions||DEFAULT_DIMENSIONS,pa=buildCharacterProfile(a,scoring),pb=buildCharacterProfile(b,scoring),rel=buildRelationshipProfile(a,b,type,trajectory,scoring),w=getFocusWeights(scoring,focus),target=emptyProfile(d);for(const k of d){const intersection=Math.min(pa[k],pb[k]),contrast=Math.abs(pa[k]-pb[k]),individual=(pa[k]+pb[k])/2;target[k]=rel[k]*w.relationship_profile+intersection*w.emotional_intersection+contrast*w.character_contrast+rel[k]*w.trajectory+individual*w.individual_context;}return normalizeProfile(target,d);}
function generatePersonalSoundtrack(character,tracks,scoring,options={}){const target=buildStoryProfile(character,scoring);return{targetProfile:target,tracks:rankTracks(tracks,target,scoring,options)};}
function generateSharedSoundtrack(a,b,tracks,scoring,options={}){const focus=options.focus||'connection',target=buildPairTarget(a,b,options.relationshipType,options.trajectory,scoring,focus);return{focus,relationshipType:options.relationshipType,trajectory:options.trajectory,targetProfile:target,tracks:rankTracks(tracks,target,scoring,options)};}
window.SoundtrackEngine={buildCharacterProfile,buildStoryProfile,buildRelationshipProfile,buildPairTarget,generatePersonalSoundtrack,generateSharedSoundtrack,rankTracks,scoreTrack,normalizeProfile};
