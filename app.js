'use strict';

const SUPABASE_URL = 'https://cqikjyakfnkrxlrfvxgp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_AM_KftThbhnQuczExuFkuQ_nF4c4pU-';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
async function signInToSupabase(email, password){
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if(error) throw error;
  return data;
}

function authRedirectUrl(){
  return new URL('./login.html', window.location.href).toString();
}

async function requestPasswordReset(email){
  const clean=String(email||'').trim();
  if(!clean)throw new Error('Введи email.');
  const {error}=await supabaseClient.auth.resetPasswordForEmail(clean,{
    redirectTo:authRedirectUrl()
  });
  if(error)throw error;
}

async function changeSupabasePassword(password){
  const value=String(password||'');
  if(value.length<6)throw new Error('Пароль має містити щонайменше 6 символів.');
  const {data,error}=await supabaseClient.auth.updateUser({password:value});
  if(error)throw error;
  return data;
}

function openPasswordModal(){
  document.getElementById('passwordModal')?.remove();
  const wrap=document.createElement('div');
  wrap.id='passwordModal';
  wrap.style.cssText='position:fixed;inset:0;z-index:1000;background:rgba(28,20,55,.38);display:flex;align-items:center;justify-content:center;padding:20px';
  wrap.innerHTML=`
    <div style="width:min(420px,100%);background:#fff;border-radius:22px;padding:20px;box-shadow:0 20px 60px rgba(35,25,70,.24)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
        <h3 style="margin:0">🔐 Змінити пароль</h3>
        <button type="button" data-password-close style="border:0;background:transparent;font-size:24px;padding:4px 8px">×</button>
      </div>
      <form id="changePasswordForm" class="form">
        <label>Новий пароль
          <input id="newPassword" type="password" required minlength="6" autocomplete="new-password">
        </label>
        <label>Повтори пароль
          <input id="repeatPassword" type="password" required minlength="6" autocomplete="new-password">
        </label>
        <div id="passwordModalStatus" class="muted" style="min-height:20px"></div>
        <button class="btn primary" type="submit" style="width:100%">Зберегти новий пароль</button>
      </form>
    </div>`;
  document.body.appendChild(wrap);

  const close=()=>wrap.remove();
  wrap.querySelector('[data-password-close]').onclick=close;
  wrap.addEventListener('pointerdown',e=>{if(e.target===wrap)close()});

  wrap.querySelector('#changePasswordForm').onsubmit=async e=>{
    e.preventDefault();
    const p1=wrap.querySelector('#newPassword').value;
    const p2=wrap.querySelector('#repeatPassword').value;
    const status=wrap.querySelector('#passwordModalStatus');
    if(p1!==p2){status.textContent='Паролі не збігаються.';return}
    try{
      status.textContent='Зберігаю…';
      await changeSupabasePassword(p1);
      status.textContent='✅ Пароль змінено.';
      setTimeout(close,700);
    }catch(error){
      console.error(error);
      status.textContent='❌ '+error.message;
    }
  };
}
async function updateAuthUI(){
  const { data } = await supabaseClient.auth.getSession();
  const session = data?.session || null;

  const avatar = document.getElementById('userAvatarButton');
  const menu = document.getElementById('userMenu');
  const menuEmail = document.getElementById('userMenuEmail');

  if(session){
    currentUserId=session.user.id;
    if(avatar){
      avatar.style.display = 'inline-flex';
      avatar.title = session.user.email || 'Користувач';
      avatar.setAttribute('aria-label', `Меню користувача ${session.user.email||''}`);
    }
    if(menuEmail) menuEmail.textContent = session.user.email || '';
  }else{
    currentUserId=null;
    if(avatar) avatar.style.display = 'none';
    if(menu) menu.hidden = true;
    if(menuEmail) menuEmail.textContent = '';
  }
}
async function logoutFromSupabase(){
  const { error } = await supabaseClient.auth.signOut();
  if(error) throw error;
  currentUserId=null;
  window.location.replace('./login.html');
}

function toggleUserMenu(force){
  const menu=document.getElementById('userMenu');
  if(!menu)return;
  menu.hidden = typeof force==='boolean' ? !force : !menu.hidden;
}

document.addEventListener('pointerdown',e=>{
  const menu=document.getElementById('userMenu');
  const avatar=document.getElementById('userAvatarButton');
  if(!menu || menu.hidden) return;
  if(menu.contains(e.target) || avatar?.contains(e.target)) return;
  menu.hidden=true;
});
const KEYS={topics:'kf3_topics',school:'kf3_school',phrases:'kf3_phrases',words:'kf3_words'};
let currentUserId=null;
function userLocalKey(key){
  return currentUserId ? `${key}_${currentUserId}` : `${key}_guest`;
}
const app=document.getElementById('app');
let topics=[],school=[],phrases=[],words=[];

const APP_THEME_KEY='kf_theme';
const AVATAR_KEY_PREFIX='kf_avatar_';
const CUSTOM_AVATAR_KEY_PREFIX='kf_custom_avatar_';
const DEFAULT_AVATARS=['avatar-1.png','avatar-2.png','avatar-3.png','avatar-4.png','avatar-5.png','avatar-6.png'];

function currentTheme(){return localStorage.getItem(APP_THEME_KEY)==='pink'?'pink':'purple'}
function applyAppTheme(){
  const theme=currentTheme();
  document.documentElement.dataset.appTheme=theme;
  document.body?.classList.toggle('theme-pink',theme==='pink');
  updatePwaIcon(theme);
}
function updatePwaIcon(theme=currentTheme()){
  const icon=theme==='pink'?'./icon-pink.png':'./icon-purple.png';
  let apple=document.querySelector('link[rel="apple-touch-icon"]');
  if(!apple){apple=document.createElement('link');apple.rel='apple-touch-icon';document.head.appendChild(apple)}
  apple.href=icon+'?v=5.0.4';
  let shortcut=document.querySelector('link[rel~="icon"]');
  if(!shortcut){shortcut=document.createElement('link');shortcut.rel='icon';document.head.appendChild(shortcut)}
  shortcut.href=icon+'?v=5.0.4';
}
function avatarStorageKey(){return AVATAR_KEY_PREFIX+(currentUserId||'guest')}
function customAvatarStorageKey(){return CUSTOM_AVATAR_KEY_PREFIX+(currentUserId||'guest')}
function selectedAvatar(){
  const custom=localStorage.getItem(customAvatarStorageKey());
  const selected=localStorage.getItem(avatarStorageKey())||'avatar-1.png';
  return selected==='custom'&&custom?custom:`./${DEFAULT_AVATARS.includes(selected)?selected:'avatar-1.png'}?v=5.0.4`;
}
function refreshAvatarButton(){
  const btn=document.getElementById('userAvatarButton');
  if(!btn)return;
  btn.innerHTML=`<img src="${selectedAvatar()}" alt="Аватарка">`;
}
async function profileUserInfo(){
  try{
    const {data:{session}}=await supabaseClient.auth.getSession();
    const user=session?.user||null;
    if(!user)return {name:'Користувач',email:''};
    const meta=user.user_metadata||{};
    const name=String(meta.full_name||meta.name||meta.display_name||'').trim()||'Користувач';
    return {name,email:user.email||''};
  }catch(_){
    return {name:'Користувач',email:''};
  }
}

