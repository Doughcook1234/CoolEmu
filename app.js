const DB_NAME="GameBoxDB", STORE="games", DB_VERSION=1;
const CDN="https://cdn.emulatorjs.org/latest/data/";
let db, selectedFile=null, activeUrl=null;

const $=id=>document.getElementById(id);
const libraryView=$("libraryView"), addView=$("addView"), playerView=$("playerView");

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});
    req.onsuccess=()=>{db=req.result;resolve(db)};
    req.onerror=()=>reject(req.error);
  });
}
function allGames(){
  return new Promise((resolve,reject)=>{
    const r=db.transaction(STORE,"readonly").objectStore(STORE).getAll();
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
function addGame(game){
  return new Promise((resolve,reject)=>{
    const r=db.transaction(STORE,"readwrite").objectStore(STORE).add(game);
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
function getGame(id){
  return new Promise((resolve,reject)=>{
    const r=db.transaction(STORE,"readonly").objectStore(STORE).get(Number(id));
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
function removeGame(id){
  return new Promise((resolve,reject)=>{
    const r=db.transaction(STORE,"readwrite").objectStore(STORE).delete(Number(id));
    r.onsuccess=()=>resolve(); r.onerror=()=>reject(r.error);
  });
}
function humanSize(n){
  if(n<1024) return n+" B";
  if(n<1048576) return (n/1024).toFixed(1)+" KB";
  return (n/1048576).toFixed(1)+" MB";
}
function systemName(core){
  return {nes:"NES",snes:"SNES",gb:"Game Boy",gbc:"Game Boy Color",gba:"Game Boy Advance",
  genesis:"Genesis",segaGG:"Game Gear",n64:"Nintendo 64",psx:"PlayStation",arcade:"Arcade"}[core]||core;
}
function show(view){
  [libraryView,addView,playerView].forEach(v=>v.classList.add("hidden"));
  view.classList.remove("hidden");
  window.scrollTo(0,0);
}
async function renderLibrary(){
  const list=await allGames(), q=$("search").value.trim().toLowerCase(), f=$("filter").value;
  const games=list.filter(g=>(!q||g.name.toLowerCase().includes(q))&&(f==="all"||g.core===f));
  $("games").innerHTML="";
  $("empty").classList.toggle("hidden",games.length!==0);
  games.forEach(g=>{
    const card=document.createElement("article"); card.className="gameCard";
    card.innerHTML=`<div class="gameIcon">🎮</div>
      <div class="gameName" title="${esc(g.name)}">${esc(g.name)}</div>
      <div class="meta">${esc(systemName(g.core))} · ${humanSize(g.size)}</div>
      <div class="actions"><button class="play" data-play="${g.id}">Play</button><button class="delete" data-delete="${g.id}">Delete</button></div>`;
    $("games").appendChild(card);
  });
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function selectFile(file){
  selectedFile=file;
  $("fileText").textContent=file.name;
  if(!$("name").value) $("name").value=file.name.replace(/\.[^.]+$/,"");
  $("save").disabled=false;
}
$("file").addEventListener("change",e=>{if(e.target.files[0])selectFile(e.target.files[0])});
["dragenter","dragover"].forEach(t=>$("drop").addEventListener(t,e=>{e.preventDefault();$("drop").classList.add("drag")}));
["dragleave","drop"].forEach(t=>$("drop").addEventListener(t,e=>{e.preventDefault();$("drop").classList.remove("drag")}));
$("drop").addEventListener("drop",e=>{if(e.dataTransfer.files[0])selectFile(e.dataTransfer.files[0])});

$("addBtn").onclick=$("emptyAdd").onclick=()=>{
  selectedFile=null;$("file").value="";$("fileText").textContent="Choose a ROM/game file";$("name").value="";$("save").disabled=true;$("addStatus").textContent="";show(addView);
};
$("backFromAdd").onclick=()=>{show(libraryView);renderLibrary()};
$("backPlayer").onclick=()=>{stopPlayer();show(libraryView);renderLibrary()};
$("search").addEventListener("input",renderLibrary);$("filter").addEventListener("change",renderLibrary);

$("save").onclick=async()=>{
  if(!selectedFile)return;
  $("addStatus").textContent="Saving…";
  try{
    await addGame({name:$("name").value.trim()||selectedFile.name,core:$("core").value,file:selectedFile,size:selectedFile.size,created:Date.now()});
    selectedFile=null;$("save").disabled=true;$("addStatus").textContent="Saved!";
    show(libraryView);await renderLibrary();
  }catch(e){$("addStatus").textContent="Could not save this file. Your browser may be out of storage space."}
};

$("games").addEventListener("click",async e=>{
  const play=e.target.closest("[data-play]"), del=e.target.closest("[data-delete]");
  if(play) launch(await getGame(play.dataset.play));
  if(del&&confirm("Delete this game from your library?")){await removeGame(del.dataset.delete);renderLibrary()}
});

async function launch(game){
  show(playerView);$("playerTitle").textContent=game.name;$("playerStatus").textContent="Starting emulator…";
  $("game").innerHTML="";
  if(activeUrl)URL.revokeObjectURL(activeUrl);
  activeUrl=URL.createObjectURL(game.file);

  window.EJS_player="#game";
  window.EJS_core=game.core;
  window.EJS_gameUrl=activeUrl;
  window.EJS_gameName=game.name;
  window.EJS_pathtodata=CDN;
  window.EJS_startOnLoaded=true;
  window.EJS_color="#4f7cff";
  window.EJS_backgroundColor="#000000";

  const old=document.getElementById("emulatorLoader"); if(old)old.remove();
  const script=document.createElement("script");
  script.id="emulatorLoader";script.src=CDN+"loader.js";
  script.onload=()=>{$("playerStatus").textContent=""};
  script.onerror=()=>{$("playerStatus").textContent="EmulatorJS could not load. Check your internet connection."};
  document.body.appendChild(script);
}
function stopPlayer(){
  if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null}
  const loader=document.getElementById("emulatorLoader");if(loader)loader.remove();
  $("game").innerHTML="";
  ["EJS_player","EJS_core","EJS_gameUrl","EJS_gameName"].forEach(k=>{try{delete window[k]}catch{}});
}
(async()=>{try{await openDB();await renderLibrary()}catch(e){$("empty").innerHTML="<h2>Browser storage unavailable</h2><p>Try opening this site from HTTPS or localhost.</p>"}})();
