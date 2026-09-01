/* Personal Soundtrack Generator — pair semantic layer v5
 * Keeps the existing engine intact and adds a stricter meaning layer for pair stories.
 * Main fixes: word-boundary matching, romance guard, stage semantics, artist diversity,
 * and anti-false-positive handling such as "friend" inside "girlfriend".
 */
(function(){
  'use strict';
  if(!window.SoundtrackEngine) throw new Error('SoundtrackEngine must be loaded before pair-semantic-v5.js');

  var E=window.SoundtrackEngine;
  var NON_ROMANTIC=new Set(['sibling','siblings','family','friends','best_friends','forced_alliance','allies','rivals','enemies','former_allies','mutual_dislike','duty','oath','contract','debtor_creditor','protector_protected','shared_secret','shared_curse','hunter_prey']);

  var REL={
    friends:{positive:['friend','friends','friendship','together','best','forever','side','buddy','companionship','belonging','друз','вместе','товарищ','верност'],negative:['girlfriend','boyfriend','wife','husband','lover','lovers','love','kiss','romance','romantic','desire','sexy','sexual','любов','целу','романс','желан']},
    sibling:{positive:['brother','sister','brothers','sisters','family','home','blood','childhood','together','kin','relative','родн','брат','сестр','семь','дом','кров','детств'],negative:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','romantic','desire','sexy','sexual','любов','целу','романс','желан']},
    forced_alliance:{positive:['forced alliance','survival','allies','ally','team','together','united','stand','war','fight','союз','вместе','команд','выжив','войн','борьб'],negative:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','romantic','desire','sexy','sexual','любов','целу','романс','желан']},
    enemies:{positive:['enemy','enemies','war','fight','battle','hate','revenge','kill','blood','враг','войн','бой','битв','ненав','месть','убий'],negative:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','romantic','desire','sexy','sexual','любов','целу','романс','желан']},
    lovers:{positive:['love','lover','lovers','girlfriend','boyfriend','kiss','heart','desire','romance','romantic','beautiful','baby','darling','любов','целу','сердц','желан'],negative:[]},
    generic:{positive:['together','story','time','road','night','memory','вместе','истор','ноч','памят'],negative:[]}
  };

  var STAGES={
    'Свои люди':{p:['friendship','friend','friends','loyalty','companionship','belonging','together','друз','товарищ','вместе','верност'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','romantic','desire','sexy','sexual','любов','целу','романс','желан']},
    'Общее безумие':{p:['adventure','chaos','freedom','fun','youth','road','приключ','хаос','свобод','дорог'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','любов','целу']},
    'Проверка':{p:['loyalty','trust','test','trial','risk','friendship','верност','довер','испыт','риск'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','любов','целу']},
    'Выбор друг друга':{p:['loyalty','commitment','trust','support','friendship','together','выбор','верност','довер','поддерж','вместе'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual','любов','целу']},
    'Вместе':{p:['friendship','loyalty','companionship','belonging','together','forever','friends','друз','верност','вместе','навсег'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual','любов','целу']},
    'Столкновение':{p:['enemy','enemies','fight','battle','war','conflict','враг','бой','битв','войн','конфликт'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','любов','целу']},
    'Противостояние':{p:['enemy','enemies','fight','battle','war','conflict','power','враг','бой','битв','войн','конфликт','сил'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','любов','целу']},
    'Точка невозврата':{p:['death','end','never','lost','fire','war','смерт','конец','никогд','огн','потер'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','любов','целу']},
    'Вынуждены быть рядом':{p:['forced alliance','survival','allies','team','together','выжив','союз','команд','вместе'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual','любов','целу']},
    'Недоверие':{p:['doubt','secret','lie','suspicion','mystery','недовер','тайн','лож','сомн','подозр'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','любов','целу']},
    'Общая угроза':{p:['danger','threat','survival','enemy','war','allies','угроз','опасн','выжив','враг','войн'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','любов','целу']},
    'Доверие':{p:['trust','faith','loyalty','support','believe','довер','вер','верност','поддерж'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual','любов','целу']},
    'Настоящий союз':{p:['alliance','allies','ally','team','unity','united','loyalty','союз','команд','един','верност'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual','любов','целу']},
    'Общее прошлое':{p:['family','shared past','childhood','home','memory','nostalgia','blood','родн','семь','детств','прошл','дом','памят','кров'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual','войн','enemy','конфликт','любов','целу']},
    'Разлом':{p:['goodbye','lost','alone','break','away','distance','farewell','прощ','один','потер','разрыв'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire']},
    'Точка боли':{p:['pain','hurt','broken','death','dead','cry','blood','боль','слом','смерт','кров'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire']},
    'Возвращение':{p:['return','reunion','forgive','home','again','together','возвращ','воссоедин','прощ','дом','снов','вместе'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual']},
    'Домой':{p:['home','homecoming','reunion','family','blood','together','forever','дом','семь','возвращ','воссоедин','кров','вместе','навсег'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual']},
    'После войны':{p:['peace','home','freedom','recovery','after','survive','мир','дом','свобод','восстанов','после','выжив'],n:['girlfriend','boyfriend','wife','husband','lover','love','kiss','romance','desire','sexy','sexual']}
  };

  function text(track){return String([track.title,track.artist].concat(track.tags||[],track.semanticTags||[],track.themes||[],track.relationshipTags||[],track.storyRoles||[]).filter(Boolean).join(' ')).toLowerCase();}
  function hit(track,term){
    var s=String(term).toLowerCase();
    var fields=[track.title||'',track.artist||''].concat(track.tags||[],track.semanticTags||[],track.themes||[],track.relationshipTags||[],track.storyRoles||[]).map(function(x){return String(x).toLowerCase();});
    if(fields.some(function(x){return x===s;})) return true;
    if(/[a-z]/i.test(s)) return fields.some(function(x){return new RegExp('(^|[^a-z])'+s.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'([^a-z]|$)','i').test(x);});
    return text(track).indexOf(s)!==-1;
  }
  function hits(track,arr){return (arr||[]).reduce(function(n,w){return n+(hit(track,w)?1:0);},0);}
  function relationKey(type){if(['sibling','siblings','family'].indexOf(type)>=0)return'sibling';if(['friends','best_friends'].indexOf(type)>=0)return'friends';if(['enemies','rivals','mutual_dislike'].indexOf(type)>=0)return'enemies';if(['forced_alliance','allies','former_allies'].indexOf(type)>=0)return'forced_alliance';if(!NON_ROMANTIC.has(type))return'lovers';return'generic';}
  function romance(track){
    var t=text(track);
    return /(girlfriend|boyfriend|wife|husband|lover|lovers|love|kiss|romance|romantic|desire|crush|sexy|sexual|do me|любов|целу|романс|желан)/i.test(t);
  }
  function semanticScore(track,stage,type){
    var r=REL[relationKey(type)]||REL.generic, s=STAGES[stage]||{};
    var score=hits(track,r.positive)*8-hits(track,r.negative)*32;
    score+=hits(track,s.p||[])*11-hits(track,s.n||[])*30;
    if(NON_ROMANTIC.has(type)&&romance(track)) score-=80;
    return score;
  }
  function fingerprint(track){
    var t=text(track);var g={family:['family','brother','sister','blood','home','семь','брат','сестр','кров','дом'],friendship:['friend','friendship','together','loyalty','друз','вместе','верност'],romance:['love','lover','girlfriend','boyfriend','kiss','romance','любов','целу'],conflict:['war','fight','battle','enemy','hate','враг','войн','бой'],loss:['death','dead','goodbye','lost','alone','смерт','прощ','потер'],hope:['hope','free','home','again','rise','надеж','свобод','дом','снов'],danger:['danger','threat','survive','опасн','угроз','выжив']};return Object.keys(g).filter(function(k){return g[k].some(function(w){return hit(track,w);});});
  }
  function diversityPenalty(candidate,selected){
    var p=0,fp=fingerprint(candidate);
    selected.forEach(function(prev){
      if(prev.artist===candidate.artist)p+=100;
      if(prev.category&&candidate.category&&prev.category===candidate.category)p+=4;
      var f=fingerprint(prev),over=f.filter(function(x){return fp.indexOf(x)>=0;}).length;
      if(over>=2)p+=18; else if(over===1)p+=5;
      if(prev.title===candidate.title)p+=150;
    });
    return p;
  }
  function rankStage(tracks,target,scoring,opts){
    return tracks.map(function(t){return Object.assign({},t,{_score:E.scoreTrack(t,target,scoring,{relationshipType:opts.relationshipType,stageName:opts.stageName})+semanticScore(t,opts.stageName,opts.relationshipType)});})
      .sort(function(a,b){return b._score-a._score;});
  }
  function generate(a,b,tracks,scoring,options){
    options=options||{};
    var type=options.relationshipType,trajectory=options.trajectory,focus=options.focus||'connection';
    var target=E.buildPairTarget(a,b,type,trajectory,scoring,focus),arc=E.buildPairArc(a,b,type,trajectory,scoring,focus);
    var used=[],out=[];
    arc.forEach(function(stage){
      var ranked=rankStage(tracks,stage.profile,scoring,{relationshipType:type,stageName:stage.name});
      var available=ranked.filter(function(t){return !used.some(function(u){return u.title===t.title&&u.artist===t.artist;})&&!used.some(function(u){return u.artist===t.artist;});});
      var best=null,bestScore=-Infinity;
      available.slice(0,80).forEach(function(t){var s=t._score-diversityPenalty(t,used);if(s>bestScore){best=t;bestScore=s;}});
      if(!best) best=ranked.find(function(t){return !used.some(function(u){return u.title===t.title&&u.artist===t.artist;});});
      if(best){used.push(best);out.push(Object.assign({},best,{stage:stage.stage,stageName:stage.name,stageProfile:stage.profile,finalScore:bestScore}));}
    });
    return {engineVersion:'v5',focus:focus,relationshipType:type,trajectory:trajectory,targetProfile:target,arc:arc.map(function(x){return{stage:x.stage,name:x.name,profile:x.profile};}),tracks:out.slice(0,options.limit||5)};
  }
  E.generateSharedSoundtrackV5=generate;
})();