let socialProfile=null, socialFriends=[], socialRequests=[];
function socialAvatar(profile){
  const value=String(profile?.avatar_value||'');
  if(value.startsWith('data:image/')||/^https?:\/\//i.test(value))return value;
  const name=DEFAULT_AVATARS.includes(value)?value:'avatar-1.png';
  return `./${name}?v=5.0.4`;
}
function rpcProfileRow(data){
  return Array.isArray(data)?(data[0]||null):(data||null);
}
async function setCloudAvatarValue(value){
  const {data,error}=await supabaseClient.rpc('set_my_avatar_v4',{p_avatar_value:value});
  if(error)throw error;
  const row=rpcProfileRow(data);
  if(row)socialProfile={...(socialProfile||{}),...row};
  return row;
}
async function uploadCustomAvatarBlob(blob){
  if(!currentUserId)throw new Error('No user');
  const path=`${currentUserId}/avatar`;
  const {error:uploadError}=await supabaseClient.storage.from('profile-avatars').upload(path,blob,{
    upsert:true,
    contentType:blob.type||'image/jpeg',
    cacheControl:'3600'
  });
  if(uploadError)throw uploadError;
  const {data:urlData}=supabaseClient.storage.from('profile-avatars').getPublicUrl(path);
  const base=urlData?.publicUrl;
  if(!base)throw new Error('Не вдалося отримати URL аватарки.');
  const publicUrl=`${base}?v=${Date.now()}`;
  await setCloudAvatarValue(publicUrl);
  return publicUrl;
}
async function syncAvatarToProfile({silent=false}={}){
  if(!currentUserId)return false;
  try{
    const selected=localStorage.getItem(avatarStorageKey())||'avatar-1.png';
    if(selected==='custom'){
      const dataUrl=localStorage.getItem(customAvatarStorageKey());
      if(!dataUrl)throw new Error('Локальну аватарку не знайдено.');
      const blob=await (await fetch(dataUrl)).blob();
      await uploadCustomAvatarBlob(blob);
    }else{
      await setCloudAvatarValue(DEFAULT_AVATARS.includes(selected)?selected:'avatar-1.png');
    }
    return true;
  }catch(error){
    console.warn('Avatar cloud sync failed',error);
    if(!silent)alert('Не вдалося синхронізувати аватарку з профілем. Спробуйте ще раз.');
    return false;
  }
}
async function loadSocialData(){
  if(!currentUserId)return;
  try{
    const {data:profileData,error:profileError}=await supabaseClient.rpc('ensure_my_profile_v4');
    if(profileError)throw profileError;
    const profile=rpcProfileRow(profileData);
    if(!profile?.nickname)throw new Error('Nickname missing from profile RPC');
    socialProfile=profile;
    const [{data:f,error:fe},{data:r,error:re}]=await Promise.all([
      supabaseClient.rpc('get_friends'),
      supabaseClient.rpc('get_friend_requests')
    ]);
    if(fe)throw fe;if(re)throw re;
    socialFriends=f||[];socialRequests=r||[];

    // One-time migration for an avatar that already exists only on this device.
    const selected=localStorage.getItem(avatarStorageKey())||'avatar-1.png';
    const custom=localStorage.getItem(customAvatarStorageKey());
    if(selected==='custom'&&custom&&!/^https?:\/\//i.test(String(socialProfile.avatar_value||''))){
      await syncAvatarToProfile({silent:true});
    }
  }catch(e){console.error('Social data load failed',e)}
}
async function editNickname(){
  const old=socialProfile?.nickname||''; const value=prompt('Новий унікальний нікнейм:',old)?.trim();
  if(!value||value===old)return;
  const {data,error}=await supabaseClient.rpc('set_nickname_v4',{p_nickname:value});
  if(error){alert(error.message.includes('зайнятий')||error.code==='23505'?'Цей нікнейм уже зайнятий.':error.message);return}
  const row=rpcProfileRow(data);
  if(row)socialProfile=row;
  await loadSocialData();
  openProfileModal();
}
async function addFriendDialog(){
  const id=prompt('Введіть User ID друга:')?.trim();if(!id)return;
  const {error}=await supabaseClient.rpc('send_friend_request',{target_user_id:id});
  if(error){alert(error.message);return}alert('Запит у друзі надіслано.');await loadSocialData();openProfileModal();
}
async function respondFriendRequest(id,accept){
  const {error}=await supabaseClient.rpc('respond_friend_request_v2',{p_request_id:id,p_accept:accept});
  if(error){alert(error.message);return}await loadSocialData();openProfileModal();
}
async function removeFriend(id){
  if(!confirm('Видалити цього друга? Уже отримані папки залишаться у вас.'))return;
  const {error}=await supabaseClient.rpc('remove_friend',{friend_user_id:id});if(error){alert(error.message);return}
  await loadSocialData();openProfileModal();
}
function sharedBadge(t){return t?.shared_from_nickname?`<span class="shared-folder-badge">↔ від @${esc(t.shared_from_nickname)}</span>`:''}
function currentFolder(){return listFor(state.collection).find(x=>x.id===state.topicId)||null}
async function openShareFolderModal(){
  await loadSocialData();
  document.getElementById('shareFolderModal')?.remove();
  const folder=currentFolder();if(!folder)return;
  const modal=document.createElement('div');modal.id='shareFolderModal';modal.className='profile-overlay';
  modal.innerHTML=`<div class="profile-modal share-folder-modal"><button class="profile-close" type="button">×</button><h2>Поділитися папкою</h2><p class="muted">${esc(folder.name)}</p><div class="share-friends">${socialFriends.length?socialFriends.map(f=>`<button class="share-friend" type="button" data-friend-id="${esc(f.user_id)}"><span class="share-avatar"><img src="${socialAvatar(f)}"><span class="share-check">✓</span></span><b>@${esc(f.nickname)}</b></button>`).join(''):'<div class="empty">Спочатку додайте друзів у профілі.</div>'}</div><button class="btn primary share-submit" type="button" ${socialFriends.length?'':'disabled'}>Поділитися</button></div>`;
  document.body.appendChild(modal);const chosen=new Set();const close=()=>modal.remove();modal.querySelector('.profile-close').onclick=close;modal.addEventListener('pointerdown',e=>{if(e.target===modal)close()});
  modal.querySelectorAll('.share-friend').forEach(b=>b.onclick=()=>{const id=b.dataset.friendId;chosen.has(id)?chosen.delete(id):chosen.add(id);b.classList.toggle('selected',chosen.has(id))});
  modal.querySelector('.share-submit').onclick=async()=>{if(!chosen.size){alert('Оберіть хоча б одного друга.');return}const payload=buildFolderSharePayload();for(const id of chosen){const {error}=await supabaseClient.rpc('share_folder',{recipient_user_id:id,folder_payload:payload});if(error){alert(error.message);return}}close();alert('Папку надіслано. У друга з’явиться незалежна копія.')};
}
function buildFolderSharePayload(){
  const c=state.collection,root=currentFolder();let folders=[];
  if(c==='school'){const ids=new Set(schoolDescendantIds(root.id));folders=school.filter(x=>ids.has(x.id));}
  else folders=[root];
  const ids=new Set(folders.map(x=>x.id));const folderWords=words.filter(w=>w.collection===c&&ids.has(w.topicId));
  return {collection:c,rootId:root.id,folders:folders.map(x=>({id:x.id,name:x.name,parentId:x.parentId??null})),words:folderWords.map(w=>({topicId:w.topicId,korean:w.korean,ukrainian:w.ukrainian,english:w.english||'',partOfSpeech:w.partOfSpeech||'Інше',exampleKo:w.exampleKo||'',exampleUk:w.exampleUk||'',notes:w.notes||'',tags:normalizeTags(w.tags)}))};
}
async function importPendingFolderShares(){
  if(!currentUserId)return;
  const {data,error}=await supabaseClient.rpc('get_pending_folder_shares');if(error){console.warn(error);return}
  for(const share of data||[]){
    const p=share.payload||{},c=p.collection;if(!['topics','school','phrases','themes','lingory','airlearn'].includes(c))continue;
    const map=new Map();(p.folders||[]).forEach(f=>map.set(f.id,(SPECIAL_PREFIX[c]||'')+uid()));
    for(const f of p.folders||[]){const item={id:map.get(f.id),name:f.name,shared_from_nickname:share.sender_nickname,shared_from_user_id:share.sender_id,...(c==='school'?{parentId:f.parentId?map.get(f.parentId):null}:{})};if(c==='school')school.push(item);else if(c==='phrases')phrases.push(item);else topics.push(item)}
    for(const w of p.words||[]){const oldFolder=(p.folders||[]).find(f=>f.id===w.topicId);let tid=oldFolder?map.get(oldFolder.id):map.get(p.rootId);if(!tid)tid=map.get(p.rootId);words.push(normalizeWord({id:uid(),collection:c,topicId:tid,korean:w.korean,ukrainian:w.ukrainian,english:w.english||'',partOfSpeech:w.partOfSpeech||'Інше',exampleKo:w.exampleKo||'',exampleUk:w.exampleUk||'',notes:w.notes||'',tags:w.tags||[],favorite:false,learningProgress:0,manualStatus:'new',mistakes:0,correct:0,lastReview:'',createdAt:new Date().toISOString()}))}
    save();await supabaseClient.rpc('mark_folder_share_imported',{share_id:share.share_id});
  }
}
async function openProfileModal(){
  document.getElementById('profileModal')?.remove();
  const selected=localStorage.getItem(avatarStorageKey())||'avatar-1.png';
  const custom=localStorage.getItem(customAvatarStorageKey());
  const info=await profileUserInfo();
  await loadSocialData();

  const modal=document.createElement('div');
  modal.id='profileModal';
  modal.className='profile-overlay';
  modal.innerHTML=`<div class="profile-modal" role="dialog" aria-modal="true" aria-label="Профіль">
    <button class="profile-close" type="button" aria-label="Закрити профіль">×</button>
    <h2>Профіль</h2>

    <div class="profile-identity">
      <div class="profile-name">${esc(info.name)}</div>
      ${info.email?`<div class="profile-email">${esc(info.email)}</div>`:''}
      <div class="profile-nickname">@${esc(socialProfile?.nickname||'...')} <button class="nickname-edit" type="button" title="Змінити нікнейм">✏️</button></div>
      <div class="profile-user-id">User ID: <code>${esc(currentUserId||'')}</code></div>
    </div>
    <div class="profile-social"><h3>Друзі</h3><div class="friends-row">${socialFriends.length?socialFriends.map(f=>`<div class="friend-chip"><img src="${socialAvatar(f)}"><span>@${esc(f.nickname)}</span><button type="button" class="friend-remove" data-friend-id="${esc(f.user_id)}">×</button></div>`).join(''):'<div class="muted">Друзів поки немає.</div>'}</div>${socialRequests.length?`<h3 class="requests-title">Запити в друзі</h3>${socialRequests.map(r=>`<div class="friend-request"><img src="${socialAvatar(r)}"><b>@${esc(r.nickname)}</b><button class="smallbtn accept-friend" data-request-id="${esc(r.request_id)}">✓</button><button class="smallbtn reject-friend" data-request-id="${esc(r.request_id)}">×</button></div>`).join('')}`:''}</div>

    <h3>Аватарка</h3>
    <p class="muted profile-sub">Оберіть аватарку або завантажте свою</p>

    <div class="avatar-grid">
      ${DEFAULT_AVATARS.map((name,i)=>`<button class="avatar-choice ${selected===name?'selected':''}" data-avatar="${name}" type="button" aria-label="Аватар ${i+1}">
        <img src="./${name}?v=5.0.4" alt="Аватар ${i+1}">
        ${selected===name?'<span class="avatar-check">✓</span>':''}
      </button>`).join('')}
    </div>

    <label class="avatar-upload">
      <input id="avatarUploadInput" type="file" accept="image/jpeg,image/png,image/webp" hidden>
      <span>⇧ &nbsp; Завантажити свою фото</span>
      <small>JPG, PNG · до 2MB</small>
    </label>

    ${custom&&selected==='custom'?`<div class="custom-avatar-preview selected-custom"><img src="${custom}" alt="Моя аватарка"><span class="avatar-check">✓</span></div>`:''}

    <div class="profile-theme-picker">
      <h3>Тема застосунку</h3>
      <div class="profile-theme-row">
        <button type="button" class="profile-theme-choice ${currentTheme()==='purple'?'selected':''}" data-profile-theme="purple">💜 Фіолетова ${currentTheme()==='purple'?'✓':''}</button>
        <button type="button" class="profile-theme-choice pink ${currentTheme()==='pink'?'selected':''}" data-profile-theme="pink">🩷 Рожева ${currentTheme()==='pink'?'✓':''}</button>
      </div>
    </div>

    <p class="muted avatar-private">Аватарка синхронізується з профілем і видима друзям.</p>
    <button class="btn secondary profile-add-friend" type="button">＋ Додати друга</button>
    <button class="btn secondary profile-logout" type="button">⇥ Вийти з акаунта</button>
    <div class="profile-version">PRO 5.0.4 · 29.08.2026</div>
  </div>`;
  document.body.appendChild(modal);

  const close=()=>modal.remove();

  // Direct listeners: profile modal lives outside #app, so app-level delegation cannot catch these.
  modal.querySelector('.profile-close')?.addEventListener('click',close);
  modal.querySelector('.nickname-edit')?.addEventListener('click',editNickname);
  modal.querySelector('.profile-add-friend')?.addEventListener('click',addFriendDialog);
  modal.querySelectorAll('.accept-friend').forEach(b=>b.addEventListener('click',()=>respondFriendRequest(b.dataset.requestId,true)));
  modal.querySelectorAll('.reject-friend').forEach(b=>b.addEventListener('click',()=>respondFriendRequest(b.dataset.requestId,false)));
  modal.querySelectorAll('.friend-remove').forEach(b=>b.addEventListener('click',()=>removeFriend(b.dataset.friendId)));
  modal.addEventListener('pointerdown',e=>{if(e.target===modal)close()});

  modal.querySelectorAll('.avatar-choice').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const name=btn.dataset.avatar;
      if(!DEFAULT_AVATARS.includes(name))return;
      localStorage.setItem(avatarStorageKey(),name);
      refreshAvatarButton();
      await syncAvatarToProfile();
      close();
      openProfileModal();
    });
  });

  modal.querySelectorAll('[data-profile-theme]').forEach(btn=>btn.addEventListener('click',()=>{
    localStorage.setItem(APP_THEME_KEY,btn.dataset.profileTheme==='pink'?'pink':'purple');
    applyAppTheme(); refreshAvatarButton(); close(); render(); openProfileModal();
  }));

  modal.querySelector('.profile-logout')?.addEventListener('click',async()=>{
    close();
    try{await logoutFromSupabase()}catch(error){console.error(error);alert('Не вдалося вийти з акаунта.')}
  });

  const input=modal.querySelector('#avatarUploadInput');
  input?.addEventListener('change',e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>2*1024*1024){alert('Фото має бути не більше 2MB.');return}
    const reader=new FileReader();
    reader.onload=async()=>{
      localStorage.setItem(customAvatarStorageKey(),String(reader.result));
      localStorage.setItem(avatarStorageKey(),'custom');
      refreshAvatarButton();
      await syncAvatarToProfile();
      close();
      openProfileModal();
    };
    reader.readAsDataURL(file);
  });
}
function themesView(){
  const theme=currentTheme();
  return shell('Теми',`
    <div class="theme-picker">
      <p class="muted" style="text-align:center">Оберіть тему застосунку</p>
      <div class="theme-options">
        <button class="theme-card ${theme==='purple'?'selected':''}" data-act="set-theme" data-theme="purple" type="button">
          <img src="./icon-purple.png?v=5.0.4" alt="">
          <b>Фіолетова</b><span>${theme==='purple'?'✓':''}</span>
        </button>
        <button class="theme-card pink ${theme==='pink'?'selected':''}" data-act="set-theme" data-theme="pink" type="button">
          <img src="./icon-pink.png?v=5.0.4" alt="">
          <b>Рожева</b><span>${theme==='pink'?'✓':''}</span>
        </button>
      </div>
      <div class="theme-note">Тема також застосовується до сторінки логіну та іконки застосунку.</div>
    </div>`,'home');
}
function ensureThemeStyles(){
  if(document.getElementById('theme498Styles'))return;
  document.getElementById('theme496Styles')?.remove();
  const style=document.createElement('style');
  style.id='theme498Styles';
  style.textContent=`
    .panel{position:relative}
    .version-user-row{position:absolute!important;top:-98px;right:18px;margin:0!important;z-index:20}

    .user-avatar-button{
      width:52px!important;height:52px!important;min-width:52px!important;
      padding:0!important;margin:0!important;
      overflow:hidden!important;
      border-radius:50%!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      display:inline-flex;align-items:center;justify-content:center;
    }
    .user-avatar-button img{
      display:block;width:52px!important;height:52px!important;
      aspect-ratio:1/1!important;object-fit:cover!important;
      border-radius:50%!important;border:0!important;
    }

    .profile-overlay{position:fixed;inset:0;z-index:1000;background:rgba(34,28,63,.32);display:flex;align-items:flex-end;justify-content:center;padding-top:40px}
    .profile-modal{position:relative;width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:34px 34px 0 0;padding:28px 24px calc(30px + env(safe-area-inset-bottom));text-align:center;box-shadow:0 -16px 60px rgba(50,35,95,.18)}
    .profile-close{position:absolute;right:22px;top:20px;width:48px;height:48px;border-radius:50%;border:1px solid #d9ceff;background:#f2edff;color:#6d4be2;font-size:30px;line-height:1;z-index:3;display:grid;place-items:center;cursor:pointer}
    .profile-modal h2{margin:8px 0 16px}
    .profile-identity{margin:0 auto 26px;padding:11px 16px;border-radius:16px;background:#f7f4ff;max-width:460px}
    .profile-name{font-weight:800;color:#29223d;font-size:1.04rem}
    .profile-email{margin-top:3px;color:#7d7690;font-size:.92rem;word-break:break-word}.profile-nickname{margin-top:9px;font-weight:800}.nickname-edit{border:0;background:transparent;cursor:pointer}.profile-user-id{font-size:.78rem;color:#8b84a0;margin-top:5px;word-break:break-all}.profile-user-id code{font-size:.75rem}.profile-social{max-width:500px;margin:22px auto}.friends-row{display:flex;gap:12px;overflow-x:auto;padding:6px 2px 12px}.friend-chip{min-width:82px;position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:.78rem}.friend-chip img,.friend-request img,.share-avatar img{width:58px;height:58px;border-radius:50%;object-fit:cover}.friend-remove{position:absolute;right:4px;top:-2px;border:0;border-radius:50%;background:#eee;color:#555}.friend-request{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid #eee;border-radius:14px;margin:7px 0}.friend-request b{flex:1;text-align:left}.profile-add-friend{width:100%;margin:8px 0}.shared-folder-badge{display:inline-block;font-size:.7rem;margin-left:7px;padding:2px 7px;border-radius:999px;background:#eee8ff;color:#6544c7}.share-friends{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin:22px 0}.share-friend{border:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:6px}.share-avatar{position:relative;border:3px solid transparent;border-radius:50%;padding:2px}.share-friend.selected .share-avatar{border-color:#704be4}.share-check{display:none;position:absolute;right:-3px;bottom:0;background:#704be4;color:white;border-radius:50%;width:21px;height:21px;place-items:center}.share-friend.selected .share-check{display:grid}.share-submit{width:100%}
    .profile-modal h3{font-size:22px;margin:0 0 5px}.profile-sub{margin:0 0 24px}

    .avatar-grid{
      display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
      gap:16px;max-width:460px;margin:0 auto 24px;align-items:center;
    }
    .avatar-choice{
      position:relative;width:100%!important;height:auto!important;aspect-ratio:1/1!important;
      min-width:0!important;min-height:0!important;
      border-radius:50%!important;padding:4px!important;
      border:2px solid #eee7ff!important;background:#fff!important;
      overflow:visible!important;box-sizing:border-box!important;
      display:block!important;line-height:0!important;
    }
    .avatar-choice img{
      display:block!important;width:100%!important;height:100%!important;
      aspect-ratio:1/1!important;object-fit:cover!important;border-radius:50%!important;
    }
    .avatar-choice.selected{border:4px solid #704be4!important;padding:2px!important}
    .avatar-check{position:absolute;right:-3px;bottom:7px;width:27px;height:27px;border-radius:50%;background:#704be4;color:#fff;display:grid;place-items:center;font-weight:900;line-height:1}
    .avatar-upload{display:flex;flex-direction:column;gap:5px;max-width:500px;margin:8px auto 24px;padding:24px;border:2px dashed #a88cff;border-radius:18px;color:#704be4;font-weight:800;cursor:pointer}
    .avatar-upload small{font-weight:500;color:#8b84a0}
    .custom-avatar-preview{position:relative;width:96px;height:96px;margin:0 auto}
    .custom-avatar-preview img{display:block;width:96px;height:96px;border-radius:50%;object-fit:cover;border:4px solid #704be4}
    .avatar-private{font-size:.9em;margin:18px 0 24px}.profile-logout{width:100%;max-width:500px}.profile-version{margin-top:24px;color:#704be4;font-weight:800}
    .app-footer-version{margin:22px 0 4px;text-align:center;font-size:12px;font-weight:800;color:#7b6bb3;opacity:.78;letter-spacing:.02em}
    body.theme-pink .app-footer-version{color:#c76189}

    .theme-options{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0}
    .theme-card{position:relative;border:3px solid transparent;border-radius:22px;background:#f5f1ff;padding:14px;color:#5f42d6;font-size:16px}
    .theme-card img{width:100%;border-radius:18px;display:block;margin-bottom:10px}.theme-card.selected{border-color:#704be4}.theme-card span{position:absolute;right:12px;bottom:10px;font-weight:900}
    .theme-card.pink{background:#fff1f6;color:#d94f86}.theme-card.pink.selected{border-color:#ef78a7}
    .theme-note{padding:14px;border-radius:16px;background:#f7f4ff;color:#777085;text-align:center}

    body.theme-pink{background:#fff5f8}
    body.theme-pink .btn.primary{background:#f06f9d!important;border-color:#f06f9d!important}
    body.theme-pink .btn.secondary{background:#fff0f5!important;color:#d94f86!important;border-color:#ffd6e4!important}
    body.theme-pink .profile-version{color:#d94f86}

    .version-user-row{top:-76px!important;right:8px!important}.user-avatar-button{width:46px!important;height:46px!important;min-width:46px!important}.user-avatar-button img{width:46px!important;height:46px!important}
    .avatar-choice{padding:0!important;border:0!important;overflow:visible!important;background:transparent!important}.avatar-choice img{position:absolute;inset:3px;width:calc(100% - 6px)!important;height:calc(100% - 6px)!important;object-fit:cover!important;border-radius:50%!important;box-shadow:none!important}.avatar-choice.selected{border:0!important;padding:0!important}.avatar-choice.selected:after{content:"";position:absolute;inset:0;border:4px solid #704be4;border-radius:50%;pointer-events:none;box-sizing:border-box}.avatar-check{z-index:3;right:8px!important;bottom:8px!important;width:25px!important;height:25px!important;font-size:16px!important;border:2px solid #fff;box-sizing:border-box}.avatar-choice:not(.selected) .avatar-check{display:none!important}
    body.theme-pink .avatar-choice.selected:after{border-color:#df6f9b!important} body.theme-pink .avatar-check{background:#df6f9b!important}
    .profile-theme-picker{max-width:500px;margin:22px auto}.profile-theme-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.profile-theme-choice{border:2px solid #ded5ff;background:#f5f1ff;color:#6747d8;border-radius:16px;padding:14px 8px;font-weight:800}.profile-theme-choice.selected{border-color:#704be4}.profile-theme-choice.pink{background:#fff1f6;color:#d65386;border-color:#ffd4e2}.profile-theme-choice.pink.selected{border-color:#df6f9b}
    .match-help{text-align:center;color:#7c748e;margin:4px 0 18px}.match-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 14px;align-items:stretch}.match-column{display:grid;gap:12px;align-content:start}.match-card{width:100%;min-height:92px;border:2px solid #e7e1f2;border-radius:20px;background:#fff;color:#29233c;padding:12px 8px;font-size:clamp(16px,4.3vw,22px);font-weight:750;line-height:1.25;transition:.15s;overflow-wrap:anywhere}.match-card.selected{background:#eee8ff;border-color:#704be4;color:#5e3ed0}.theme-pink .match-card.selected{background:#fff0f5;border-color:#df6f9b;color:#c94f7e}.match-card.matched{background:#e6f8ef!important;border-color:#27b878!important;color:#148457!important}.match-card.wrong{background:#ffe9ea!important;border-color:#e6535c!important;color:#bd3139!important}.match-card:disabled{opacity:1}.more-menu{display:grid;gap:14px}
    @media(max-width:390px){.avatar-grid{gap:10px}.profile-modal{padding-left:18px;padding-right:18px}}
    @media(min-width:700px){.profile-overlay{align-items:center}.profile-modal{border-radius:34px;max-height:88vh}}
  `;
  document.head.appendChild(style);
}

