const ATTACK_CARDS = [
  {id:1,name:'斬撃',text:'相手に3ダメージ。',damage:3},
  {id:2,name:'強打',text:'相手に5ダメージ。',damage:5},
  {id:3,name:'重撃',text:'相手に7ダメージ。',damage:7},
  {id:4,name:'連撃',text:'2ダメージを2回与える。',multi:[2,2]},
  {id:5,name:'火炎弾',text:'相手に4ダメージ。',damage:4},
  {id:6,name:'大火球',text:'相手に6ダメージ。',damage:6},
  {id:7,name:'毒牙',text:'3ダメージ。次の相手開始時に1ダメージ。',damage:3,effect:'poison'},
  {id:8,name:'流血',text:'相手に4ダメージ。',damage:4},
  {id:9,name:'急所突き',text:'相手LP10以下なら5、それ以外は3。',damage:3,conditional:{type:'enemyLifeLE',value:10,damage:5}},
  {id:10,name:'背水の一撃',text:'自分LP10以下なら6ダメージ。',conditional:{type:'selfLifeLE',value:10,damage:6}},
  {id:11,name:'止めの一撃',text:'相手LP5以下なら7ダメージ。',conditional:{type:'enemyLifeLE',value:5,damage:7}},
  {id:12,name:'猛追',text:'相手LPが自分より多ければ5ダメージ。',conditional:{type:'enemyHigher',damage:5}},
  {id:13,name:'逆境の刃',text:'自分LPが相手より少なければ6ダメージ。',conditional:{type:'selfLower',damage:6}},
  {id:14,name:'奇襲',text:'3ダメージ。相手が今ターン回復していれば+2。',damage:3,effect:'healPunish'},
  {id:15,name:'破砕撃',text:'4ダメージ。相手の防御カードを1枚破壊。',damage:4,effect:'breakDefense'},
  {id:16,name:'貫通弾',text:'4ダメージ。軽減不可。',damage:4,unpreventable:true},
  {id:17,name:'吸血刃',text:'3ダメージ。自分は2回復。',damage:3,heal:2},
  {id:18,name:'生命喰らい',text:'4ダメージ。自分LP10以下なら2回復。',damage:4,conditionalHeal:{type:'selfLifeLE',value:10,heal:2}},
  {id:19,name:'血の代償',text:'自分2失い、相手に7ダメージ。',selfDamage:2,damage:7},
  {id:20,name:'諸刃',text:'相手に6ダメージ。自分も3失う。',damage:6,selfDamage:3},
  {id:21,name:'追撃',text:'このターン既にダメージを与えていれば5ダメージ。',conditional:{type:'alreadyDamaged',damage:5}},
  {id:22,name:'連鎖爆破',text:'このターン2枚目なら6ダメージ。',conditional:{type:'secondCard',damage:6}},
  {id:23,name:'先制攻撃',text:'4ダメージ。次の相手ターンの攻撃は1枚まで。',damage:4,effect:'attackLimit'},
  {id:24,name:'威圧',text:'3ダメージ。次の相手ターンは回復不可。',damage:3,effect:'healLock'},
  {id:25,name:'呪いの傷',text:'2ダメージ。次の相手の回復を2減らす。',damage:2,effect:'healCurse'},
  {id:26,name:'破滅の予告',text:'2ダメージ。次の自分開始時に4ダメージ。',damage:2,effect:'doom'},
  {id:27,name:'追跡者',text:'4ダメージ。相手LPが自分より少なければ+3。',damage:4,conditional:{type:'enemyLower',damage:7}},
  {id:28,name:'二重斬り',text:'3ダメージ。相手LP15以上なら+2。',damage:3,conditional:{type:'enemyLifeGE',value:15,damage:5}},
  {id:29,name:'最後の一矢',text:'自分LP5以下なら7ダメージ。',conditional:{type:'selfLifeLE',value:5,damage:7}},
  {id:30,name:'天罰',text:'相手LP20なら7、それ以外は5。',damage:5,conditional:{type:'enemyLifeEQ',value:20,damage:7}}
];

