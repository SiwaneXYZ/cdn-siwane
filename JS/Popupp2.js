const FPK='firebaseUserProfileData',DPI='https://cdn-icons-png.flaticon.com/512/3135/3135715.png',FV='11.6.1';
let auth,app,init,loginChk,userIcon,popup,notLog,logDiv,adminEl,pointsEl,logoutEl,productsEl,origHtml;

function getConfig(){const e=document.getElementById("json:firebaseconfig");if(!e)return null;try{const t=JSON.parse(e.textContent);return t&&t.apiKey&&(t.appId||t.projectId)?t:null}catch(e){return null}}

async function initFirebase(){if(init)return;const e=getConfig();if(!e)return updateUI(!1),setTimeout(showPrompt,3000),void(loginChk&&(loginChk.checked=!1));try{const[t,n]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`)]);const{initializeApp:i,getApps:o,getApp:r}=t,{getAuth:s,onAuthStateChanged:a,signOut:c}=n;const l=o();app=l.length?r():i(e),auth=s(app),init=!0,a(auth,e=>{e?handleLogin(e):handleLogout(),loginChk&&(loginChk.checked=!1)})}catch(e){updateUI(!1),setTimeout(showPrompt,3000),loginChk&&(loginChk.checked=!1)}}

function handleLogin(e){const t={uid:e.uid,displayName:e.displayName,photoURL:e.photoURL,email:e.email};let n=null;try{const e=localStorage.getItem(FPK);n=e?JSON.parse(e):null}catch(e){}const i={...n,...t,isAdmin:n?n.isAdmin:!1};localStorage.setItem(FPK,JSON.stringify(i)),updateUI(!0,i,i.photoURL||e.photoURL)}

function handleLogout(){localStorage.removeItem(FPK),updateUI(!1),setTimeout(showPrompt,2000)}

function updateUI(e,t,n){if(!notLog||!logDiv)return;if(e){notLog.classList.add("hidden"),logDiv.classList.remove("hidden");const e=t&&!0===t.isAdmin;adminEl&&adminEl.classList.toggle("hidden",!e),pointsEl&&pointsEl.classList.toggle("hidden",e),productsEl&&productsEl.classList.toggle("hidden",e),userIcon&&updateProfileImg(n)}else{notLog.classList.remove("hidden"),logDiv.classList.add("hidden"),adminEl&&adminEl.classList.add("hidden"),pointsEl&&pointsEl.classList.add("hidden"),productsEl&&productsEl.classList.add("hidden"),userIcon&&resetProfileImg()}}

function updateProfileImg(e){const t=userIcon.querySelector(".current-profile-image")||function(){const e=document.createElement("img");return e.alt="Profile",e.classList.add("profileUser","current-profile-image"),e.onerror=function(){this.src=DPI},userIcon.innerHTML="",userIcon.appendChild(e),e}();t.src=e||DPI,userIcon.classList.add("logged-in")}

function resetProfileImg(){userIcon.innerHTML=origHtml,userIcon.classList.remove("logged-in")}

function showPrompt(){
    console.log("🕒 showPrompt called at:", new Date().toLocaleTimeString());
    const e=localStorage.getItem("prompt_dismissed_v13");
    if(e)try{const t=JSON.parse(e);if((Date.now()-t.timestamp)/864e5<3.5)return}catch(e){}
    const t="undefined"!=typeof data&&data.blog?.title?data.blog.title:"صوانˣʸᶻ",n="undefined"!=typeof data&&data.blog?.blogspotFaviconUrl?data.blog.blogspotFaviconUrl:"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh80X00Lvdk3ZJBmgQFmGd1SmDZvqHpPf8D6YhmW7QsWYXyo_Cbo6BFHHdv1r1ocOe4gr5OexjPYYi-9Tp6QFQsfci2WPbFDu6DGFFr4UzhyphenhyphenkbTKFEBEQyPPbuYDM08v9-OU4ySBsI4bNOPtqr-U1fKMmcqRL38XSVE_XvVjFcblgVffq1j18GvYQTZEM8/s1600/favicon.png";
    let i=document.getElementById("login-signup-prompt-dynamic");
    if(i)return;
    const o=document.createElement("div");
    o.innerHTML=`<div id="login-signup-prompt-dynamic" class="browser-notification-bar"><div class="prompt-content"><div class="site-info"><img src="${n}" alt="${t}" class="site-icon"><div class="text-block"><p class="site-name">${t}</p><p class="prompt-message">هل أنت جديد هنا؟ سجل الدخول أو أنشئ حسابًا.</p></div></div><div dir="ltr" class="prompt-actions"><a href="/p/login.html" class="action-button">تسجيل الدخول</a><button id="dismiss-prompt-dynamic" class="secondary-button">ليس الآن</button></div></div></div>`;
    document.body.appendChild(o.firstElementChild);
    i=o.firstElementChild;
    const r=document.getElementById("dismiss-prompt-dynamic");
    
    // ⏰ الأوقات المحسنة:
    console.log("🕒 Waiting 4 seconds before showing...");
    setTimeout(()=>{
        console.log("🕒 Making prompt visible at:", new Date().toLocaleTimeString());
        i.style.display="block";
        setTimeout(()=>{
            console.log("🕒 Adding show class at:", new Date().toLocaleTimeString());
            i.classList.add("show");
        },100);
    },4000); // 4 ثواني بدلاً من 2
    
    r.addEventListener("click",()=>{
        i.classList.remove("show");
        setTimeout(()=>{
            i.style.display="none";
        },400);
        localStorage.setItem("prompt_dismissed_v13",JSON.stringify({timestamp:Date.now(),version:"v13"}));
    },{once:!0});
}

function setupEvents(){userIcon&&loginChk&&(userIcon.style.cursor="pointer",userIcon.addEventListener("click",e=>{e.preventDefault(),loginChk.checked=!loginChk.checked})),document.addEventListener("click",e=>{const t=e.target;loginChk&&loginChk.checked&&userIcon&&popup&&!userIcon.contains(t)&&!popup.contains(t)&&(loginChk.checked=!1)}),adminEl&&(adminEl.style.cursor="pointer",adminEl.addEventListener("click",()=>{window.location.href="/p/admin.html"})),pointsEl&&(pointsEl.style.cursor="pointer",pointsEl.addEventListener("click",e=>{e.preventDefault(),window.location.href="/p/points.html"})),productsEl&&(productsEl.style.cursor="pointer",productsEl.addEventListener("click",e=>{e.preventDefault(),window.location.href="/p/my-products.html"})),logoutEl&&(logoutEl.style.cursor="pointer",logoutEl.addEventListener("click",()=>{auth?import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`).then(e=>{e.signOut(auth).then(()=>{localStorage.removeItem(FPK),updateUI(!1),window.location.href="/p/login.html"})}):(localStorage.removeItem(FPK),updateUI(!1),window.location.href="/p/login.html")}))}

document.addEventListener("DOMContentLoaded",()=>{
    console.log("🕒 DOM Content Loaded at:", new Date().toLocaleTimeString());
    loginChk=document.getElementById("forlogPop");
    userIcon=document.querySelector(".logReg");
    popup=document.querySelector(".logPop-wrp");
    notLog=document.querySelector(".NotLog");
    logDiv=document.querySelector(".DonLog");
    logDiv&&(adminEl=logDiv.querySelector('div.loginS[aria-label="ادمن"]'),logoutEl=logDiv.querySelector('div.loginS[aria-label="الخروج"]'),pointsEl=logDiv.querySelector('a.loginS[aria-label="نقاطي"]'),productsEl=logDiv.querySelector('a.loginS[aria-label="منتجاتي"]'));
    origHtml=userIcon?userIcon.innerHTML:"";
    setupEvents();
    initFirebase();
});