let state={view:'home',collection:'topics',topicId:null,schoolParentId:null,returnTopicId:null,returnView:'library',returnScrollY:null,trainingReturnView:'home',studySource:[],study:[],index:0,mode:'flash',editId:null,editTopicId:null,librarySort:'none',libraryTag:'',libraryQuery:'',libraryCollection:'',libraryTopic:'',libraryLevel:'',detailSearch:'',ocrLines:[],studyTitle:'',studyIsMistakes:false,studyLimit:'all',speakingBusy:false,expandedWordId:null,bulkMove:false,selectedWordIds:[],matchOffset:0,matchSelected:null,matchMatched:[],matchWrong:[],matchCards:[],matchRound:[],matchBusy:false,matchMistakeWordIds:[]};
let activeRecognition=null,speakingRestartTimer=null,audioContext=null,micStream=null,micPermissionChecked=false;
let destinationContext=null,touchFolderDrag=null;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function normalizeAnswer(value){
  return String(value??'')
    .normalize('NFKC')
    .toLocaleLowerCase('uk-UA')
    .replace(/[’'`]/g,'')
    .replace(/[^\p{L}\p{N}\s]/gu,' ')
    .replace(/\s+/g,' ')
    .trim();
}


function recognitionApi(){return window.SpeechRecognition||window.webkitSpeechRecognition||null}
async function ensureMicrophonePermission(){
  if(micPermissionChecked&&micStream)return true;
  if(!navigator.mediaDevices?.getUserMedia)return true;
  try{
    micStream=await navigator.mediaDevices.getUserMedia({audio:true});
    micPermissionChecked=true;
    return true;
  }catch(err){
    micPermissionChecked=true;
    console.warn('Microphone permission failed',err);
    return false;
  }
}
function releaseMicrophone(){if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null}micPermissionChecked=false}
function uid(){return Date.now()+'-'+Math.random().toString(16).slice(2)}
function normalizeWord(w){
  const source=w||{};
  const word=Object.assign({collection:'topics',partOfSpeech:'Інше',exampleKo:'',exampleUk:'',notes:'',tags:[],favorite:false,level:0,learningProgress:null,manualStatus:null,mistakes:0,correct:0,lastReview:'',createdAt:new Date().toISOString()},source);
  word.tags=normalizeTags(word.tags);
  if(word.learningProgress===null||word.learningProgress===undefined){
    const oldLevel=Number(source.level)||0;
    word.learningProgress=oldLevel>=2?3:0;
    word.manualStatus=oldLevel===1?'familiar':oldLevel===0?'new':null;
  }
  word.learningProgress=Math.max(0,Math.min(3,Number(word.learningProgress)||0));
  if(!['new','familiar',null].includes(word.manualStatus))word.manualStatus=null;
  syncLegacyLevel(word);
  return word;
}
function normalizeTags(value){const raw=Array.isArray(value)?value:String(value||'').split(/[,;#\n]/);return [...new Set(raw.map(x=>String(x).trim().replace(/^#+/,'')).filter(Boolean).map(x=>x.toLowerCase()))]}
function allTags(){return [...new Set(words.flatMap(w=>normalizeTags(w.tags)))].sort((a,b)=>a.localeCompare(b,'uk'))}
function load(){
  if(!currentUserId){
    topics=[]; school=[]; phrases=[]; words=[];
    return;
  }
  try{topics=JSON.parse(localStorage.getItem(userLocalKey(KEYS.topics)))||[]}catch{topics=[]}
  try{school=JSON.parse(localStorage.getItem(userLocalKey(KEYS.school)))||[]}catch{school=[]}
  try{phrases=JSON.parse(localStorage.getItem(userLocalKey(KEYS.phrases)))||[]}catch{phrases=[]}
  try{words=JSON.parse(localStorage.getItem(userLocalKey(KEYS.words)))||[]}catch{words=[]}
  school=school.map(x=>({...x,parentId:x.parentId??null}));
  words=words.map(normalizeWord);
}
async function loadFromSupabase(){
  if(!currentUserId)return false;
  try{
    const [
      topicsResult,
      schoolResult,
      phrasesResult,
      wordsResult
    ] = await Promise.all([
      supabaseClient.from('topics').select('*').eq('user_id',currentUserId),
      supabaseClient.from('school').select('*').eq('user_id',currentUserId),
      supabaseClient.from('phrases').select('*').eq('user_id',currentUserId),
      supabaseClient.from('words').select('*').eq('user_id',currentUserId)
    ]);

    const error =
      topicsResult.error ||
      schoolResult.error ||
      phrasesResult.error ||
      wordsResult.error;

    if(error) throw error;

    topics = (topicsResult.data || []).map(({user_id,...item})=>item);
    school = (schoolResult.data || []).map(({user_id,...x}) => ({
      ...x,
      parentId: x.parentId ?? null
    }));
    phrases = (phrasesResult.data || []).map(({user_id,...item})=>item);

    words = (wordsResult.data || []).map(row => {
      const {user_id,...w}=row;
      let tags = w.tags;
      if(typeof tags === 'string'){
        try{
          const parsed = JSON.parse(tags);
          if(Array.isArray(parsed)) tags = parsed;
        }catch{}
      }
      return normalizeWord({...w,tags});
    });

    lastCloudWords = new Map(words.map(w => [w.id, wordCloudSignature(w)]));
    lastCloudTopics = new Map(topics.map(t => [t.id, topicCloudSignature(t)]));
    lastCloudSchool = new Map(school.map(item => [item.id, schoolCloudSignature(item)]));
    lastCloudPhrases = new Map(phrases.map(item => [item.id, phraseCloudSignature(item)]));

    // Account-scoped offline copy.
    localStorage.setItem(userLocalKey(KEYS.topics), JSON.stringify(topics));
    localStorage.setItem(userLocalKey(KEYS.school), JSON.stringify(school));
    localStorage.setItem(userLocalKey(KEYS.phrases), JSON.stringify(phrases));
    localStorage.setItem(userLocalKey(KEYS.words), JSON.stringify(words));

    console.log('Supabase user data loaded:', currentUserId, topics.length, school.length, phrases.length, words.length);
    return true;
  }catch(error){
    console.error('Supabase load failed:', error);
    return false;
  }
}
let lastCloudWords = new Map();
let cloudWordsSaveTimer = null;
let cloudWordsSaving = false;

let lastCloudTopics = new Map();
let cloudTopicsSaveTimer = null;
let cloudTopicsSaving = false;

let lastCloudSchool = new Map();
let cloudSchoolSaveTimer = null;
let cloudSchoolSaving = false;

let lastCloudPhrases = new Map();
let cloudPhrasesSaveTimer = null;
let cloudPhrasesSaving = false;


/* =========================
   TOPICS
========================= */

function topicForCloud(t){
  return {
    id: t.id,
    name: t.name,
    shared_from_nickname: t.shared_from_nickname || null,
    shared_from_user_id: t.shared_from_user_id || null,
    user_id: currentUserId
  };
}

function topicCloudSignature(t){
  return JSON.stringify(topicForCloud(t));
}

async function syncTopicsToSupabase(){
  if(!currentUserId) return;
  if(cloudTopicsSaving) return;
  cloudTopicsSaving = true;

  try{
    const currentIds = new Set(topics.map(t => t.id));
    const changed = [];

    for(const t of topics){
      const signature = topicCloudSignature(t);

      if(lastCloudTopics.get(t.id) !== signature){
        changed.push(topicForCloud(t));
      }
    }

    const deletedIds = [...lastCloudTopics.keys()]
      .filter(id => !currentIds.has(id));

    if(changed.length){
      const { error } = await supabaseClient
        .from('topics')
        .upsert(changed, { onConflict: 'id' });

      if(error) throw error;
    }

    if(deletedIds.length){
      const { error } = await supabaseClient
        .from('topics')
        .delete()
        .in('id', deletedIds)
        .eq('user_id', currentUserId);

      if(error) throw error;
    }

    lastCloudTopics = new Map(
      topics.map(t => [t.id, topicCloudSignature(t)])
    );
  }catch(error){
    console.error('Supabase topics save failed:', error);
  }finally{
    cloudTopicsSaving = false;
  }
}

function scheduleTopicsCloudSave(){
  clearTimeout(cloudTopicsSaveTimer);
  cloudTopicsSaveTimer = setTimeout(syncTopicsToSupabase, 300);
}


/* =========================
   SCHOOL
========================= */

function schoolForCloud(item){
  return {
    id: item.id,
    name: item.name,
    parentId: item.parentId ?? null,
    shared_from_nickname: item.shared_from_nickname || null,
    shared_from_user_id: item.shared_from_user_id || null,
    user_id: currentUserId
  };
}

function schoolCloudSignature(item){
  return JSON.stringify(schoolForCloud(item));
}

async function syncSchoolToSupabase(){
  if(!currentUserId) return;
  if(cloudSchoolSaving) return;
  cloudSchoolSaving = true;

  try{
    const currentIds = new Set(school.map(item => item.id));
    const changed = [];

    for(const item of school){
      const signature = schoolCloudSignature(item);

      if(lastCloudSchool.get(item.id) !== signature){
        changed.push(schoolForCloud(item));
      }
    }

    const deletedIds = [...lastCloudSchool.keys()]
      .filter(id => !currentIds.has(id));

    if(changed.length){
      const { error } = await supabaseClient
        .from('school')
        .upsert(changed, { onConflict: 'id' });

      if(error) throw error;
    }

    if(deletedIds.length){
      const { error } = await supabaseClient
        .from('school')
        .delete()
        .in('id', deletedIds)
        .eq('user_id', currentUserId);

      if(error) throw error;
    }

    lastCloudSchool = new Map(
      school.map(item => [item.id, schoolCloudSignature(item)])
    );
  }catch(error){
    console.error('Supabase school save failed:', error);
  }finally{
    cloudSchoolSaving = false;
  }
}

function scheduleSchoolCloudSave(){
  clearTimeout(cloudSchoolSaveTimer);
  cloudSchoolSaveTimer = setTimeout(syncSchoolToSupabase, 300);
}


/* =========================
   PHRASES
========================= */

function phraseForCloud(item){
  return {
    id: item.id,
    name: item.name,
    shared_from_nickname: item.shared_from_nickname || null,
    shared_from_user_id: item.shared_from_user_id || null,
    user_id: currentUserId
  };
}

function phraseCloudSignature(item){
  return JSON.stringify(phraseForCloud(item));
}

async function syncPhrasesToSupabase(){
  if(!currentUserId) return;
  if(cloudPhrasesSaving) return;
  cloudPhrasesSaving = true;

  try{
    const currentIds = new Set(phrases.map(item => item.id));
    const changed = [];

    for(const item of phrases){
      const signature = phraseCloudSignature(item);

      if(lastCloudPhrases.get(item.id) !== signature){
        changed.push(phraseForCloud(item));
      }
    }

    const deletedIds = [...lastCloudPhrases.keys()]
      .filter(id => !currentIds.has(id));

    if(changed.length){
      const { error } = await supabaseClient
        .from('phrases')
        .upsert(changed, { onConflict: 'id' });

      if(error) throw error;
    }

    if(deletedIds.length){
      const { error } = await supabaseClient
        .from('phrases')
        .delete()
        .in('id', deletedIds)
        .eq('user_id', currentUserId);

      if(error) throw error;
    }

    lastCloudPhrases = new Map(
      phrases.map(item => [item.id, phraseCloudSignature(item)])
    );
  }catch(error){
    console.error('Supabase phrases save failed:', error);
  }finally{
    cloudPhrasesSaving = false;
  }
}

function schedulePhrasesCloudSave(){
  clearTimeout(cloudPhrasesSaveTimer);
  cloudPhrasesSaveTimer = setTimeout(syncPhrasesToSupabase, 300);
}


/* =========================
   WORDS
========================= */

function wordForCloud(w){
  return {
    id: w.id,
    user_id: currentUserId,
    collection: w.collection,
    topicId: w.topicId,
    korean: w.korean,
    ukrainian: w.ukrainian,
    english: w.english || '',
    partOfSpeech: w.partOfSpeech || 'Інше',
    exampleKo: w.exampleKo || '',
    exampleUk: w.exampleUk || '',
    notes: w.notes || '',
    tags: JSON.stringify(normalizeTags(w.tags)),
    favorite: Boolean(w.favorite),
    level: Number(w.level) || 0,
    learningProgress: Number(w.learningProgress) || 0,
    manualStatus: w.manualStatus ?? null,
    mistakes: Number(w.mistakes) || 0,
    correct: Number(w.correct) || 0,
    lastReview: w.lastReview || '',
    createdAt: w.createdAt || new Date().toISOString()
  };
}

function wordCloudSignature(w){
  return JSON.stringify(wordForCloud(w));
}

async function syncWordsToSupabase(){
  if(!currentUserId) return;
  if(cloudWordsSaving) return;
  cloudWordsSaving = true;

  try{
    const currentIds = new Set(words.map(w => w.id));
    const changed = [];

    for(const w of words){
      const signature = wordCloudSignature(w);

      if(lastCloudWords.get(w.id) !== signature){
        changed.push(wordForCloud(w));
      }
    }

    const deletedIds = [...lastCloudWords.keys()]
      .filter(id => !currentIds.has(id));

    if(changed.length){
      const { error } = await supabaseClient
        .from('words')
        .upsert(changed, { onConflict: 'id' });

      if(error) throw error;
    }

    if(deletedIds.length){
      const { error } = await supabaseClient
        .from('words')
        .delete()
        .in('id', deletedIds)
        .eq('user_id', currentUserId);

      if(error) throw error;
    }

    lastCloudWords = new Map(
      words.map(w => [w.id, wordCloudSignature(w)])
    );
  }catch(error){
    console.error('Supabase words save failed:', error);
  }finally{
    cloudWordsSaving = false;
  }
}

function scheduleWordsCloudSave(){
  clearTimeout(cloudWordsSaveTimer);
  cloudWordsSaveTimer = setTimeout(syncWordsToSupabase, 300);
}


/* =========================
   LOCAL + CLOUD SAVE
========================= */

function save(){
  if(!currentUserId)return;
  localStorage.setItem(userLocalKey(KEYS.topics), JSON.stringify(topics));
  localStorage.setItem(userLocalKey(KEYS.school), JSON.stringify(school));
  localStorage.setItem(userLocalKey(KEYS.phrases), JSON.stringify(phrases));
  localStorage.setItem(userLocalKey(KEYS.words), JSON.stringify(words));

  scheduleTopicsCloudSave();
  scheduleSchoolCloudSave();
  schedulePhrasesCloudSave();
  scheduleWordsCloudSave();
}

const SPECIAL_PREFIX={themes:'theme_',lingory:'lingory_',airlearn:'airlearn_'};
function isSpecialTopicId(id){return Object.values(SPECIAL_PREFIX).some(p=>String(id||'').startsWith(p))}
function listFor(c){
  if(c==='school')return school; if(c==='phrases')return phrases;
  if(c==='topics')return topics.filter(t=>!isSpecialTopicId(t.id));
  if(SPECIAL_PREFIX[c])return topics.filter(t=>String(t.id||'').startsWith(SPECIAL_PREFIX[c]));
  return topics;
}
function collectionLabel(c){return ({topics:'Duolingo',school:'School',phrases:'Фрази',themes:'Теми',lingory:'Lingory',airlearn:'Airlearn'})[c]||c}
function collectionViewName(c){return ({topics:'topics',school:'school',phrases:'phrases',themes:'themes',lingory:'lingory',airlearn:'airlearn'})[c]||'topics'}
function nameFor(id,c){return listFor(c).find(x=>x.id===id)?.name||'Без теми'}
function schoolChildren(parentId=null){return school.filter(x=>(x.parentId??null)===(parentId??null))}
function schoolDescendantIds(id){const out=[id];for(let i=0;i<out.length;i++)schoolChildren(out[i]).forEach(x=>{if(!out.includes(x.id))out.push(x.id)});return out}
function schoolWordsFor(id){const ids=new Set(schoolDescendantIds(id));return words.filter(w=>w.collection==='school'&&ids.has(w.topicId))}
function schoolPath(id){const path=[];let node=school.find(x=>x.id===id),guard=0;while(node&&guard++<100){path.unshift(node);node=school.find(x=>x.id===node.parentId)}return path}
function topicOptionsForFilter(c){if(!c)return[];return listFor(c).map(t=>({id:t.id,name:c==='school'?schoolPath(t.id).map(x=>x.name).join(' / '):t.name})).sort((a,b)=>a.name.localeCompare(b.name,'uk'))}
function syncLegacyLevel(w){
  const progress=Number(w.learningProgress)||0;
  w.level=progress>=3?2:(w.manualStatus==='familiar'||progress>0?1:0);
}
function wordStatusKey(w){
  const p=Number(w.learningProgress)||0;
  if(p>=3)return 'learned';
  if(w.manualStatus==='familiar'||p===1||p===2)return 'familiar';
  return 'new';
}
function wordStatusLabel(w){
  const p=Number(w.learningProgress)||0;
  if(p>=3)return 'Вивчене';
  if(p===2)return 'Вивчене 66%';
  if(p===1)return 'Вивчене 33%';
  if(w.manualStatus==='familiar')return 'Знайоме';
  return 'Нове';
}
function levelName(n){return ['Нове','Знайоме','Вивчене'][Math.max(0,Math.min(2,Number(n)||0))]}
function updateStaticAppVersion(){
  const target='PRO 5.0.4 · 29.08.2026';
  const topVersion=document.querySelector('header .version');
  if(topVersion)topVersion.style.display='none';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(/PRO\s+4\.\d+\.\d+\s*[·•-]\s*\d{2}\.\d{2}\.\d{4}/i.test(node.nodeValue||'')){
      node.nodeValue=(node.nodeValue||'').replace(/PRO\s+4\.\d+\.\d+\s*[·•-]\s*\d{2}\.\d{2}\.\d{4}/ig,target);
    }
  });
}
function setView(v,restoreScroll=null){
  if(v!=='study'||state.mode!=='speaking'){
    stopSpeakingRecognition();
    if(state.mode==='speaking')releaseMicrophone();
  }

  state.view=v;
  render();

  if(restoreScroll===null||restoreScroll===undefined){
    scrollTo(0,0);
  }else{
    const y=Math.max(0,Number(restoreScroll)||0);
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>window.scrollTo(0,y));
    });
  }
}
function shell(title,body,back){return `<section class="panel"><div class="top">${back?`<button class="back" data-act="${back}">← Назад</button>`:'<span></span>'}<h2>${esc(title)}</h2><button class="home-mini" data-act="home" type="button" aria-label="На головну" title="На головну">🏠</button></div>${body}</section>`}
function render(){try{ensureThemeStyles();applyAppTheme();app.innerHTML=(views[state.view]||views.home)();bind();setupScrollUi();updateStaticAppVersion();updateAuthUI().then(refreshAvatarButton).catch(console.error);if(state.view==='study'&&state.mode==='speaking')setTimeout(startSpeaking,250)}catch(e){console.error(e);app.innerHTML=`<section class="panel"><h2>Сталася помилка</h2><p>${esc(e.message)}</p><button class="btn primary" data-act="home">На головну</button></section>`;bind()}}
const views={
  home:()=>`
  <section class="panel">
    <div class="home">
      <div class="version-user-row">
        <button id="userAvatarButton" class="iconbtn user-avatar-button" data-act="open-profile" type="button" style="display:none" aria-label="Профіль"></button>
      </div>
      <button class="btn primary large wide" data-act="start">🎴 Start</button>
      <button class="btn secondary large" data-act="school">🎓 School</button>
      <button class="btn secondary large" data-act="topics">🦉 Duolingo</button>
      <button class="btn secondary large" data-act="themes">📚 Теми</button>
      <button class="btn secondary large" data-act="phrases">💬 Фрази</button>
      <button class="btn secondary large" data-act="library">📖 Усі слова</button>
      <button class="btn secondary large" data-act="favorites">⭐ Обране</button>
      <button class="btn secondary large" data-act="mistakes">❌ Повторити помилки</button>
      <button class="btn secondary large" data-act="more">more...</button>
      <button class="btn secondary large" data-act="stats">📊 Статистика</button>
      <button class="btn secondary large" data-act="data-tools">💾 Резервна копія</button>
      <button class="btn secondary large" data-act="force-update">🔄 Оновити застосунок</button>
      <div class="app-footer-version">PRO 5.0.4 · 29.08.2026</div>
    </div>
  </section>
`,
  start:()=>shell('Start',`<div class="modegrid"><button class="mode" data-act="start-all">🎯 Відкрити тренування<br><small>${words.length} слів доступно</small></button></div>`,'home'),
  topics:()=>collectionView('topics','Duolingo'), themes:()=>collectionView('themes','Теми'), school:()=>collectionView('school','School'), phrases:()=>collectionView('phrases','Фрази'), lingory:()=>collectionView('lingory','Lingory'), airlearn:()=>collectionView('airlearn','Airlearn'), more:()=>moreView(),
  detail:()=>detailView(),
  library:()=>libraryView(false),
  mistakesLibrary:()=>libraryView(true),
  wordForm:()=>wordFormView(), topicForm:()=>topicFormView(), modes:()=>modeView(), study:()=>studyView(), stats:()=>statsView(), dataTools:()=>dataToolsView(), photoImport:()=>photoImportView()
};
function moreView(){return shell('more...',`<div class="home more-menu"><button class="btn secondary large" data-act="lingory">🌿 Lingory</button><button class="btn secondary large" data-act="airlearn">🐱 Airlearn</button></div>`,'home')}
function libraryView(mistakesOnly=false){
  const base=mistakesOnly?words.filter(w=>w.mistakes>0):words,filtered=applyLibraryFilters(base),title=mistakesOnly?'Повторити помилки':'Усі слова';
  const folderOptions=topicOptionsForFilter(state.libraryCollection);
  return shell(title,`<div class="searchbar live-search"><input id="search" value="${esc(state.libraryQuery)}" placeholder="Корейською — від 1 складу, іншими мовами — від 2 символів" autocomplete="off"></div><div class="filters library-filters"><select id="filterCollection"><option value="">Усі розділи</option><option value="topics" ${state.libraryCollection==='topics'?'selected':''}>Duolingo</option><option value="school" ${state.libraryCollection==='school'?'selected':''}>School</option><option value="phrases" ${state.libraryCollection==='phrases'?'selected':''}>Фрази</option><option value="themes" ${state.libraryCollection==='themes'?'selected':''}>Теми</option><option value="lingory" ${state.libraryCollection==='lingory'?'selected':''}>Lingory</option><option value="airlearn" ${state.libraryCollection==='airlearn'?'selected':''}>Airlearn</option></select><select id="filterTopic" ${state.libraryCollection?'':'disabled'}><option value="">Усі папки / уроки</option>${folderOptions.map(t=>`<option value="${esc(t.id)}" ${state.libraryTopic===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select><select id="filterLevel"><option value="">Усі рівні</option><option value="new" ${state.libraryLevel==='new'?'selected':''}>Нове</option><option value="familiar" ${state.libraryLevel==='familiar'?'selected':''}>Знайоме</option><option value="learned" ${state.libraryLevel==='learned'?'selected':''}>Вивчене</option></select><select id="filterTag"><option value="">Усі теги</option>${allTags().map(t=>`<option value="${esc(t)}" ${state.libraryTag===t?'selected':''}>#${esc(t)}</option>`).join('')}</select><select id="sortWords"><option value="none">Без сортування</option><option value="ko-asc" ${state.librarySort==='ko-asc'?'selected':''}>Корейська ㄱ→ㅎ</option><option value="ko-desc" ${state.librarySort==='ko-desc'?'selected':''}>Корейська ㅎ→ㄱ</option><option value="uk-asc" ${state.librarySort==='uk-asc'?'selected':''}>Українська А→Я</option><option value="uk-desc" ${state.librarySort==='uk-desc'?'selected':''}>Українська Я→А</option></select></div><div class="library-train"><div><b id="filteredCount">${filtered.length}</b> слів у поточній добірці</div><button class="btn primary" data-act="train-filtered">🎯 Тренувати відфільтровані</button></div><div id="libraryWords">${wordList(filtered)}</div>${mistakesOnly?'':`<div class="actions" style="margin-top:14px"><button class="btn primary" data-act="add-word">+ Додати слово</button><button class="btn secondary" data-act="photo-import">📷 Додати з фото</button></div>`}`,'home')}

function collectionView(c,title){
  const list=c==='school'?schoolChildren(state.schoolParentId):listFor(c);
  const items=list.map((t,i)=>{const count=c==='school'?schoolWordsFor(t.id).length:words.filter(w=>w.collection===c&&w.topicId===t.id).length;const childCount=c==='school'?schoolChildren(t.id).length:0;return `<div class="topic sortable-topic" draggable="true" data-topic-id="${esc(t.id)}" data-c="${c}"><button class="drag-handle" type="button" aria-label="Перетягнути тему">☰</button><button class="topic-open" data-act="open-topic" data-c="${c}" data-id="${esc(t.id)}"><div class="topic-name">${c==='school'?'📁 ':''}${esc(t.name)} ${sharedBadge(t)}</div><div class="count">${count} слів${childCount?` · ${childCount} вкладених папок`:''}</div></button><div class="topic-actions"><button class="orderbtn" data-act="move-topic" data-dir="up" data-c="${c}" data-id="${esc(t.id)}" ${i===0?'disabled':''}>↑</button><button class="orderbtn" data-act="move-topic" data-dir="down" data-c="${c}" data-id="${esc(t.id)}" ${i===list.length-1?'disabled':''}>↓</button>${c==='school'&&t.parentId?`<button class="smallbtn promote-folder-btn" data-act="promote-folder" data-id="${esc(t.id)}" title="Підняти на рівень вище" aria-label="Підняти папку на рівень вище">↰</button>`:''}<button class="smallbtn" data-act="edit-topic" data-c="${c}" data-id="${esc(t.id)}">✏️</button><button class="smallbtn" data-act="quick-add" data-c="${c}" data-id="${esc(t.id)}">+ Слово</button></div></div>`}).join('');
  const path=c==='school'&&state.schoolParentId?schoolPath(state.schoolParentId):[];
  const heading=c==='school'&&path.length?path.map(x=>x.name).join(' / '):title;
  const back=c==='school'&&state.schoolParentId?'school-up':'home';
  return shell(heading,`<div class="actions"><button class="btn primary" data-act="new-topic" data-c="${c}">+ ${c==='school'?'Папка / урок':c==='phrases'?'Розділ':'Тема'}</button><button class="btn secondary" data-act="photo-import-collection" data-c="${c}">📷 Додати з фото</button></div><div class="sort-hint">Перетягни за ☰ або використовуй ↑ ↓. Назву можна змінити кнопкою ✏️</div><div class="list sortable-list" data-c="${c}">${items||'<div class="empty">Поки порожньо.</div>'}</div>`,back)
}
function detailView(){
  const isSchool=state.collection==='school';
  const allArr=isSchool?schoolWordsFor(state.topicId):words.filter(w=>w.collection===state.collection&&w.topicId===state.topicId);
  const q=(state.detailSearch||'').toLowerCase().trim();
  const arr=q?allArr.filter(w=>(w.korean+' '+w.ukrainian+' '+(w.english||'')).toLowerCase().includes(q)):allArr;
  const mistakes=allArr.filter(w=>w.mistakes>0);
  const children=isSchool?schoolChildren(state.topicId):[];
  const childHtml=isSchool?`<div class="section-title-row"><h3>Вкладені папки</h3><button class="tiny-add-btn" data-act="new-subtopic" aria-label="Додати вкладену папку" title="Додати вкладену папку">+</button></div>${children.length?`<div class="list sortable-list" data-c="school">${children.map(t=>`<div class="topic sortable-topic" draggable="true" data-topic-id="${esc(t.id)}" data-c="school"><button class="drag-handle" type="button" aria-label="Перетягнути папку">☰</button><button class="topic-open" data-act="open-topic" data-c="school" data-id="${esc(t.id)}"><div class="topic-name">📁 ${esc(t.name)} ${sharedBadge(t)}</div><div class="count">${schoolWordsFor(t.id).length} слів · ${schoolChildren(t.id).length} вкладених папок</div></button><div class="topic-actions"><button class="smallbtn promote-folder-btn" data-act="promote-folder" data-id="${esc(t.id)}" title="Підняти на рівень вище" aria-label="Підняти папку на рівень вище">↰</button><button class="smallbtn" data-act="edit-topic" data-c="school" data-id="${esc(t.id)}">✏️</button></div></div>`).join('')}</div>`:`<div class="muted compact-note">У цій папці ще немає вкладених папок.</div>`}`:'';
  const search=isSchool?`<div class="searchbar lesson-search live-search"><input id="detailSearch" value="${esc(state.detailSearch)}" placeholder="Корейською — від 1 складу, іншими мовами — від 2 символів" autocomplete="off"></div>`:'';
  const backAction=isSchool&&school.find(x=>x.id===state.topicId)?.parentId?'detail-parent':'back-collection';
  return shell(nameFor(state.topicId,state.collection),`<div class="actions detail-actions"><button class="btn primary" data-act="study-topic">🎯 Тренування</button><button class="btn secondary" data-act="study-topic-mistakes">❌ Помилки (${mistakes.length})</button><button class="btn secondary" data-act="add-word-topic">+ Додати слово</button><button class="btn secondary share-folder-btn" data-act="share-folder" title="Поділитися папкою">↔</button><button class="btn secondary" data-act="photo-import-topic">📷 З фото</button></div>${childHtml}${search}${isSchool?'':'<h3>Слова</h3>'}<div id="detailWords">${wordList(arr)}</div>${isSchool?`<div class="folder-danger-zone"><button class="btn folder-delete-bottom" data-act="delete-folder" data-id="${esc(state.topicId)}">🗑️ Видалити папку</button></div>`:''}`,backAction)
}

function wordList(arr){
  if(!arr.length)return '<div class="empty">Слів поки немає.</div>';
  return `<div class="list">${arr.map(w=>{
    const status=wordStatusKey(w),expanded=state.expandedWordId===w.id,selected=state.selectedWordIds.includes(w.id);
    const location=state.collection==='school'&&w.collection==='school'?schoolPath(w.topicId).map(x=>x.name).join(' / '):nameFor(w.topicId,w.collection);
    const extras=[];
    if(w.tags?.length)extras.push(`<div><b>Теги:</b> ${esc(normalizeTags(w.tags).join(', '))}</div>`);
    if(w.exampleKo)extras.push(`<div><b>Приклад:</b> ${esc(w.exampleKo)}${w.exampleUk?` — ${esc(w.exampleUk)}`:''}</div>`);

    extras.push(`<div class="expanded-notes-editor" style="margin-top:10px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <b>📝 Нотатки</b>
        <button class="smallbtn" data-act="speak-note" data-id="${esc(w.id)}" type="button" title="Прослухати нотатку">🔊 Прослухати</button>
      </div>
      <textarea
        class="inline-notes"
        data-word-id="${esc(w.id)}"
        rows="3"
        placeholder="Додати нотатку…"
        style="width:100%;box-sizing:border-box;resize:vertical;min-height:72px;padding:9px 11px;border:1px solid #ddd6fe;border-radius:10px;background:#fff;color:inherit;font:inherit"
      >${esc(w.notes||'')}</textarea>
      <div class="muted" style="font-size:.82em;margin-top:4px">Зберігається автоматично після виходу з поля.</div>
    </div>`);

    extras.push(`<div><b>Папка:</b> ${esc(location||'Без папки')}</div>`);
    extras.push(`<div><b>Правильних відповідей:</b> ${Number(w.correct)||0}</div>`);
    if(w.lastReview)extras.push(`<div><b>Останнє повторення:</b> ${esc(new Date(w.lastReview).toLocaleDateString('uk-UA'))}</div>`);
    return `<div class="word ${expanded?'expanded':''} ${selected?'bulk-selected':''}" data-word-id="${esc(w.id)}">
      <div class="ko">${esc(w.korean)}</div>
      <div class="uk">${esc(w.ukrainian)}</div>
      <div class="en">${esc(w.english||'')}</div>
      <div class="meta">${esc(w.partOfSpeech||'Інше')} · ${esc(wordStatusLabel(w))} · помилок: ${w.mistakes||0}</div>
      ${w.notes?`<div class="notes-preview" style="margin-top:10px">
        <div class="muted" style="font-size:.88em;margin-bottom:4px">📝 Нотатки</div>
        <div class="notes-preview-text" style="white-space:pre-wrap;line-height:1.4">${esc(w.notes)}</div>
      </div>`:''}
      <div class="word-buttons">
        <button class="iconbtn" data-act="speak-word" data-id="${w.id}" title="Вимова">🔊</button>
        <button class="iconbtn fav ${w.favorite?'on':''}" data-act="fav" data-id="${w.id}" title="Обране">${w.favorite?'★':'☆'}</button>
        <button class="iconbtn" data-act="edit-word" data-id="${w.id}" title="Редагувати">✏️</button>
        <button class="iconbtn" data-act="word-menu" data-id="${w.id}" title="Ще">⋯</button>
      </div>
      <div class="levels level-tabs">
        ${[['new','Нове'],['familiar','Знайоме'],['learned','Вивчене']].map(([key,label])=>`<button class="levelbtn ${status===key?'on':''}" data-act="level" data-id="${w.id}" data-level="${key}">${label}</button>`).join('')}
      </div>
      ${expanded?`<div class="word-extra">${extras.join('')}</div>`:''}
    </div>`;
  }).join('')}</div>${state.bulkMove?bulkMoveBarHtml():''}`;
}
function bulkMoveBarHtml(){const n=state.selectedWordIds.length;return `<div class="bulk-bar"><button class="btn secondary" data-act="cancel-bulk-move">Скасувати</button><div><b>${n}</b> вибрано</div><button class="btn primary" data-act="bulk-move-confirm" ${n?'':'disabled'}>Перемістити</button></div>`}
function wordFormView(){const w=words.find(x=>x.id===state.editId)||null,c=w?.collection||state.collection||'topics',topicId=w?.topicId||state.topicId||listFor(c)[0]?.id||'';const opts=topicOptions(c,topicId);const duplicates=w?words.filter(x=>x.id!==w.id&&x.korean.trim()===w.korean.trim()):[];const used=[w,...duplicates].filter(Boolean).map(x=>`${nameFor(x.topicId,x.collection)} (${x.collection==='school'?'School':x.collection==='phrases'?'Фрази':'Duolingo'})`);const usedUnique=[...new Set(used)];return shell(w?'Редагувати слово':'Додати слово',`<form id="wordForm" class="form"><input type="hidden" id="editId" value="${w?.id||''}"><label>Розділ<select id="collection"><option value="topics" ${c==='topics'?'selected':''}>Duolingo</option><option value="school" ${c==='school'?'selected':''}>School</option><option value="phrases" ${c==='phrases'?'selected':''}>Фрази</option><option value="themes" ${c==='themes'?'selected':''}>Теми</option><option value="lingory" ${c==='lingory'?'selected':''}>Lingory</option><option value="airlearn" ${c==='airlearn'?'selected':''}>Airlearn</option></select></label><label>Тема / урок / розділ<select id="topicSelect">${opts}</select></label><label>Корейське слово<input id="ko" required autocomplete="off" value="${esc(w?.korean||'')}"></label><label>Український переклад<input id="uk" required autocomplete="off" value="${esc(w?.ukrainian||'')}"></label><label>Теги<input id="tags" autocomplete="off" placeholder="Наприклад: їжа, урок 5, складні" value="${esc(normalizeTags(w?.tags).join(', '))}"><span class="field-hint">Розділяй теги комами. Вони не показуються на картках.</span></label><label>Частина мови<select id="pos">${['Іменник','Дієслово','Описове дієслово','Прислівник','Фраза','Інше'].map(p=>`<option ${p===(w?.partOfSpeech||'Інше')?'selected':''}>${p}</option>`).join('')}</select></label><button class="btn primary quick-save" type="submit">💾 Зберегти</button><div id="duplicateWarning"></div>${w?`<div class="used-topics"><b>📂 Слово є у темах (${usedUnique.length})</b>${usedUnique.length?`<ul>${usedUnique.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:'<div class="muted">Лише в поточній темі.</div>'}</div>`:''}<div class="autofill-row"><button type="button" class="btn secondary" data-act="auto-fill-word">✨ Заповнити англійською</button><span id="autoFillStatus" class="muted">Англійський переклад визначається з корейського слова.</span></div><details class="advanced-fields" ${w?'open':''}><summary>Додаткові поля</summary><div class="advanced-grid"><label>Англійський переклад<input id="en" value="${esc(w?.english||'')}"></label><label>Приклад корейською<input id="exampleKo" value="${esc(w?.exampleKo||'')}"></label><label>Переклад прикладу<input id="exampleUk" value="${esc(w?.exampleUk||'')}"></label><label>Нотатки<textarea id="notes">${esc(w?.notes||'')}</textarea></label></div></details><button class="btn primary">Зберегти</button></form>`,'form-back')}

function topicFormView(){const c=state.collection,t=listFor(c).find(x=>x.id===state.editTopicId);const parentNote=c==='school'&&!t&&state.schoolParentId?`<div class="notice">Буде створено всередині: <b>${esc(schoolPath(state.schoolParentId).map(x=>x.name).join(' / '))}</b></div>`:'';return shell(t?'Редагувати назву':c==='school'?'Нова папка / урок':c==='phrases'?'Новий розділ фраз':'Нова тема',`${parentNote}<form id="topicForm" class="form"><label>Назва<input id="topicName" required value="${esc(t?.name||'')}"></label><button class="btn primary">${t?'Зберегти':'Додати'}</button></form>`,'topic-form-back')}
function modeView(){
  const mistakesCount=state.studySource.filter(w=>w.mistakes>0).length;
  const mistakesButton=state.studyIsMistakes?'':`<button class="mode mistakes-mode" data-act="mode-mistakes">❌ Повторити помилки<br><small>${mistakesCount} слів</small></button>`;
  const limitedCount=Math.min(20,state.studySource.length);
  const scope=`<div class="training-scope compact-scope"><div class="scope-buttons" role="tablist" aria-label="Кількість слів у циклі"><button class="scope-btn ${state.studyLimit==='all'?'on':''}" data-act="study-limit-all" type="button" role="tab" aria-selected="${state.studyLimit==='all'}">Усі (${state.studySource.length})</button><button class="scope-btn ${state.studyLimit==='20'?'on':''}" data-act="study-limit-20" type="button" role="tab" aria-selected="${state.studyLimit==='20'}">20 випадкових</button></div></div>`;
  return shell('Режим навчання',`<div class="notice">${state.studyTitle||'Набір'} · ${state.studySource.length} слів</div>${scope}<div class="modegrid"><button class="mode" data-mode="flash">🎴 Картки</button><button class="mode" data-mode="choice">✅ Тест із варіантами</button><button class="mode" data-mode="match">🧩 Знайди пари<br><small>6 пар · 12 карток</small></button><button class="mode" data-mode="write-ko">✍️ Написати корейською</button><button class="mode" data-mode="write-uk">✍️ Написати українською</button><button class="mode" data-mode="speaking">🎤 Говоріння</button>${mistakesButton}</div>`,'modes-back')
}
function shuffle(a){return a.slice().sort(()=>Math.random()-.5)}
function prepareMatchRound(){
  const source=state.study.slice(state.matchOffset||0,(state.matchOffset||0)+6).filter(w=>w.korean&&w.ukrainian);
  state.matchRound=source; state.matchSelected=null; state.matchMatched=[]; state.matchWrong=[];
  const ko=source.map(w=>({key:w.id+':ko',wordId:w.id,side:'ko',text:w.korean}));
  let uk=shuffle(source.map(w=>({key:w.id+':uk',wordId:w.id,side:'uk',text:w.ukrainian})));
  // Avoid putting the correct translation directly opposite its Korean card when possible.
  if(source.length>1){
    for(let tries=0;tries<20&&uk.some((c,i)=>c.wordId===ko[i]?.wordId);tries++)uk=shuffle(uk);
    if(uk.some((c,i)=>c.wordId===ko[i]?.wordId))uk=uk.slice(1).concat(uk[0]);
  }
  state.matchCards=[...ko,...uk];
}
function matchStudyView(){
  if(!state.matchRound?.length)return shell('Знайди пари','<div class="empty">Для цього тренування потрібні слова з корейським та українським перекладом.</div>','back-to-modes');
  const roundNo=Math.floor((state.matchOffset||0)/6)+1,total=Math.ceil(state.study.length/6);
  const renderCard=c=>{const matched=state.matchMatched.includes(c.key),wrong=state.matchWrong.includes(c.key),selected=state.matchSelected===c.key;return `<button type="button" class="match-card ${matched?'matched':''} ${wrong?'wrong':''} ${selected?'selected':''}" data-act="match-card" data-key="${esc(c.key)}" ${matched?'disabled':''}>${esc(c.text)}</button>`};
  const ko=state.matchCards.filter(c=>c.side==='ko'),uk=state.matchCards.filter(c=>c.side==='uk');
  return shell(`Знайди пари · ${roundNo} / ${total}`,`<div class="match-help">Знайди ${state.matchRound.length} ${state.matchRound.length===1?'пару':'пар'}: 🇰🇷 корейське слово + 🇺🇦 український переклад</div><div class="match-grid"><div class="match-column match-ko">${ko.map(renderCard).join('')}</div><div class="match-column match-uk">${uk.map(renderCard).join('')}</div></div>`,'back-to-modes');
}
function handleMatchCard(key){
  const card=state.matchCards.find(c=>c.key===key); if(!card)return;
  // In matching mode, every tap on an active Korean card pronounces the word.
  if(card.side==='ko')speak(card.text);
  if(state.matchBusy||state.matchMatched.includes(key))return;
  if(!state.matchSelected){state.matchSelected=key;render();return}
  if(state.matchSelected===key){state.matchSelected=null;render();return}
  const first=state.matchCards.find(c=>c.key===state.matchSelected); if(!first)return;
  // A pair must always be Korean + Ukrainian. Tapping another card in the same column simply changes the selection.
  if(first.side===card.side){state.matchSelected=key;render();return}
  const firstKey=state.matchSelected; const ok=first.wordId===card.wordId; state.matchBusy=true;
  const firstWord=state.matchRound.find(x=>x.id===first.wordId);
  const secondWord=state.matchRound.find(x=>x.id===card.wordId);
  if(ok){
    const w=firstWord||secondWord;
    state.matchMatched.push(firstKey,key); state.matchSelected=null; state.matchBusy=false;
    // If this word was missed earlier in the current matching session, keep it in
    // “Повторити помилки” even after the learner eventually finds the correct pair.
    // The correct answer still increases its learning progress normally.
    mark(w,true,{preserveMistakes:(state.matchMistakeWordIds||[]).includes(w?.id)}); render();
    if(state.matchMatched.length===state.matchRound.length*2)setTimeout(()=>{
      state.matchOffset=(state.matchOffset||0)+6;
      if(state.matchOffset>=state.study.length){state.matchBusy=false;alert('🎉 Усі пари знайдено!');setView('modes')}
      else{prepareMatchRound();state.matchBusy=false;render()}
    },650);
  }else{
    // A wrong pair contains TWO different dictionary words. Count the attempt for
    // both of them so both cards use the same mistakes/progress mechanism as the
    // other training modes. Every real wrong attempt counts after the red state ends.
    state.matchMistakeWordIds=state.matchMistakeWordIds||[];
    [firstWord,secondWord].filter(Boolean).forEach(w=>{
      if(!state.matchMistakeWordIds.includes(w.id))state.matchMistakeWordIds.push(w.id);
      mark(w,false);
    });
    state.matchWrong=[firstKey,key]; render();
    setTimeout(()=>{state.matchWrong=[];state.matchSelected=null;state.matchBusy=false;render()},700);
  }
}
function studyView(){if(state.mode==='match')return matchStudyView();const w=state.study[state.index];if(!w)return shell('Тренування','<div class="empty">Немає слів для тренування.</div>','back-to-modes');if(state.mode==='flash')return shell(`${state.index+1} / ${state.study.length}`,`<div id="flash" class="flash"><div class="inner"><div class="face front"><div><div class="cardword">${esc(w.korean)}</div><div class="sub">${esc(w.partOfSpeech||'')}</div></div><div class="hint">Натисни, щоб перевернути</div></div><div class="face backface"><div><div class="cardword">${esc(w.ukrainian)}</div><div class="sub">${esc(w.english||'')}</div><div class="example">${esc(w.exampleKo?`${w.exampleKo} — ${w.exampleUk}`:'')}</div></div><div class="hint">Натисни, щоб повернути</div></div></div></div><div class="studycontrols"><button class="btn danger" data-result="wrong">Не пам’ятаю</button><button class="btn secondary" data-act="speak">🔊 Слухати</button><button class="btn primary" data-result="right">Знаю</button></div>`,'back-to-modes');if(state.mode==='choice'){const pool=words.filter(x=>x.id!==w.id),opts=shuffle([w,...shuffle(pool).slice(0,3)]);return shell(`${state.index+1} / ${state.study.length}`,`<div class="quizbox"><div class="muted">Оберіть переклад</div><div class="question">${esc(w.korean)}</div><button class="listen-test" data-act="speak" type="button">🔊 Слухати</button><div class="answers">${opts.map(o=>`<button class="answer" data-choice="${o.id}">${esc(o.ukrainian)}</button>`).join('')}</div><div class="muted">Правильна відповідь прибирає слово з помилок і невивчених.</div></div>`,'back-to-modes')}if(state.mode==='speaking')return shell(`${state.index+1} / ${state.study.length}`,`<div class="quizbox speaking-box"><div class="muted">Вимов корейською</div><div class="question">${esc(w.ukrainian)}</div><div id="speechCard" class="speech-card"><div id="speechPrompt">🎤 Слухаю… Скажи слово корейською.</div><div id="speechResult" class="speech-result"></div></div><div class="speaking-controls"><button class="btn secondary" data-act="show-speaking-answer">👁 Показати відповідь</button><button class="btn secondary" data-act="skip-speaking">⏭ Пропустити</button></div></div>`,'back-to-modes');const askKo=state.mode==='write-ko';return shell(`${state.index+1} / ${state.study.length}`,`<div class="quizbox write-quiz"><div class="muted">${askKo?'Напишіть корейською':'Напишіть українською'}</div><div class="question">${esc(askKo?w.ukrainian:w.korean)}</div><button class="listen-test" data-act="speak" type="button">🔊 ${askKo?'Прослухати корейське слово':'Слухати'}</button><form id="writeForm" class="form"><input id="writeAnswer" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="Введіть відповідь"><button id="checkWrittenButton" class="btn primary" type="submit">Перевірити</button></form><div id="writeResult" class="write-result" aria-live="polite"></div></div>`,'back-to-modes')}
function statsView(){const total=words.length,learned=words.filter(w=>(Number(w.learningProgress)||0)>=3).length,fav=words.filter(w=>w.favorite).length,mist=words.reduce((s,w)=>s+(w.mistakes||0),0),correct=words.reduce((s,w)=>s+(w.correct||0),0),attempts=correct+mist,accuracy=attempts?Math.round(correct/attempts*100):0,pct=total?Math.round(learned/total*100):0;let blocks='';[...topics.map(t=>[t,'topics']),...school.map(t=>[t,'school']),...phrases.map(t=>[t,'phrases'])].forEach(([t,c])=>{const arr=words.filter(w=>w.collection===c&&w.topicId===t.id);if(!arr.length)return;const l=arr.filter(w=>(Number(w.learningProgress)||0)>=3).length,p=Math.round(l/arr.length*100);blocks+=`<div class="topic"><div><div class="topic-name">${esc(t.name)}</div><div class="count">${l} із ${arr.length} · ${p}%</div><div class="bar"><span style="width:${p}%"></span></div></div></div>`});return shell('Статистика',`<div class="statsgrid"><div class="stat"><strong>${total}</strong>слів</div><div class="stat"><strong>${learned}</strong>вивчено</div><div class="stat"><strong>${correct}</strong>правильно</div><div class="stat"><strong>${mist}</strong>помилок</div></div><h3>Точність відповідей</h3><div>${accuracy}% · ${attempts} відповідей</div><div class="bar"><span style="width:${accuracy}%"></span></div><h3>Загальний прогрес</h3><div>${pct}% · обраних: ${fav}</div><div class="bar"><span style="width:${pct}%"></span></div><h3>За темами</h3><div class="list">${blocks||'<div class="empty">Статистика з’явиться після навчання.</div>'}</div>`,'home')}
function dataToolsView(){return shell('Резервна копія',`<div class="notice">Експорт зберігає теми, School, фрази, усі слова, обране, рівні та статистику.</div><div class="actions"><button class="btn primary" data-act="export-json">⬇️ Експорт JSON</button><button class="btn secondary" data-act="choose-import">⬆️ Імпорт JSON</button></div><input id="importFile" type="file" accept="application/json,.json" hidden><div class="warning">Під час імпорту поточні дані буде замінено даними з файлу. Перед імпортом бажано зробити експорт.</div>`,'home')}
function topicOptions(c,selected){return topicOptionsForFilter(c).map(t=>`<option value="${esc(t.id)}" ${t.id===selected?'selected':''}>${esc(t.name)}</option>`).join('')}
function photoImportView(){
  const c=state.collection||'topics',tid=state.topicId||listFor(c)[0]?.id||'';
  return shell('Додати слова з фото',`
    <div class="notice">Найкраще працюють чіткі фото таблиць або списків. Після розпізнавання перевір і за потреби відредагуй записи перед додаванням.</div>

    <div class="form">
      <label>Розділ
        <select id="ocrCollection">
          <option value="topics" ${c==='topics'?'selected':''}>Теми</option>
          <option value="school" ${c==='school'?'selected':''}>School</option>
          <option value="phrases" ${c==='phrases'?'selected':''}>Фрази</option>
        </select>
      </label>

      <label>Тема / урок / розділ
        <select id="ocrTopic">${topicOptions(c,tid)}</select>
      </label>

      <label>Режим розпізнавання
        <select id="ocrImportMode">
          <option value="ko-uk">🇰🇷 Корейська → 🇺🇦 Українська</option>
          <option value="ko-ko">🇰🇷 Корейська → 🇰🇷 Корейська</option>
        </select>
      </label>

      <div class="notice">
        <b>Корейська → Корейська</b> зручно для відмінювання та форм слів:
        перше слово піде в поле «Корейська», друге — у поле «Українська», але залишиться корейською.
      </div>

      <div class="ocr-source">
        <div class="ocr-source-title">Додати зображення</div>
        <div class="actions two">
          <label class="btn secondary file-btn">📷 Сфотографувати
            <input id="ocrCamera" type="file" accept="image/*" capture="environment" hidden>
          </label>
          <label class="btn secondary file-btn">🖼️ Обрати з галереї
            <input id="ocrGallery" type="file" accept="image/*" hidden>
          </label>
        </div>
        <div id="ocrFileName" class="file-name">Зображення ще не вибрано</div>
      </div>

      <button class="btn primary" data-act="run-ocr">🔎 Розпізнати зображення</button>
      <div id="ocrProgress" class="notice" hidden></div>

      <label>Розпізнані записи
        <textarea id="ocrVerified" class="ocr-text ocr-records"
          placeholder="Після розпізнавання тут з’явиться список. Його можна редагувати вручну.&#10;&#10;Корейська → Українська:&#10;1. 학교 — школа&#10;&#10;Корейська → Корейська:&#10;1. 나쁘다 — 나빠요"></textarea>
      </label>

      <div class="notice">
        Один запис на рядок. Для режиму <b>Корейська → Корейська</b> формат:
        <b>기본형 — 활용형</b>, наприклад <b>나쁘다 — 나빠요</b>.
      </div>

      <div id="ocrVerifiedStatus" class="notice" hidden></div>
      <button class="btn primary" data-act="save-ocr" style="margin-top:12px">Додати розпізнані слова</button>
    </div>
  `,'photo-back')
}
function isHangulQuery(value){return /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u.test((value||'').trim().charAt(0))}
function isSearchReady(value){const text=(value||'').trim();if(!text)return true;return isHangulQuery(text)||[...text].length>=2}
function librarySearchBase(){return state.view==='mistakesLibrary'?words.filter(w=>w.mistakes>0):words}
function updateLibrarySearchResults(value){
  state.libraryQuery=isSearchReady(value)?value:'';
  const filtered=applyLibraryFilters(librarySearchBase());
  const list=$('#libraryWords');if(list)list.innerHTML=wordList(filtered);
  const count=$('#filteredCount');if(count)count.textContent=String(filtered.length);
}
function updateDetailSearchResults(value){
  state.detailSearch=isSearchReady(value)?value:'';
  const allArr=state.collection==='school'?schoolWordsFor(state.topicId):words.filter(w=>w.collection===state.collection&&w.topicId===state.topicId);
  const q=(state.detailSearch||'').toLocaleLowerCase('uk-UA').trim();
  const filtered=q?allArr.filter(w=>(w.korean+' '+w.ukrainian+' '+(w.english||'')).toLocaleLowerCase('uk-UA').includes(q)):allArr;
  const list=$('#detailWords');if(list)list.innerHTML=wordList(filtered);
}
function bindLiveSearch(input,update){
  if(!input)return;
  let composing=false,timer=null;
  input.addEventListener('compositionstart',()=>{composing=true});
  input.addEventListener('compositionend',()=>{composing=false;clearTimeout(timer);update(input.value)});
  input.addEventListener('input',()=>{
    if(composing)return;
    clearTimeout(timer);
    const value=input.value;
    timer=setTimeout(()=>update(value),120);
  });
}
function bind(){app.onclick=handleClick; const loginForm = document.getElementById('loginForm');

if(loginForm){
  loginForm.onsubmit = async e => {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value || '';

    try{
      await signInToSupabase(email, password);
      render();
    }catch(error){
      console.error(error);
      alert('Не вдалося увійти: ' + error.message);
    }
  };

  updateAuthUI().catch(console.error);
}
  setupTopicSorting();setupWordMenuDismiss();
  bindLiveSearch($('#search'),updateLibrarySearchResults);
  bindLiveSearch($('#detailSearch'),updateDetailSearchResults);

  document.querySelectorAll('.inline-notes').forEach(field=>{
    field.addEventListener('click',e=>e.stopPropagation());
    field.addEventListener('pointerdown',e=>e.stopPropagation());
    field.addEventListener('keydown',e=>e.stopPropagation());
    field.addEventListener('blur',()=>{
      const w=words.find(x=>x.id===field.dataset.wordId);
      if(!w)return;
      const next=field.value.trim();
      if((w.notes||'')===next)return;
      w.notes=next;
      save();
    });
  });

  const wf=$('#wordForm');if(wf)wf.onsubmit=saveWord;const ko=$('#ko'),uk=$('#uk');if(ko){let timer;const schedule=()=>{clearTimeout(timer);checkDuplicateWord();inferPartOfSpeech();if(ko.value.trim())timer=setTimeout(()=>autoFillWord(false),650)};ko.addEventListener('input',schedule);ko.addEventListener('blur',()=>{checkDuplicateWord();inferPartOfSpeech();if(ko.value.trim())autoFillWord(false)});if(uk)uk.addEventListener('input',checkDuplicateWord);checkDuplicateWord()}const tf=$('#topicForm');if(tf)tf.onsubmit=saveTopic;const col=$('#collection');if(col)col.onchange=()=>{state.collection=col.value;$('#topicSelect').innerHTML=topicOptions(col.value,'');inferPartOfSpeech()};const fcol=$('#filterCollection');if(fcol)fcol.onchange=()=>{state.libraryCollection=fcol.value;state.libraryTopic='';filterLibrary()};const ftopic=$('#filterTopic');if(ftopic)ftopic.onchange=filterLibrary;const fl=$('#filterLevel');if(fl)fl.onchange=filterLibrary;const ft=$('#filterTag');if(ft)ft.onchange=filterLibrary;const sort=$('#sortWords');if(sort)sort.onchange=filterLibrary;const wf2=$('#writeForm');if(wf2)wf2.onsubmit=checkWritten;const imp=$('#importFile');if(imp)imp.onchange=importJson;const oc=$('#ocrCollection');if(oc)oc.onchange=()=>{$('#ocrTopic').innerHTML=topicOptions(oc.value,'')};const cam=$('#ocrCamera'),gal=$('#ocrGallery'),fileName=$('#ocrFileName');const chooseOcrFile=(source,other)=>{if(!source?.files?.[0])return;if(other)other.value='';if(fileName)fileName.textContent=`Вибрано: ${source.files[0].name}`};if(cam)cam.onchange=()=>chooseOcrFile(cam,gal);if(gal)gal.onchange=()=>chooseOcrFile(gal,cam)}
function setupScrollUi(){
  let btn=document.getElementById('scrollTopBtn');
  const allowed=['library','mistakesLibrary','detail'].includes(state.view);
  if(!allowed){btn?.remove();return}
  if(!btn){btn=document.createElement('button');btn.id='scrollTopBtn';btn.className='scroll-top-btn';btn.type='button';btn.textContent='↑';btn.title='Догори';btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));document.body.appendChild(btn)}
  btn.style.bottom=state.bulkMove?'calc(84px + env(safe-area-inset-bottom))':'';const update=()=>btn.classList.toggle('show',window.scrollY>500);
  update();
}
function collapseExpandedCard(){if(!state.expandedWordId)return;state.expandedWordId=null;document.querySelector('.word.expanded')?.classList.remove('expanded');const extra=document.querySelector('.word-extra');extra?.remove()}
function setupWordMenuDismiss(){
  if(document.documentElement.dataset.wordMenuDismissBound==='1')return;
  document.documentElement.dataset.wordMenuDismissBound='1';
  document.addEventListener('pointerdown',e=>{const pop=document.getElementById('wordActionPopover');if(!pop)return;if(pop.contains(e.target))return;if(e.target.closest?.('[data-act="word-menu"]'))return;closeWordPopover()},true);
  window.addEventListener('scroll',()=>{closeWordPopover();collapseExpandedCard();document.getElementById('scrollTopBtn')?.classList.toggle('show',window.scrollY>500)},{passive:true,capture:true});
}
function openWordMenu(id,anchor){
  const existing=document.getElementById('wordActionPopover');
  if(existing?.dataset.wordId===String(id)){closeWordPopover();return}
  closeWordPopover();const w=words.find(x=>x.id===id);if(!w)return;
  const pop=document.createElement('div');pop.id='wordActionPopover';pop.className='word-popover';pop.dataset.wordId=String(id);
  pop.innerHTML=`<button data-act="move-word" data-id="${esc(id)}">📂 Перемістити</button><button data-act="clone-word" data-id="${esc(id)}">📄 Клонувати</button><button class="danger-item" data-act="delete-word" data-id="${esc(id)}">🗑️ Видалити</button>`;
  document.body.appendChild(pop);pop.onclick=handleClick;const r=anchor.getBoundingClientRect(),width=210;pop.style.left=Math.max(10,Math.min(window.innerWidth-width-10,r.right-width))+'px';pop.style.top=Math.min(window.innerHeight-pop.offsetHeight-10,r.bottom+6)+'px';
}
function closeWordPopover(){document.getElementById('wordActionPopover')?.remove()}
function openMoveChoice(id){
  closeWordPopover();document.getElementById('wordDestinationModal')?.remove();
  const w=words.find(x=>x.id===id);if(!w)return;
  const modal=document.createElement('div');modal.id='wordDestinationModal';modal.className='modal-backdrop';
  modal.innerHTML=`<div class="destination-modal compact-modal"><div class="destination-head"><div><b>Перемістити</b><div class="muted">${esc(w.korean)} — ${esc(w.ukrainian)}</div></div><button class="modal-close" data-act="close-word-modal">×</button></div><div class="move-choice"><button class="destination-item" data-act="move-one" data-id="${esc(id)}">Одне слово</button><button class="destination-item" data-act="move-many" data-id="${esc(id)}">Декілька слів</button></div></div>`;
  document.body.appendChild(modal);modal.onclick=handleClick;
}
function startBulkMove(id){document.getElementById('wordDestinationModal')?.remove();state.bulkMove=true;state.selectedWordIds=id?[id]:[];state.expandedWordId=null;render()}
function cancelBulkMove(){state.bulkMove=false;state.selectedWordIds=[];render()}
function destinationRootHtml(){return `<div class="destination-browser"><button class="destination-item folder-nav" data-act="destination-open-collection" data-c="topics">🦉 Duolingo <span>›</span></button><button class="destination-item folder-nav" data-act="destination-open-collection" data-c="school">🎓 School <span>›</span></button></div>`}
function destinationLevelHtml(collection,parentId=null){
  const list=collection==='school'?schoolChildren(parentId):topics;
  const path=collection==='school'&&parentId?schoolPath(parentId):[];
  let html=`<div class="destination-breadcrumb"><button class="smallbtn" data-act="destination-back">← Назад</button><b>${collection==='school'?'School':'Duolingo'}${path.length?' / '+esc(path.map(x=>x.name).join(' / ')):''}</b></div>`;
  if(collection==='school'&&parentId)html+=`<button class="btn primary destination-here" data-act="destination-here" data-c="school" data-topic="${esc(parentId)}">${destinationContext?.mode==='clone'?'Клонувати':'Перемістити'} сюди</button>`;
  html+=`<div class="destination-browser">${list.map(item=>collection==='school'?`<button class="destination-item folder-nav" data-act="destination-open-folder" data-c="school" data-topic="${esc(item.id)}">📁 ${esc(item.name)} <span>›</span></button>`:`<button class="destination-item" data-act="destination-here" data-c="topics" data-topic="${esc(item.id)}">${esc(item.name)}</button>`).join('')||'<div class="empty">Папок немає.</div>'}</div>`;
  return html;
}
function openWordDestination(id,mode,ids=null){
  closeWordPopover();const selected=ids?.length?ids:[id];if(!selected.length)return;
  destinationContext={mode,ids:selected,collection:null,parentId:null};
  document.getElementById('wordDestinationModal')?.remove();const modal=document.createElement('div');modal.id='wordDestinationModal';modal.className='modal-backdrop';
  const label=mode==='clone'?'Клонувати':selected.length>1?`Перемістити ${selected.length} слів`:'Перемістити';
  modal.innerHTML=`<div class="destination-modal"><div class="destination-head"><div><b>${label}</b><div class="muted">Оберіть розділ, потім потрібну папку.</div></div><button class="modal-close" data-act="close-word-modal">×</button></div><div id="destinationContent" class="destination-list">${destinationRootHtml()}</div></div>`;
  document.body.appendChild(modal);modal.onclick=handleClick;
}
function renderDestinationLevel(){const box=document.getElementById('destinationContent');if(!box||!destinationContext)return;box.innerHTML=destinationContext.collection?destinationLevelHtml(destinationContext.collection,destinationContext.parentId):destinationRootHtml()}
function destinationBack(){if(!destinationContext)return;if(destinationContext.collection==='school'&&destinationContext.parentId){const node=school.find(x=>x.id===destinationContext.parentId);destinationContext.parentId=node?.parentId??null;renderDestinationLevel()}else{destinationContext.collection=null;destinationContext.parentId=null;renderDestinationLevel()}}
function moveOrCloneWords(ids,mode,collection,topicId){
  const moving=words.filter(x=>ids.includes(x.id));if(!moving.length)return;
  if(mode==='move'){moving.forEach(w=>{w.collection=collection;w.topicId=topicId})}
  else{moving.forEach(w=>{const copy=normalizeWord({id:uid(),collection,topicId,korean:w.korean,ukrainian:w.ukrainian,english:w.english||'',partOfSpeech:w.partOfSpeech||'Інше',exampleKo:w.exampleKo||'',exampleUk:w.exampleUk||'',notes:w.notes||'',tags:[...normalizeTags(w.tags)],favorite:false,learningProgress:0,manualStatus:'new',mistakes:0,correct:0,lastReview:'',createdAt:new Date().toISOString()});words.push(copy)})}
  save();document.getElementById('wordDestinationModal')?.remove();destinationContext=null;state.bulkMove=false;state.selectedWordIds=[];state.expandedWordId=null;
  state.studySource=[];state.study=[];state.studyTitle='';state.studyIsMistakes=false;state.index=0;
  render();
}
function setManualWordStatus(w,status){
  if(!w)return;
  if(status==='new'){w.learningProgress=0;w.manualStatus='new'}
  else if(status==='familiar'){w.learningProgress=0;w.manualStatus='familiar'}
  else if(status==='learned'){w.learningProgress=3;w.manualStatus=null}
  syncLegacyLevel(w);save();render();
}
function handleClick(e){if(e.target.closest('.inline-notes'))return;const flash=e.target.closest('#flash');if(flash){flash.classList.toggle('flipped');return}const b=e.target.closest('button');const card=e.target.closest('.word[data-word-id]');if(state.bulkMove&&card){const id=card.dataset.wordId;state.selectedWordIds=state.selectedWordIds.includes(id)?state.selectedWordIds.filter(x=>x!==id):[...state.selectedWordIds,id];render();return}if(!b){if(card){const id=card.dataset.wordId;state.expandedWordId=state.expandedWordId===id?null:id;render()}return}const a=b.dataset.act;
  if(a==='home'){state.bulkMove=false;state.selectedWordIds=[];state.expandedWordId=null;setView('home');} else if(a==='start')openModes(words,'Усі слова','home',false); else if(a==='topics')setView('topics'); else if(a==='themes')setView('themes'); else if(a==='more')setView('more'); else if(a==='lingory')setView('lingory'); else if(a==='airlearn')setView('airlearn'); else if(a==='school'){state.schoolParentId=null;setView('school')} else if(a==='phrases')setView('phrases'); else if(a==='library')setView('library'); else if(a==='stats')setView('stats'); else if(a==='data-tools')setView('dataTools');
  else if(a==='start-all')openModes(words,'Усі слова','home',false); else if(a==='favorites')openModes(words.filter(w=>w.favorite),'Обране','home',false); else if(a==='mistakes')setView('mistakesLibrary');
  else if(a==='open-profile'){openProfileModal()}
  else if(a==='match-card'){handleMatchCard(b.dataset.key)}
  else if(a==='share-folder'){openShareFolderModal()}
  else if(a==='set-theme'){localStorage.setItem(APP_THEME_KEY,b.dataset.theme==='pink'?'pink':'purple');applyAppTheme();render()}
  else if(a==='change-password'){openPasswordModal()}
  else if(a==='logout'){
  document.getElementById('profileModal')?.remove();
  logoutFromSupabase().then(()=>render()).catch(error=>{
    console.error(error);
    alert('Не вдалося вийти: ' + error.message);
  });
}
  else if(a==='open-topic'){state.collection=b.dataset.c;state.topicId=b.dataset.id;state.detailSearch='';setView('detail')} else if(a==='quick-add'){state.collection=b.dataset.c;state.topicId=b.dataset.id;state.editId=null;state.returnView=collectionViewName(state.collection);setView('wordForm')}
  else if(a==='new-topic'){state.collection=b.dataset.c;state.returnView=collectionViewName(state.collection);state.editTopicId=null;setView('topicForm')} else if(a==='new-subtopic'){state.collection='school';state.schoolParentId=state.topicId;state.returnTopicId=state.topicId;state.returnView='detail';state.editTopicId=null;setView('topicForm')} else if(a==='edit-topic'){state.collection=b.dataset.c;state.returnView=state.view;state.returnTopicId=state.topicId;state.editTopicId=b.dataset.id;setView('topicForm')} else if(a==='move-topic')moveTopic(b.dataset.c,b.dataset.id,b.dataset.dir); else if(a==='promote-folder')promoteSchoolFolder(b.dataset.id); else if(a==='delete-folder')deleteSchoolFolder(b.dataset.id);
  else if(a==='detail-parent'){const node=school.find(x=>x.id===state.topicId);if(node?.parentId){state.topicId=node.parentId;state.schoolParentId=school.find(x=>x.id===state.topicId)?.parentId??null;state.detailSearch='';setView('detail')}else{state.schoolParentId=null;setView('school')}} else if(a==='back-collection'){if(state.collection==='school'){const node=school.find(x=>x.id===state.topicId);state.schoolParentId=node?.parentId??null;setView('school')}else setView(collectionViewName(state.collection))} else if(a==='school-up'){const node=school.find(x=>x.id===state.schoolParentId);state.schoolParentId=node?.parentId??null;setView('school')} else if(a==='study-topic'){const source=state.collection==='school'?schoolWordsFor(state.topicId):words.filter(w=>w.collection===state.collection&&w.topicId===state.topicId);openModes(source,nameFor(state.topicId,state.collection),'detail',false)} else if(a==='study-topic-mistakes'){const source=(state.collection==='school'?schoolWordsFor(state.topicId):words.filter(w=>w.collection===state.collection&&w.topicId===state.topicId)).filter(w=>w.mistakes>0);openModes(source,`Помилки · ${nameFor(state.topicId,state.collection)}`,'detail',true)} else if(a==='add-word-topic'){state.editId=null;state.returnView='detail';setView('wordForm')}
  else if(a==='add-word'){state.collection='topics';state.topicId=topics[0]?.id;state.editId=null;state.returnView='library';setView('wordForm')} else if(a==='edit-word'){const w=words.find(x=>x.id===b.dataset.id);state.editId=w.id;state.collection=w.collection;state.topicId=w.topicId;state.returnView=state.view;state.returnScrollY=window.scrollY;setView('wordForm')}
  else if(a==='word-menu')openWordMenu(b.dataset.id,b)
  else if(a==='move-word')openMoveChoice(b.dataset.id)
  else if(a==='clone-word')openWordDestination(b.dataset.id,'clone')
  else if(a==='close-word-modal'){document.getElementById('wordDestinationModal')?.remove();destinationContext=null}
  else if(a==='move-one')openWordDestination(b.dataset.id,'move')
  else if(a==='move-many')startBulkMove(b.dataset.id)
  else if(a==='cancel-bulk-move')cancelBulkMove()
  else if(a==='bulk-move-confirm')openWordDestination(state.selectedWordIds[0],'move',state.selectedWordIds)
  else if(a==='destination-open-collection'){destinationContext.collection=b.dataset.c;destinationContext.parentId=null;renderDestinationLevel()}
  else if(a==='destination-open-folder'){destinationContext.collection='school';destinationContext.parentId=b.dataset.topic;renderDestinationLevel()}
  else if(a==='destination-back')destinationBack()
  else if(a==='destination-here')moveOrCloneWords(destinationContext?.ids||[],destinationContext?.mode||'move',b.dataset.c,b.dataset.topic)
  else if(a==='delete-word'){closeWordPopover();if(confirm('Видалити це слово?')){words=words.filter(x=>x.id!==b.dataset.id);save();render()}}
  else if(a==='fav'){const w=words.find(x=>x.id===b.dataset.id);w.favorite=!w.favorite;save();render()}
  else if(a==='level'){const w=words.find(x=>x.id===b.dataset.id);setManualWordStatus(w,b.dataset.level)}
  else if(a==='form-back'){const y=state.returnScrollY;state.returnScrollY=null;setView(state.returnView||'library',y);} else if(a==='topic-form-back'){if(state.collection==='school'&&state.returnView==='detail'){state.topicId=state.returnTopicId||state.schoolParentId;setView('detail')}else setView(state.collection==='school'?'school':state.collection==='phrases'?'phrases':'topics')} else if(a==='modes-back')setView(state.trainingReturnView||'home'); else if(a==='back-to-modes')setView('modes'); else if(a==='auto-fill-word')autoFillWord(true); else if(a==='train-filtered'){captureLibraryFilters();const isMistakes=state.view==='mistakesLibrary';const base=isMistakes?words.filter(w=>w.mistakes>0):words;openModes(applyLibraryFilters(base),isMistakes?'Відфільтровані помилки':'Відфільтровані слова',state.view,isMistakes)} else if(a==='study-limit-all'){state.studyLimit='all';render()} else if(a==='study-limit-20'){state.studyLimit='20';render()} else if(a==='mode-mistakes')activateMistakesMode();  else if(a==='speak-mistake'){const w=state.study[state.index];if(w)speak(w.korean)} else if(a==='retry-speaking')retrySpeaking(); else if(a==='accept-speaking')acceptSpeakingAsCorrect(); else if(a==='start-speaking')startSpeaking(); else if(a==='show-speaking-answer')finishSpeaking(false,'Відповідь показано'); else if(a==='skip-speaking')finishSpeaking(false,'Пропущено'); else if(a==='next-speaking'||a==='next-written')nextStudy(); else if(a==='force-update')forceUpdate(); else if(a==='speak')speak(state.study[state.index].korean); else if(a==='speak-note'){const w=words.find(x=>x.id===b.dataset.id);if(w)speakNote(w.notes)} else if(a==='speak-word'){const w=words.find(x=>x.id===b.dataset.id);if(w)speak(w.korean)}
  else if(a==='export-json')exportJson(); else if(a==='choose-import')$('#importFile')?.click();
  else if(a==='photo-import'||a==='photo-import-topic'||a==='photo-import-collection'){if(a==='photo-import'){state.collection='topics';state.topicId=topics[0]?.id||''}if(a==='photo-import-collection'){state.collection=b.dataset.c;state.topicId=listFor(state.collection)[0]?.id||''}state.returnView=state.view;setView('photoImport')} else if(a==='photo-back')setView(state.returnView||'library'); else if(a==='run-ocr')runOcr(); else if(a==='save-ocr')saveOcrWords();
  if(b.dataset.mode)startMode(b.dataset.mode);
  if(b.dataset.result){
    const w=state.study[state.index],ok=b.dataset.result==='right';
    playResultSound(ok);mark(w,ok);
    if(!ok){addMistakeListenButton(document.querySelector('.studycontrols'));speakMistakeWord(w.korean,nextStudy)}
    else setTimeout(nextStudy,450);
  }
  if(b.dataset.choice){
    const w=state.study[state.index],ok=b.dataset.choice===w.id;
    b.classList.add(ok?'good':'bad');playResultSound(ok);mark(w,ok);
    document.querySelectorAll('.answer').forEach(x=>x.disabled=true);
    if(!ok){
      const right=[...document.querySelectorAll('.answer')].find(x=>x.dataset.choice===w.id);
      right?.classList.add('good');
      addMistakeListenButton(document.querySelector('.quizbox'));
      speakMistakeWord(w.korean,()=>setTimeout(nextStudy,250));
    }else setTimeout(nextStudy,850);
  }
}
function moveTopic(c,id,dir){const full=listFor(c),item=full.find(t=>t.id===id);if(!item)return;const siblings=c==='school'?schoolChildren(item.parentId):full;const i=siblings.findIndex(t=>t.id===id),j=dir==='up'?i-1:i+1;if(i<0||j<0||j>=siblings.length)return;const a=full.indexOf(siblings[i]),b=full.indexOf(siblings[j]);[full[a],full[b]]=[full[b],full[a]];save();render()}
let draggedTopicId=null;
function canNestSchoolFolder(sourceId,targetId){return sourceId&&targetId&&sourceId!==targetId&&!schoolDescendantIds(sourceId).includes(targetId)}
function reorderSchoolFolder(sourceId,targetId,position='before'){
  const source=school.find(t=>t.id===sourceId),target=school.find(t=>t.id===targetId);
  if(!source||!target||source.id===target.id||source.parentId!==target.parentId)return false;
  const from=school.findIndex(t=>t.id===sourceId);
  if(from<0)return false;
  const [moved]=school.splice(from,1);
  let to=school.findIndex(t=>t.id===targetId);
  if(to<0){school.splice(from,0,moved);return false}
  if(position==='after')to+=1;
  school.splice(to,0,moved);
  save();render();return true;
}
function nestSchoolFolder(sourceId,targetId,ask=true){
  if(!canNestSchoolFolder(sourceId,targetId))return false;
  const moved=school.find(t=>t.id===sourceId),target=school.find(t=>t.id===targetId);
  if(!moved||!target)return false;
  if(ask&&!confirm(`Перемістити папку «${moved.name}» всередину «${target.name}»?`))return false;
  moved.parentId=targetId;save();render();return true;
}
function clearFolderDropMarks(){document.querySelectorAll('.drag-over,.drag-sort-before,.drag-sort-after').forEach(x=>x.classList.remove('drag-over','drag-sort-before','drag-sort-after'))}
function schoolDropIntent(sourceId,targetEl,clientY){
  const targetId=targetEl?.dataset.topicId,source=school.find(t=>t.id===sourceId),target=school.find(t=>t.id===targetId);
  if(!source||!target||sourceId===targetId)return null;
  const r=targetEl.getBoundingClientRect(),ratio=r.height?Math.max(0,Math.min(1,(clientY-r.top)/r.height)):.5;
  if(source.parentId===target.parentId){
    if(ratio<.35)return {type:'sort',position:'before',targetId};
    if(ratio>.65)return {type:'sort',position:'after',targetId};
  }
  if(canNestSchoolFolder(sourceId,targetId))return {type:'nest',targetId};
  return null;
}
function promoteSchoolFolder(id){const moved=school.find(t=>t.id===id);if(!moved||!moved.parentId)return false;const parent=school.find(t=>t.id===moved.parentId);moved.parentId=parent?.parentId??null;save();render();return true}
function deleteSchoolFolder(id){const folder=school.find(t=>t.id===id);if(!folder)return false;const ids=schoolDescendantIds(id),idSet=new Set(ids),wordCount=words.filter(w=>w.collection==='school'&&idSet.has(w.topicId)).length,childCount=Math.max(0,ids.length-1);let msg=`Видалити папку «${folder.name}»?`;if(childCount||wordCount)msg+=`\n\nРазом з нею буде видалено: ${childCount} вкладених папок і ${wordCount} слів.`;msg+='\n\nЦю дію не можна скасувати.';if(!confirm(msg))return false;words=words.filter(w=>!(w.collection==='school'&&idSet.has(w.topicId)));school=school.filter(t=>!idSet.has(t.id));if(state.topicId&&idSet.has(state.topicId)){const parentId=folder.parentId??null;state.topicId=parentId;state.schoolParentId=parentId?school.find(x=>x.id===parentId)?.parentId??null:null;state.view=parentId?'detail':'school'}if(state.schoolParentId&&idSet.has(state.schoolParentId))state.schoolParentId=null;save();render();return true}
function setupTopicSorting(){
  document.querySelectorAll('.sortable-topic').forEach(el=>{
    el.addEventListener('dragstart',e=>{draggedTopicId=el.dataset.topicId;el.classList.add('dragging');e.dataTransfer?.setData('text/plain',draggedTopicId);if(e.dataTransfer)e.dataTransfer.effectAllowed='move'});
    el.addEventListener('dragend',()=>{el.classList.remove('dragging');clearFolderDropMarks();draggedTopicId=null});
    el.addEventListener('dragover',e=>{
      e.preventDefault();clearFolderDropMarks();
      const sourceId=draggedTopicId||e.dataTransfer?.getData('text/plain');
      if(!sourceId||el.dataset.topicId===sourceId)return;
      if(el.dataset.c!=='school'){el.classList.add('drag-over');return}
      const intent=schoolDropIntent(sourceId,el,e.clientY);
      if(intent?.type==='sort')el.classList.add(intent.position==='before'?'drag-sort-before':'drag-sort-after');
      else if(intent?.type==='nest')el.classList.add('drag-over');
    });
    el.addEventListener('dragleave',()=>el.classList.remove('drag-over','drag-sort-before','drag-sort-after'));
    el.addEventListener('drop',e=>{
      e.preventDefault();
      const sourceId=draggedTopicId||e.dataTransfer?.getData('text/plain'),targetId=el.dataset.topicId,c=el.dataset.c;
      const intent=c==='school'?schoolDropIntent(sourceId,el,e.clientY):null;
      clearFolderDropMarks();
      if(!sourceId||sourceId===targetId)return;
      if(c==='school'){
        if(intent?.type==='sort')reorderSchoolFolder(sourceId,targetId,intent.position);
        else if(intent?.type==='nest')nestSchoolFolder(sourceId,targetId,true);
        return;
      }
      const list=listFor(c),from=list.findIndex(t=>t.id===sourceId),to=list.findIndex(t=>t.id===targetId);
      if(from<0||to<0)return;const [moved]=list.splice(from,1);list.splice(to,0,moved);save();render();
    });
  });
  setupTouchFolderDrag();
}
function setupTouchFolderDrag(){
  document.querySelectorAll('.sortable-topic .drag-handle').forEach(handle=>{
    handle.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse')return;
      const source=handle.closest('.sortable-topic');if(!source||source.dataset.c!=='school')return;
      e.preventDefault();handle.setPointerCapture?.(e.pointerId);
      touchFolderDrag={sourceId:source.dataset.topicId,targetId:null,intent:null};source.classList.add('dragging');
    });
    handle.addEventListener('pointermove',e=>{
      if(!touchFolderDrag)return;e.preventDefault();clearFolderDropMarks();
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.sortable-topic[data-c="school"]');
      if(!target)return void(touchFolderDrag.intent=null);
      const intent=schoolDropIntent(touchFolderDrag.sourceId,target,e.clientY);
      touchFolderDrag.targetId=target.dataset.topicId;touchFolderDrag.intent=intent;
      if(intent?.type==='sort')target.classList.add(intent.position==='before'?'drag-sort-before':'drag-sort-after');
      else if(intent?.type==='nest')target.classList.add('drag-over');
    });
    const finish=()=>{
      if(!touchFolderDrag)return;
      const {sourceId,targetId,intent}=touchFolderDrag;touchFolderDrag=null;
      document.querySelectorAll('.dragging').forEach(x=>x.classList.remove('dragging'));clearFolderDropMarks();
      if(!targetId||!intent)return;
      if(intent.type==='sort')reorderSchoolFolder(sourceId,targetId,intent.position);
      else if(intent.type==='nest')nestSchoolFolder(sourceId,targetId,true);
    };
    handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  })
}
function openModes(source,title,returnView=state.view,isMistakes=false){state.studySource=source;if(!source.length){alert(isMistakes?'У цьому наборі немає слів із помилками.':'У цьому наборі немає слів.');return}state.studyTitle=title;state.studyIsMistakes=Boolean(isMistakes);state.studyLimit='all';state.trainingReturnView=returnView||'home';setView('modes')}
function activateMistakesMode(){const mistakes=state.studySource.filter(w=>w.mistakes>0);if(!mistakes.length){alert('У цьому наборі немає слів із помилками.');return}state.studySource=mistakes;state.studyTitle=state.studyTitle.startsWith('Помилки · ')?state.studyTitle:`Помилки · ${state.studyTitle||'поточний набір'}`;state.studyIsMistakes=true;state.studyLimit='all';render();scrollTo(0,0)}
function startMode(mode){stopSpeakingRecognition();state.mode=mode;const shuffled=shuffle(state.studySource);state.study=state.studyLimit==='20'?shuffled.slice(0,20):shuffled;state.index=0;if(mode==='match'){state.matchOffset=0;state.matchSelected=null;state.matchMatched=[];state.matchWrong=[];state.matchMistakeWordIds=[];prepareMatchRound()}setView('study')}
function mark(w,ok,options={}){
  if(!w)return;
  let p=Math.max(0,Math.min(3,Number(w.learningProgress)||0));
  if(ok){
    w.correct=(w.correct||0)+1;
    if(!options.preserveMistakes)w.mistakes=0;
    p=Math.min(3,p+1);
    w.learningProgress=p;
    if(p>0)w.manualStatus=null;
  }else{
    w.mistakes=(w.mistakes||0)+1;
    if(p>=3)p=2;
    else if(p===2)p=1;
    else if(p===1)p=1;
    w.learningProgress=p;
    if(p>0)w.manualStatus=null;
  }
  syncLegacyLevel(w);
  w.lastReview=new Date().toISOString();
  save();
}
function nextStudy(){stopSpeakingRecognition();state.index++;if(state.index>=state.study.length){alert('Тренування завершено!');setView(state.trainingReturnView||'home')}else render()}