const SUPPORT_CARDS = [
  {id:'h1',name:'小回復',text:'自分を3回復。',kind:'heal',heal:3},
  {id:'h2',name:'治癒',text:'自分を4回復。',kind:'heal',heal:4},
  {id:'h3',name:'大回復',text:'自分を5回復。',kind:'heal',heal:5},
  {id:'d1',name:'防壁',text:'次に受けるダメージを3軽減。',kind:'defense',shield:3},
  {id:'d2',name:'鉄壁',text:'次に受けるダメージを5軽減。',kind:'defense',shield:5}
];

const ALL_CARDS = [...ATTACK_CARDS, ...SUPPORT_CARDS];
const MAX_LIFE = 20;
const HAND_SIZE = 5;
const MAX_ACTIONS = 2;

const $ = id => document.getElementById(id);
const cloneCard = card => ({...card});

let state;

function shuffle(cards){
  const a=[...cards];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

function freshDeck(){
  // 30攻撃カードを1枚ずつ＋5枚の補助カード。能力は今後の調整前提。
  return shuffle(ALL_CARDS.map(cloneCard));
}

function makeSide(){
  return {life:MAX_LIFE,deck:freshDeck(),hand:[],field:[null,null,null],actions:0,damageThisTurn:0,healedThisTurn:false,poisonAtStart:0,doomAtStart:0,attackLimit:MAX_ACTIONS,healLocked:false,healCurse:0,shield:0};
}

function init(){
  state={player:makeSide(),enemy:makeSide(),turn:'player',gameOver:false,log:[]};
  for(let i=0;i<HAND_SIZE;i++){draw('player');draw('enemy');}
  state.player.actions=0;
  state.enemy.actions=0;
  addLog('ゲーム開始。あなたのターンです。');
  render();
}

function draw(sideName){
  const side=state[sideName];
  if(side.deck.length && side.hand.length<10) side.hand.push(side.deck.pop());
}

function addLog(message){
  state.log.unshift(message);
  state.log=state.log.slice(0,18);
  if($('log')) $('log').innerHTML=state.log.map(x=>`<div>・${x}</div>`).join('');
}

function displayLife(sideName){return Math.max(0,state[sideName].life);}

function heal(sideName, amount){
  const side=state[sideName];
  if(side.healLocked){addLog(`${sideName==='player'?'あなた':'相手'}は回復できない。`);return 0;}
  const reduced=Math.max(0,amount-side.healCurse);
  side.healCurse=0;
  const before=side.life;
  side.life=Math.min(MAX_LIFE,side.life+reduced);
  const actual=side.life-before;
  if(actual>0) side.healedThisTurn=true;
  if(actual>0)addLog(`${sideName==='player'?'あなた':'相手'}が${actual}回復。`);
  return actual;
}

function damage(targetName, amount, unpreventable=false){
  const target=state[targetName];
  let actual=amount;
  if(!unpreventable && target.shield>0){
    const blocked=Math.min(target.shield,amount);
    target.shield-=blocked;
    actual-=blocked;
    addLog(`${targetName==='player'?'あなた':'相手'}の防壁が${blocked}ダメージを軽減。`);
  }
  actual=Math.max(0,actual);
  target.life=Math.max(0,target.life-actual);
  if(actual>0){
    const attacker=targetName==='player'?'enemy':'player';
    state[attacker].damageThisTurn+=actual;
    addLog(`${targetName==='player'?'あなた':'相手'}に${actual}ダメージ。`);
  }
  if(target.life<=0) finish(targetName==='player'?'enemy':'player');
  return actual;
}

function conditionDamage(card, user, target){
  const c=card.conditional;
  if(!c)return card.damage||0;
  switch(c.type){
    case 'enemyLifeLE': return state[target].life<=c.value?c.damage:card.damage;
    case 'enemyLifeGE': return state[target].life>=c.value?c.damage:card.damage;
    case 'enemyLifeEQ': return state[target].life===c.value?c.damage:card.damage;
    case 'selfLifeLE': return state[user].life<=c.value?c.damage:0;
    case 'enemyHigher': return state[target].life>state[user].life?c.damage:0;
    case 'enemyLower': return state[target].life<state[user].life?c.damage:card.damage;
    case 'selfLower': return state[user].life<state[target].life?c.damage:0;
    case 'alreadyDamaged': return state[user].damageThisTurn>0?c.damage:0;
    case 'secondCard': return state[user].actions===1?c.damage:0;
    default:return card.damage||0;
  }
}

function playCard(sideName,index){
  if(state.gameOver||state.turn!==sideName)return;
  const side=state[sideName], targetName=sideName==='player'?'enemy':'player';
  if(side.actions>=Math.min(MAX_ACTIONS,side.attackLimit)){addLog('このターンはこれ以上カードを使えません。');return;}
  const card=side.hand[index]; if(!card)return;
  if(card.kind==='heal'&&side.healLocked){addLog('このターンは回復できません。');return;}

  const slot=side.field.findIndex(x=>x===null);
  if(slot<0){addLog('場の枠が空いていません。');return;}
  side.hand.splice(index,1);
  side.field[slot]=card;
  side.actions++;

  if(card.kind==='heal'){
    heal(sideName,card.heal);
  }else if(card.kind==='defense'){
    side.shield+=card.shield;
    addLog(`${sideName==='player'?'あなた':'相手'}が${card.name}を使用。次のダメージを${card.shield}軽減。`);
  }else{
    resolveAttack(card,sideName,targetName);
  }
  render();
  if(!state.gameOver && sideName==='player' && side.actions>=MAX_ACTIONS){
    addLog('2枚使用しました。ターンを終了できます。');
  }
}

function resolveAttack(card,user,target){
  addLog(`${user==='player'?'あなた':'相手'}が「${card.name}」。`);
  if(card.multi){card.multi.forEach(d=>damage(target,d,card.unpreventable));}
  else{
    const amount=conditionDamage(card,user,target);
    if(amount>0)damage(target,amount,card.unpreventable);
    else addLog('条件を満たさず、ダメージなし。');
  }
  if(card.selfDamage)damage(user,card.selfDamage,true);
  if(card.heal)heal(user,card.heal);
  if(card.conditionalHeal && state[user].life<=card.conditionalHeal.value)heal(user,card.conditionalHeal.heal);
  if(card.effect==='poison')state[target].poisonAtStart+=1;
  if(card.effect==='healPunish' && state[target].healedThisTurn)damage(target,2,true);
  if(card.effect==='breakDefense'){
    if(state[target].shield>0){state[target].shield=0;addLog(`${target==='player'?'あなた':'相手'}の防壁を破壊。`);}
  }
  if(card.effect==='attackLimit')state[target].attackLimit=1;
  if(card.effect==='healLock')state[target].healLocked=true;
  if(card.effect==='healCurse')state[target].healCurse+=2;
  if(card.effect==='doom')state[user].doomAtStart+=4;
}

function startTurn(sideName){
  const side=state[sideName];
  side.actions=0;side.damageThisTurn=0;side.healedThisTurn=false;side.attackLimit=MAX_ACTIONS;side.healLocked=false;
  draw(sideName);
  if(side.poisonAtStart){const n=side.poisonAtStart;side.poisonAtStart=0;addLog(`${sideName==='player'?'あなた':'相手'}に毒の追加ダメージ。`);damage(sideName,n,true);}
  if(side.doomAtStart){const n=side.doomAtStart;side.doomAtStart=0;addLog('破滅の予告が発動。');damage(sideName==='player'?'enemy':'player',n,true);}
  render();
}

function endTurn(){
  if(state.gameOver||state.turn!=='player')return;
  destroyTemporary('player');
  state.turn='enemy';
  startTurn('enemy');
  if(!state.gameOver)setTimeout(enemyTurn,450);
}

function destroyTemporary(sideName){
  state[sideName].field=[null,null,null];
}

function enemyTurn(){
  if(state.gameOver)return;
  const enemy=state.enemy;
  const playable=Math.min(MAX_ACTIONS,enemy.attackLimit);
  let guard=0;
  while(enemy.actions<playable && enemy.hand.length && guard<4){
    guard++;
    const idx=chooseEnemyCard();
    playCard('enemy',idx);
  }
  if(state.gameOver)return;
  destroyTemporary('enemy');
  state.turn='player';
  startTurn('player');
  addLog('あなたのターンです。');
  render();
}

function chooseEnemyCard(){
  const hand=state.enemy.hand;
  const attackIdx=hand.map((c,i)=>c.kind?null:i).filter(i=>i!==null);
  const lethal=attackIdx.find(i=>conditionDamage(hand[i],'enemy','player')>=state.player.life);
  if(lethal!==undefined)return lethal;
  const healIdx=hand.findIndex(c=>c.kind==='heal' && state.enemy.life<=10);
  if(healIdx>=0)return healIdx;
  const defenseIdx=hand.findIndex(c=>c.kind==='defense' && state.enemy.shield===0);
  if(defenseIdx>=0 && state.player.damageThisTurn>0)return defenseIdx;
  if(attackIdx.length)return attackIdx[Math.floor(Math.random()*attackIdx.length)];
  return 0;
}

function finish(winner){
  if(state.gameOver)return;
  state.gameOver=true;
  const title=winner==='player'?'YOU WIN':'YOU LOSE';
  $('resultTitle').textContent=title;
  $('resultText').textContent=winner==='player'?'相手のLPを0にしました。':'あなたのLPが0になりました。';
  $('resultModal').classList.remove('hidden');
  render();
}

function cardHTML(card){
  const dmg=card.damage?`<div class="card-dmg">${card.damage}</div>`:'';
  return `<div class="card-name">${card.name}</div>${dmg}<div class="card-text">${card.text}</div>`;
}

function renderField(sideName){
  const slots=document.querySelectorAll(`.slot[data-owner="${sideName}"]`);
  state[sideName].field.forEach((card,i)=>{
    const slot=slots[i];
    slot.classList.toggle('has-card',!!card);
    slot.innerHTML=card?`<div class="card-face card">${cardHTML(card)}</div>`:`<span>枠${i+1}</span>`;
  });
}

function render(){
  if(!state)return;
  $('playerLife').textContent=displayLife('player');
  $('enemyLife').textContent=displayLife('enemy');
  $('actionsUsed').textContent=state.player.actions;
  $('turnLabel').textContent=state.turn==='player'?'あなたのターン':'相手のターン';
  $('handCount').textContent=state.player.hand.length;
  $('playerDeckCount').textContent=state.player.deck.length;
  $('enemyDeckCount').textContent=state.enemy.deck.length;
  $('enemyActions').textContent=state.turn==='enemy'?`使用 ${state.enemy.actions}/${Math.min(2,state.enemy.attackLimit)}`:'行動待機';
  $('endTurn').disabled=state.turn!=='player'||state.gameOver;
  const hand=$('hand');
  hand.innerHTML='';
  state.player.hand.forEach((card,i)=>{
    const el=document.createElement('button');el.className='card';
    const blocked=state.turn!=='player'||state.player.actions>=2||(card.kind==='heal'&&state.player.healLocked);
    if(blocked)el.classList.add('disabled');
    el.innerHTML=cardHTML(card);
    el.addEventListener('click',()=>playCard('player',i));
    hand.appendChild(el);
  });
  renderField('player');renderField('enemy');
}

$('endTurn').addEventListener('click',endTurn);
$('restart').addEventListener('click',init);
$('resultRestart').addEventListener('click',()=>{ $('resultModal').classList.add('hidden'); init(); });
$('playerDeck').addEventListener('click',()=>addLog('山札からはターン開始時に1枚引きます。'));
init();
