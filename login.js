'use strict';

const loginVersion=document.querySelector('.version');
if(loginVersion)loginVersion.textContent='PRO 5.0.6 · 29.08.2026';


const APP_THEME_KEY='kf_theme';
function loginTheme(){return localStorage.getItem(APP_THEME_KEY)==='pink'?'pink':'purple'}
function applyLoginTheme(){
  const theme=loginTheme();
  document.documentElement.dataset.appTheme=theme;
  const icon=theme==='pink'?'./icon-pink.png':'./icon-purple.png';
  let apple=document.querySelector('link[rel="apple-touch-icon"]');
  if(!apple){apple=document.createElement('link');apple.rel='apple-touch-icon';document.head.appendChild(apple)}
  apple.href=icon+'?v=5.0.6';
}
applyLoginTheme();
const SUPABASE_URL='https://cqikjyakfnkrxlrfvxgp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_AM_KftThbhnQuczExuFkuQ_nF4c4pU-';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

const $=s=>document.querySelector(s);
const views={
  choice:$('#choiceView'),
  login:$('#loginView'),
  register:$('#registerView'),
  recovery:$('#recoveryView')
};

function show(name){
  Object.entries(views).forEach(([key,node])=>{if(node)node.hidden=key!==name});
  setMessage('');
  window.scrollTo({top:0,behavior:'smooth'});
}

function setMessage(text,type=''){
  const el=$('#authMessage');
  if(!el)return;
  el.hidden=!text;
  el.textContent=text||'';
  el.className='message'+(type?` ${type}`:'');
}

function appUrl(){
  return new URL('./index.html',window.location.href).toString();
}
function loginUrl(){
  return new URL('./login.html',window.location.href).toString();
}

document.querySelectorAll('[data-open]').forEach(btn=>{
  btn.addEventListener('click',()=>show(btn.dataset.open));
});
document.querySelectorAll('[data-back]').forEach(btn=>{
  btn.addEventListener('click',()=>show('choice'));
});

$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const button=e.submitter;
  const email=$('#loginEmail').value.trim();
  const password=$('#loginPassword').value;
  try{
    if(button){button.disabled=true;button.textContent='Входжу…'}
    setMessage('');
    const {error}=await supabaseClient.auth.signInWithPassword({email,password});
    if(error)throw error;
    window.location.replace(appUrl());
  }catch(error){
    console.error(error);
    setMessage(error.message==='Invalid login credentials'
      ? 'Неправильний email або пароль.'
      : 'Не вдалося увійти: '+error.message,'error');
  }finally{
    if(button){button.disabled=false;button.textContent='Увійти'}
  }
});

$('#registerForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const button=e.submitter;
  const email=$('#registerEmail').value.trim();
  const p1=$('#registerPassword').value;
  const p2=$('#registerPassword2').value;

  if(p1!==p2){setMessage('Паролі не збігаються.','error');return}
  if(p1.length<6){setMessage('Пароль має містити щонайменше 6 символів.','error');return}

  try{
    if(button){button.disabled=true;button.textContent='Створюю…'}
    setMessage('');
    const {data,error}=await supabaseClient.auth.signUp({
      email,
      password:p1,
      options:{emailRedirectTo:loginUrl()}
    });
    if(error)throw error;

    if(data.session){
      // New account has no rows in user-scoped tables, so the app opens empty.
      window.location.replace(appUrl());
    }else{
      setMessage('Аккаунт створено. Supabase просить підтвердити email — відкрий лист, а потім увійди.');
      show('login');
      $('#loginEmail').value=email;
    }
  }catch(error){
    console.error(error);
    setMessage('Не вдалося створити аккаунт: '+error.message,'error');
  }finally{
    if(button){button.disabled=false;button.textContent='Створити аккаунт'}
  }
});

$('#forgotPassword').addEventListener('click',async()=>{
  const email=$('#loginEmail').value.trim()||prompt('Введи email для відновлення пароля:')||'';
  if(!email)return;
  try{
    setMessage('Надсилаю лист…');
    const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:loginUrl()});
    if(error)throw error;
    setMessage('Лист для зміни пароля надіслано. Відкрий посилання з листа.');
  }catch(error){
    console.error(error);
    setMessage('Не вдалося надіслати лист: '+error.message,'error');
  }
});

$('#recoveryForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const button=e.submitter;
  const p1=$('#recoveryPassword').value;
  const p2=$('#recoveryPassword2').value;
  if(p1!==p2){setMessage('Паролі не збігаються.','error');return}
  try{
    if(button){button.disabled=true;button.textContent='Зберігаю…'}
    const {error}=await supabaseClient.auth.updateUser({password:p1});
    if(error)throw error;
    setMessage('✅ Пароль змінено. Відкриваю застосунок.');
    setTimeout(()=>window.location.replace(appUrl()),650);
  }catch(error){
    console.error(error);
    setMessage('Не вдалося змінити пароль: '+error.message,'error');
  }finally{
    if(button){button.disabled=false;button.textContent='Зберегти пароль'}
  }
});

supabaseClient.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){
    show('recovery');
    return;
  }
  if(event==='SIGNED_IN' && session && !location.hash.includes('type=recovery')){
    // Do not auto-redirect from a recovery link before the user chooses a new password.
  }
});

(async()=>{
  const {data:{session}}=await supabaseClient.auth.getSession();
  // Normal visit with an existing session can go straight to the app.
  // Recovery links are handled by PASSWORD_RECOVERY above.
  if(session && !location.hash && !location.search.includes('recovery')){
    window.location.replace(appUrl());
  }
})();