function checkDuplicateWord(){const ko=$('#ko')?.value.trim();const box=$('#duplicateWarning');if(!box)return;const editId=$('#editId')?.value;const duplicate=ko&&words.find(w=>w.id!==editId&&w.korean.trim()===ko);box.innerHTML=duplicate?`<div class="warning">⚠️ Це слово вже є у словнику: <b>${esc(duplicate.korean)}</b> — ${esc(duplicate.ukrainian)} (${esc(nameFor(duplicate.topicId,duplicate.collection))}). Можна зберегти ще раз, але перевір, чи це не дублікат.</div>`:''}
function inferPartOfSpeech(){const ko=$('#ko')?.value.trim()||'',collection=$('#collection')?.value||state.collection,pos=$('#pos');if(!pos||!ko)return 'Інше';let value='Іменник';if(collection==='phrases'||/\s/.test(ko)||/[.!?…]$/.test(ko))value='Фраза';else if(/(스럽다|답다|롭다|같다|있다|없다|좋다|싫다|크다|작다|많다|적다|예쁘다|아름답다|빠르다|느리다|쉽다|어렵다|덥다|춥다|재미있다|맛있다)$/.test(ko))value='Описове дієслово';else if(/다$/.test(ko))value='Дієслово';else if(/(히|게)$/.test(ko))value='Прислівник';pos.value=value;return value}
async function translateToEnglish(ko){const existing=words.find(w=>w.korean.trim()===ko&&w.english?.trim());if(existing)return existing.english.trim();const seed=(window.SEED_WORDS||[]).find(w=>w.korean?.trim()===ko&&w.english?.trim());if(seed)return seed.english.trim();try{const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(ko)}&langpair=ko|en`;const r=await fetch(url,{headers:{Accept:'application/json'}});if(r.ok){const data=await r.json();const translated=data?.responseData?.translatedText?.trim();if(translated&&!/MYMEMORY WARNING/i.test(translated)&&translated.toLowerCase()!==ko.toLowerCase())return translated}}catch(e){console.warn('Auto translation failed',e)}return ''}
let autoFillRunning=false;
async function autoFillWord(showMessage=true){if(autoFillRunning)return;const ko=$('#ko')?.value.trim(),en=$('#en'),status=$('#autoFillStatus');if(!ko){if(showMessage&&status)status.textContent='Спочатку введи корейське слово.';return}autoFillRunning=true;if(status)status.textContent='✨ Перекладаю з корейської…';inferPartOfSpeech();try{if(en&&!en.value.trim()){const translated=await translateToEnglish(ko);if(translated)en.value=translated}if(status)status.textContent=en?.value.trim()?'Готово ✓ Англійський переклад можна виправити вручну.':'Переклад не знайдено — введи його вручну.'}finally{autoFillRunning=false}}
function stopSpeakingRecognition(){clearTimeout(speakingRestartTimer);speakingRestartTimer=null;state.speakingBusy=false;if(activeRecognition){const rec=activeRecognition;activeRecognition=null;rec.onend=null;rec.onerror=null;rec.onresult=null;try{rec.abort()}catch{}}}
function scheduleSpeakingRestart(delay=450){clearTimeout(speakingRestartTimer);if(state.view==='study'&&state.mode==='speaking')speakingRestartTimer=setTimeout(startSpeaking,delay)}
function retrySpeaking(){
  if(state.view!=='study'||state.mode!=='speaking')return;
  stopSpeakingRecognition();
  try{if('speechSynthesis' in window)window.speechSynthesis.cancel()}catch{}
  const card=$('#speechCard'),prompt=$('#speechPrompt'),result=$('#speechResult');
  if(card)card.classList.remove('speech-good','speech-bad');
  if(prompt)prompt.textContent='🎤 Слухаю… Скажи слово корейською.';
  if(result)result.innerHTML='';
  state.speakingBusy=false;
  setTimeout(startSpeaking,120);
}
async function startSpeaking(){
  if(state.view!=='study'||state.mode!=='speaking'||state.speakingBusy)return;
  const prompt=$('#speechPrompt'),result=$('#speechResult'),Recognition=recognitionApi();
  if(!Recognition){
    if(prompt)prompt.innerHTML='Розпізнавання мовлення не підтримується цим браузером.<br><span class="muted">На iPhone відкрий сайт у Chrome або онови iOS. Озвучення працює, але розпізнавання залежить від браузера.</span>';
    return;
  }
  const allowed=await ensureMicrophonePermission();
  if(state.view!=='study'||state.mode!=='speaking')return;
  if(!allowed){
    if(prompt)prompt.innerHTML='Немає доступу до мікрофона.<br><span class="muted">Дозволь мікрофон для цього сайту в налаштуваннях браузера й відкрий тренування знову.</span>';
    return;
  }
  const w=state.study[state.index];if(!w)return;
  state.speakingBusy=true;
  if(prompt)prompt.textContent='🎤 Слухаю… Скажи слово корейською.';
  if(result)result.textContent='';
  const rec=new Recognition();activeRecognition=rec;
  rec.lang='ko-KR';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=5;
  let handled=false;
  rec.onresult=e=>{
    if(handled||state.view!=='study'||state.mode!=='speaking')return;
    const last=e.results[e.results.length-1];
    const heard=[...last].map(x=>x.transcript.trim()).filter(Boolean);
    if(prompt&&heard[0])prompt.textContent=`🎤 Чую: ${heard[0]}`;
    if(!last.isFinal)return;
    handled=true;
    // Use the original speaking comparison first. If it does not match,
    // retry only with spacing/format characters removed. SpeechRecognition
    // settings and its alternatives are intentionally unchanged.
    const expectedNormalized=normalizeAnswer(w.korean);
    const spacingOnly=v=>v.replace(/[\s\p{Z}\p{Cf}]+/gu,'');
    const expectedNoSpaces=spacingOnly(expectedNormalized);
    const ok=heard.some(x=>{
      const heardNormalized=normalizeAnswer(x);
      return heardNormalized===expectedNormalized || spacingOnly(heardNormalized)===expectedNoSpaces;
    });
    finishSpeaking(ok,`Почула: ${heard[0]||'—'}`);
  };
  rec.onerror=e=>{
    if(activeRecognition===rec)activeRecognition=null;state.speakingBusy=false;
    if(handled)return;
    if(e.error==='not-allowed'||e.error==='service-not-allowed'){
      if(prompt)prompt.textContent='Немає доступу до мікрофона. Дозволь його для цього сайту.';return;
    }
    if(e.error==='audio-capture'){
      if(prompt)prompt.textContent='Мікрофон недоступний або використовується іншим застосунком.';return;
    }
    if(e.error==='no-speech'||e.error==='aborted'){
      if(prompt)prompt.textContent='🎤 Слухаю… Скажи слово корейською.';scheduleSpeakingRestart(350);return;
    }
    if(prompt)prompt.textContent=`Не вдалося розпізнати (${e.error}). Продовжую слухати…`;
    scheduleSpeakingRestart(700);
  };
  rec.onend=()=>{
    if(activeRecognition===rec)activeRecognition=null;state.speakingBusy=false;
    if(!handled&&state.view==='study'&&state.mode==='speaking')scheduleSpeakingRestart(350);
  };
  try{rec.start()}catch(err){
    console.warn('Speech recognition start failed',err);
    if(activeRecognition===rec)activeRecognition=null;state.speakingBusy=false;scheduleSpeakingRestart(700);
  }
}
function finishSpeaking(ok,message){
  const w=state.study[state.index];if(!w)return;
  stopSpeakingRecognition();
  // Keep the exact pre-error state so a false SpeechRecognition result can
  // be manually accepted as correct without penalising progress first.
  state.speakingCorrectionSnapshot=ok?null:{
    wordId:w.id,
    correct:Number(w.correct)||0,
    mistakes:Number(w.mistakes)||0,
    learningProgress:w.learningProgress,
    manualStatus:w.manualStatus,
    level:w.level,
    lastReview:w.lastReview||''
  };
  playResultSound(ok);mark(w,ok);
  const card=$('#speechCard'),prompt=$('#speechPrompt'),result=$('#speechResult');
  if(card)card.classList.add(ok?'speech-good':'speech-bad');
  if(prompt)prompt.innerHTML=`${ok?'✅ Правильно!':'❌ Неправильно'}<div class="speech-answer-ko">${esc(w.korean)}</div><div class="muted">${esc(message)}</div>`;
  if(result)result.innerHTML=ok
    ? `<div>Слово прибрано з помилок і невивчених.</div>`
    : `<div>Слово додано до помилок.</div><div class="mistake-actions speaking-mistake-actions"><div class="speaking-correction-row"><button class="btn secondary retry-speaking-small" data-act="retry-speaking" type="button">↻ Ще раз</button><button class="btn secondary accept-speaking" data-act="accept-speaking" type="button">✓ Зарахувати</button></div><button class="btn secondary" data-act="speak-mistake" type="button">🔊 Прослухати</button><button class="btn primary speaking-next" data-act="next-speaking" type="button">Далі →</button></div>`;
  if(ok){setTimeout(nextStudy,850)}else{speakMistakeWord(w.korean)}
}

function acceptSpeakingAsCorrect(){
  if(state.view!=='study'||state.mode!=='speaking')return;
  const w=state.study[state.index];if(!w)return;
  stopSpeakingRecognition();
  try{if('speechSynthesis' in window)window.speechSynthesis.cancel()}catch{}
  const snap=state.speakingCorrectionSnapshot;
  if(snap&&snap.wordId===w.id){
    w.correct=snap.correct;
    w.mistakes=snap.mistakes;
    w.learningProgress=snap.learningProgress;
    w.manualStatus=snap.manualStatus;
    w.level=snap.level;
    w.lastReview=snap.lastReview;
  }
  state.speakingCorrectionSnapshot=null;
  mark(w,true);
  playResultSound(true);
  const card=$('#speechCard'),prompt=$('#speechPrompt'),result=$('#speechResult');
  if(card){card.classList.remove('speech-bad');card.classList.add('speech-good')}
  if(prompt)prompt.innerHTML=`✅ Зараховано як правильну<div class="speech-answer-ko">${esc(w.korean)}</div><div class="muted">Виправлено вручну</div>`;
  if(result)result.innerHTML='<div>Відповідь зараховано як правильну.</div>';
  setTimeout(nextStudy,650);
}
function playResultSound(ok){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;audioContext=audioContext||new Ctx();if(audioContext.state==='suspended')audioContext.resume();const now=audioContext.currentTime;const notes=ok?[[660,0,.10],[880,.11,.16]]:[[300,0,.12],[220,.13,.18]];notes.forEach(([frequency,offset,duration])=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=ok?'sine':'triangle';osc.frequency.setValueAtTime(frequency,now+offset);gain.gain.setValueAtTime(.0001,now+offset);gain.gain.exponentialRampToValueAtTime(ok?.12:.10,now+offset+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now+offset);osc.stop(now+offset+duration+.02)})}catch(e){console.warn('Result sound unavailable',e)}}

function speakNote(text){
  const value=String(text||'').trim();
  if(!value){
    alert('Нотатка порожня.');
    return;
  }
  if(!('speechSynthesis' in window)){
    alert('Цей браузер не підтримує озвучення.');
    return;
  }

  try{
    const synth=window.speechSynthesis;
    synth.cancel();

    const utterance=new SpeechSynthesisUtterance(value);
    const hasHangul=/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u.test(value);
    utterance.lang=hasHangul?'ko-KR':'uk-UA';
    utterance.rate=hasHangul?.82:.9;
    utterance.volume=1;

    const voices=synth.getVoices?.()||[];
    const wantedPrefix=hasHangul?'ko':'uk';
    const voice=voices.find(v=>(v.lang||'').toLowerCase().startsWith(wantedPrefix));
    if(voice)utterance.voice=voice;

    synth.resume();
    synth.speak(utterance);
    setTimeout(()=>{try{if(synth.paused)synth.resume()}catch{}},250);
  }catch(error){
    console.warn('Note speech failed',error);
  }
}

function speak(text,delay=0){
  if(!text)return;
  if(!('speechSynthesis' in window)){alert('Цей браузер не підтримує озвучення.');return}
  const run=()=>{
    try{
      const synth=window.speechSynthesis;
      synth.cancel();
      const utterance=new SpeechSynthesisUtterance(String(text));
      utterance.lang='ko-KR';
      utterance.rate=.82;
      utterance.volume=1;
      const voices=synth.getVoices();
      const koreanVoice=voices.find(v=>/^ko(-|_)/i.test(v.lang))||voices.find(v=>/korean/i.test(v.name));
      if(koreanVoice)utterance.voice=koreanVoice;
      let retried=false;
      utterance.onerror=()=>{
        if(retried)return;
        retried=true;
        setTimeout(()=>{
          try{const retry=new SpeechSynthesisUtterance(String(text));retry.lang='ko-KR';retry.rate=.82;retry.volume=1;if(koreanVoice)retry.voice=koreanVoice;synth.cancel();synth.speak(retry)}catch{}
        },350);
      };
      synth.resume();
      synth.speak(utterance);
      // iOS occasionally pauses synthesis after microphone use.
      setTimeout(()=>{try{if(synth.paused)synth.resume()}catch{}},250);
    }catch(error){console.warn('Speech synthesis failed',error)}
  };
  if(delay>0)setTimeout(run,delay);else run();
}

function speakMistakeWord(text,after){
  if(!text){if(typeof after==='function')after();return}
  if(!('speechSynthesis' in window)){if(typeof after==='function')after();return}
  const synth=window.speechSynthesis;
  try{
    // iOS/Safari is much more reliable when speak() is queued immediately from
    // the user action instead of being started from a delayed timer.
    synth.cancel();
    try{if(synth.paused)synth.resume()}catch{}
    const voices=synth.getVoices?.()||[];
    const koreanVoice=voices.find(v=>/^ko(?:-|_)/i.test(v.lang||''))||voices.find(v=>/korean|한국/i.test(v.name||''));
    let done=false;
    const finish=()=>{if(done)return;done=true;if(typeof after==='function')after()};
    const utterance=new SpeechSynthesisUtterance(String(text));
    utterance.lang='ko-KR';utterance.rate=.78;utterance.pitch=1;utterance.volume=1;
    if(koreanVoice)utterance.voice=koreanVoice;
    utterance.onend=finish;
    utterance.onerror=()=>{
      if(done)return;
      setTimeout(()=>{
        try{
          const retry=new SpeechSynthesisUtterance(String(text));
          retry.lang='ko-KR';retry.rate=.78;retry.volume=1;if(koreanVoice)retry.voice=koreanVoice;
          retry.onend=finish;retry.onerror=finish;
          synth.speak(retry);
          setTimeout(finish,2600);
        }catch{finish()}
      },120);
    };
    synth.speak(utterance);
    setTimeout(()=>{try{if(synth.paused)synth.resume()}catch{}},100);
    setTimeout(finish,3200);
  }catch{if(typeof after==='function')after()}
}

function addMistakeListenButton(container){
  if(!container||container.querySelector?.('[data-act="speak-mistake"]'))return;
  const wrap=document.createElement('div');wrap.className='mistake-listen-wrap';
  wrap.innerHTML='<button class="btn secondary" data-act="speak-mistake" type="button">🔊 Прослухати</button>';
  container.appendChild(wrap);
}

function applyLibraryFilters(base=words){const q=(state.libraryQuery||'').toLowerCase().trim().replace(/^#/,''),c=state.libraryCollection||'',topic=state.libraryTopic||'',l=state.libraryLevel??'',tag=state.libraryTag||'';let topicIds=null;if(topic){topicIds=new Set(c==='school'?schoolDescendantIds(topic):[topic])}let arr=base.filter(w=>{const tags=normalizeTags(w.tags),text=(w.korean+' '+w.ukrainian+' '+(w.english||'')+' '+tags.join(' ')).toLowerCase();return(!q||text.includes(q))&&(!tag||tags.includes(tag))&&(!c||w.collection===c)&&(!topicIds||topicIds.has(w.topicId))&&(l===''||wordStatusKey(w)===l)});const collatorKo=new Intl.Collator('ko'),collatorUk=new Intl.Collator('uk');if(state.librarySort==='ko-asc')arr=arr.slice().sort((a,b)=>collatorKo.compare(a.korean,b.korean));if(state.librarySort==='ko-desc')arr=arr.slice().sort((a,b)=>collatorKo.compare(b.korean,a.korean));if(state.librarySort==='uk-asc')arr=arr.slice().sort((a,b)=>collatorUk.compare(a.ukrainian,b.ukrainian));if(state.librarySort==='uk-desc')arr=arr.slice().sort((a,b)=>collatorUk.compare(b.ukrainian,a.ukrainian));return arr}
function captureLibraryFilters(){const raw=$('#search')?.value||'';state.libraryQuery=isSearchReady(raw)?raw:'';state.libraryCollection=$('#filterCollection')?.value||'';state.libraryTopic=$('#filterTopic')?.value||'';state.libraryLevel=$('#filterLevel')?.value??'';state.libraryTag=$('#filterTag')?.value||'';state.librarySort=$('#sortWords')?.value||'none'}
function filterLibrary(){captureLibraryFilters();render()}
function saveWord(e){
  e.preventDefault();
  const id=$('#editId').value;
  let w=id?words.find(x=>x.id===id):normalizeWord({id:uid()});

  Object.assign(w,{
    collection:$('#collection').value,
    topicId:$('#topicSelect').value,
    korean:$('#ko').value.trim(),
    ukrainian:$('#uk').value.trim(),
    english:$('#en').value.trim(),
    partOfSpeech:$('#pos').value,
    exampleKo:$('#exampleKo').value.trim(),
    exampleUk:$('#exampleUk').value.trim(),
    notes:$('#notes').value.trim(),
    tags:normalizeTags($('#tags').value)
  });

  if(!id)words.push(w);
  save();

  const y=id?state.returnScrollY:null;
  state.returnScrollY=null;
  setView(state.returnView||'library',y);
}
function saveTopic(e){e.preventDefault();const n=$('#topicName').value.trim();if(!n)return;const list=listFor(state.collection),t=list.find(x=>x.id===state.editTopicId);if(t)t.name=n;else{const item={id:(SPECIAL_PREFIX[state.collection]||'')+uid(),name:n,...(state.collection==='school'?{parentId:state.schoolParentId??null}:{})};if(state.collection==='school')school.push(item);else if(state.collection==='phrases')phrases.push(item);else topics.push(item)}state.editTopicId=null;save();if(state.collection==='school'&&state.schoolParentId&&state.returnView==='detail'){state.topicId=state.returnTopicId||state.schoolParentId;setView('detail')}else setView(collectionViewName(state.collection))}
function checkWritten(e){
  e.preventDefault();
  const w=state.study[state.index],askKo=state.mode==='write-ko';
  const input=$('#writeAnswer'),button=$('#checkWrittenButton'),result=$('#writeResult');
  if(!w||!input||!result)return;
  const raw=input.value.trim();
  if(!raw){input.focus();return}
  const expected=askKo?w.korean:w.ukrainian;
  const ok=normalizeAnswer(raw)===normalizeAnswer(expected);
  input.disabled=true;if(button)button.disabled=true;
  playResultSound(ok);mark(w,ok);
  result.className='write-result '+(ok?'write-correct':'write-wrong');
  result.innerHTML=ok
    ? `<div class="write-status">✅ Правильно!</div><div class="write-answer correct-answer">${esc(expected)}</div>`
    : `<div class="write-status">❌ Неправильно</div><div class="write-user-answer">Твоя відповідь: <b>${esc(raw)}</b></div><div class="write-label">Правильна відповідь:</div><div class="write-answer correct-answer">${esc(expected)}</div>`;
  if(!ok)speakMistakeWord(w.korean);
  if(ok){
    setTimeout(nextStudy,1700);
  }else{
    result.innerHTML += `<div class="mistake-actions"><button class="btn secondary" data-act="speak-mistake" type="button">🔊 Прослухати</button><button class="btn primary written-next" data-act="next-written" type="button">Далі →</button></div>`;
  }
}
function exportJson(){const data={format:'korean-flashcards-pro',version:'4.8.9',exportedAt:new Date().toISOString(),topics,school,phrases,words};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`korean-flashcards-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)}
async function importJson(e){const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.topics)||!Array.isArray(data.school)||!Array.isArray(data.phrases)||!Array.isArray(data.words))throw new Error('Неправильний формат файлу');if(!confirm('Замінити поточні дані даними з резервної копії?'))return;topics=data.topics;school=data.school;phrases=data.phrases;words=data.words.map(normalizeWord);save();alert('Дані успішно імпортовано.');setView('home')}catch(err){alert('Не вдалося імпортувати файл: '+err.message)}finally{e.target.value=''}}
function parseOcrText(text){
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),out=[];
  for(const rawLine of lines){
    const line=rawLine.replace(/^\s*(?:\d+[.)]|[-•▪◦])\s*/, '').trim();
    let parts=line.split(/\t+|\s+[—–-]\s+|\s{2,}/).map(x=>x.trim()).filter(Boolean);
    if(parts.length<2){
      const m=line.match(/^([가-힣\s]+)\s+(.+)$/);
      if(m)parts=[m[1].trim(),m[2].trim()];
    }
    if(parts.length>=2&&/[가-힣]/.test(parts[0])){
      out.push({korean:parts[0],ukrainian:parts[1],english:parts.slice(2).join(' — ')});
    }
  }
  return out
}

function parseOcrKoreanPairs(text){
  const out=[];
  for(const rawLine of String(text||'').split(/\r?\n/)){
    const line=rawLine.replace(/^\s*(?:\d+[.)]|[-•▪◦])\s*/, '').trim();
    if(!line)continue;

    let parts=line
      .split(/\t+|\s+[—–-]\s+|\s{2,}/)
      .map(x=>x.trim())
      .filter(Boolean);

    if(parts.length<2){
      const tokens=line.match(/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+/g)||[];
      if(tokens.length>=2)parts=[tokens[0],tokens[1]];
    }

    const koParts=parts.filter(x=>/[\uAC00-\uD7AF]/u.test(x));
    if(koParts.length>=2){
      out.push({korean:koParts[0],ukrainian:koParts[1],english:''});
    }
  }
  return out;
}

function formatOcrRecords(lines){
  return lines.map((x,i)=>`${i+1}. ${[x.korean,x.ukrainian,x.english].filter(Boolean).join(' — ')}`).join('\n')
}

function scoreOcrText(t){
  t=String(t||'');
  const hangul=(t.match(/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/g)||[]).length;
  const letters=(t.match(/[A-Za-zА-Яа-яІіЇїЄєҐґ]/g)||[]).length;
  const usefulLines=t.split(/\r?\n/).filter(line=>line.trim().length>=2).length;
  const noise=(t.match(/[|_~^<>\\[\]{}]/g)||[]).length;
  return hangul*7+letters+usefulLines*12-noise*4;
}

async function preprocessOcrImage(file){
  const bitmap=await createImageBitmap(file);
  const maxWidth=2600;
  const scale=Math.max(1,Math.min(3.5,maxWidth/bitmap.width));
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(bitmap.width*scale);
  canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);

  const image=ctx.getImageData(0,0,canvas.width,canvas.height);
  const d=image.data;
  let avg=0;
  for(let i=0;i<d.length;i+=4)avg+=(d[i]+d[i+1]+d[i+2])/3;
  avg/=d.length/4;
  const darkBackground=avg<128;

  for(let i=0;i<d.length;i+=4){
    const gray=.299*d[i]+.587*d[i+1]+.114*d[i+2];
    let v=darkBackground?255-gray:gray;
    v=Math.max(0,Math.min(255,(v-128)*1.45+128));
    v=v>210?255:v<55?0:v;
    d[i]=d[i+1]=d[i+2]=v;
  }
  ctx.putImageData(image,0,0);

  return await new Promise((resolve,reject)=>canvas.toBlob(
    blob=>blob?resolve(blob):reject(new Error('Не вдалося підготувати зображення')),
    'image/png'
  ));
}

async function recognizeOcrImage(image,progress,label,psm='6',languages='kor+ukr+eng'){
  return Tesseract.recognize(image,languages,{logger:m=>{
    if(m.status==='recognizing text')progress.textContent=`${label}: ${Math.round((m.progress||0)*100)}%`;
    else if(m.status)progress.textContent=`${label}: ${m.status}`;
  }},{tessedit_pageseg_mode:String(psm),preserve_interword_spaces:'1'});
}

function koreanTokens(value){
  return String(value||'').match(/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+/g)||[];
}

function extractKoreanPairsFromOcr(result){
  const data=result?.data||{};
  const words=(data.words||[])
    .map(w=>{
      const token=koreanTokens(w.text||'').join('');
      const box=w.bbox||{};
      if(!token||!/[\uAC00-\uD7AF]/u.test(token))return null;
      const x1=Number(box.x0??box.x1??0),x2=Number(box.x1??box.x0??0);
      const y1=Number(box.y0??box.y1??0),y2=Number(box.y1??box.y0??0);
      return {text:token,x:(x1+x2)/2,y:(y1+y2)/2,h:Math.max(1,Math.abs(y2-y1))};
    })
    .filter(Boolean);

  if(!words.length)return [];

  words.sort((a,b)=>a.y-b.y||a.x-b.x);
  const rows=[];
  for(const word of words){
    let best=null,bestDist=Infinity;
    for(const row of rows){
      const tolerance=Math.max(14,row.h*0.75,word.h*0.75);
      const dist=Math.abs(row.y-word.y);
      if(dist<=tolerance&&dist<bestDist){best=row;bestDist=dist}
    }
    if(!best){
      best={y:word.y,h:word.h,items:[]};
      rows.push(best);
    }
    best.items.push(word);
    best.y=best.items.reduce((s,x)=>s+x.y,0)/best.items.length;
    best.h=Math.max(best.h,word.h);
  }

  rows.sort((a,b)=>a.y-b.y);
  const pairs=[];
  for(const row of rows){
    row.items.sort((a,b)=>a.x-b.x);
    const unique=[];
    for(const item of row.items){
      if(!unique.some(x=>x.text===item.text&&Math.abs(x.x-item.x)<20))unique.push(item);
    }
    if(unique.length>=2){
      pairs.push({korean:unique[0].text,ukrainian:unique[unique.length-1].text,english:''});
    }
  }

  // Fallback: some Tesseract builds expose line text better than word geometry.
  if(!pairs.length){
    for(const line of data.lines||[]){
      const tokens=koreanTokens(line.text);
      if(tokens.length>=2)pairs.push({korean:tokens[0],ukrainian:tokens[tokens.length-1],english:''});
    }
  }

  return pairs;
}

async function runOcr(){
  const file=$('#ocrCamera')?.files?.[0]||$('#ocrGallery')?.files?.[0];
  const progress=$('#ocrProgress');
  const mode=$('#ocrImportMode')?.value||'ko-uk';

  if(!file){alert('Спочатку сфотографуй сторінку або обери зображення з галереї.');return}
  if(!window.Tesseract){alert('Модуль розпізнавання не завантажився. Перевір інтернет і відкрий сторінку ще раз.');return}

  progress.hidden=false;
  progress.textContent='Покращую якість зображення…';

  const verified=$('#ocrVerified'),status=$('#ocrVerifiedStatus');
  if(verified)verified.value='';
  if(status)status.hidden=true;

  try{
    const enhanced=await preprocessOcrImage(file);

    if(mode==='ko-ko'){
      const sparse=await recognizeOcrImage(enhanced,progress,'Розпізнавання корейської таблиці',11,'kor');
      let pairs=extractKoreanPairsFromOcr(sparse);

      if(pairs.length<3){
        const block=await recognizeOcrImage(enhanced,progress,'Додаткова перевірка таблиці',6,'kor');
        const retry=extractKoreanPairsFromOcr(block);
        if(retry.length>pairs.length)pairs=retry;
      }

      if(verified)verified.value=pairs.length?formatOcrRecords(pairs):String(sparse?.data?.text||'').trim();

      if(status){
        status.hidden=false;
        status.textContent=pairs.length
          ? `Знайдено пар: ${pairs.length}. Перше слово буде записане в «Корейська», друге — в «Українська» без перекладу.`
          : 'Не вдалося надійно розділити фото на пари. Відредагуй список вручну у форматі «나쁘다 — 나빠요».';
      }

      progress.textContent=pairs.length
        ? 'Готово. Перевір пари нижче.'
        : 'Розпізнавання завершено. Перевір текст вручну.';
      return;
    }

    const enhancedResult=await recognizeOcrImage(enhanced,progress,'Розпізнавання фото',6,'kor+ukr+eng');
    let bestText=String(enhancedResult?.data?.text||'').trim();
    let bestScore=scoreOcrText(bestText);

    if(bestScore<55){
      const originalResult=await recognizeOcrImage(file,progress,'Перевіряю оригінал',6,'kor+ukr+eng');
      const originalText=String(originalResult?.data?.text||'').trim();
      if(scoreOcrText(originalText)>bestScore)bestText=originalText;
    }

    const lines=parseOcrText(bestText);
    if(verified)verified.value=lines.length?formatOcrRecords(lines):bestText;

    if(status){
      status.hidden=false;
      status.textContent=lines.length
        ? `Знайдено записів: ${lines.length}. Перевір і відредагуй список перед додаванням.`
        : 'Не вдалося автоматично структурувати записи. Відредагуй текст вручну у форматі «корейське — українське — англійське».';
    }

    progress.textContent=bestText
      ? 'Готово. Перевір структурований список нижче.'
      : 'Текст не знайдено. Спробуй чіткіше фото.';
  }catch(err){
    console.error(err);
    progress.textContent='Не вдалося розпізнати фото. Спробуй чіткіше фото або введи текст вручну.';
  }
}

function saveOcrWords(){
  const mode=$('#ocrImportMode')?.value||'ko-uk';
  state.ocrLines=mode==='ko-ko'
    ? parseOcrKoreanPairs($('#ocrVerified')?.value||'')
    : parseOcrText($('#ocrVerified')?.value||'');

  if(!state.ocrLines.length){
    alert(mode==='ko-ko'
      ? 'Немає готових пар. Формат рядка: «나쁘다 — 나빠요».'
      : 'Немає готових записів для додавання. Перевір або відредагуй поле «Розпізнані записи».');
    return;
  }

  const c=$('#ocrCollection').value,topicId=$('#ocrTopic').value;
  if(!topicId){alert('Створи або обери тему.');return}

  state.ocrLines.forEach(x=>words.push(normalizeWord({
    id:uid(),
    collection:c,
    topicId,
    korean:x.korean,
    ukrainian:x.ukrainian,
    english:x.english||'',
    partOfSpeech:c==='phrases'?'Фраза':'Інше'
  })));

  save();
  alert(`Додано ${state.ocrLines.length} записів.`);
  state.collection=c;
  state.topicId=topicId;
  setView('detail');
}

async function forceUpdate(){
  const button=document.querySelector('[data-act="force-update"]');
  const originalText=button?.textContent||'🔄 Оновити застосунок';
  try{
    if(button){button.disabled=true;button.textContent='⏳ Перевіряю оновлення…'}
    const stamp=Date.now();
    sessionStorage.setItem('koreanAppUpdated','1');

    // On iOS Home Screen the service worker can keep an old app shell alive.
    // Update the worker without using the HTTP cache and activate a waiting worker.
    if('serviceWorker' in navigator){
      const registration=await navigator.serviceWorker.getRegistration();
      if(registration){
        await registration.update().catch(error=>console.warn('SW update failed',error));
        const waiting=registration.waiting;
        if(waiting)waiting.postMessage({type:'SKIP_WAITING'});
      }
    }

    // Drop only Cache Storage. localStorage/Supabase data are untouched.
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }

    // Fetch the app shell straight from GitHub Pages, bypassing browser cache.
    const assets=['./','./index.html','./style.css','./app.js','./data.js','./sw.js','./login.html','./login-style.css','./login.js','./login-korea.png','./login-purple-bg.png','./avatar-1.png','./avatar-2.png','./avatar-3.png','./avatar-4.png','./avatar-5.png','./avatar-6.png','./icon-purple.png','./icon-pink.png','./manifest.webmanifest'];
    await Promise.all(assets.map(path=>
      fetch(`${path}${path.includes('?')?'&':'?'}update=${stamp}`,{
        cache:'no-store',
        headers:{'Cache-Control':'no-cache'}
      }).catch(()=>null)
    ));

    if(button)button.textContent='✅ Оновлення знайдено. Перезапускаю…';

    // A cache-busted navigation is important for iOS standalone PWA.
    const url=new URL(window.location.href);
    url.searchParams.set('appUpdate',String(stamp));
    url.hash='';
    window.location.replace(url.toString());
  }catch(error){
    console.error('Force update failed',error);
    if(button){button.disabled=false;button.textContent=originalText}
    alert('Не вдалося автоматично оновити застосунок. Перевір інтернет і спробуй ще раз. Дані не видалено.');
  }
}
ensureThemeStyles();applyAppTheme();
(async()=>{
  const {data:{session},error}=await supabaseClient.auth.getSession();
  if(error){
    console.error('Session check failed:',error);
  }
  if(!session){
    window.location.replace('./login.html');
    return;
  }

  currentUserId=session.user.id;
  const cloudLoaded = await loadFromSupabase();
  if(!cloudLoaded) load();
  await loadSocialData();
  await importPendingFolderShares();

  render();
  updateStaticAppVersion();
})();

supabaseClient.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){
    currentUserId=null;
    window.location.replace('./login.html');
    return;
  }
  if(session?.user?.id)currentUserId=session.user.id;
  if(event==='PASSWORD_RECOVERY'){
    setTimeout(()=>openPasswordModal(),100);
  }
});
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=5.0.4',{updateViaCache:'none'}).catch(console.error))}
window.addEventListener('load',()=>{if(sessionStorage.getItem('koreanAppUpdated')==='1'){sessionStorage.removeItem('koreanAppUpdated');setTimeout(()=>alert('Застосунок перезапущено з очищеним кешем. Якщо в GitHub Pages вже є нова версія, тепер має відкритися саме вона.'),250)}});
