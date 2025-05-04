// تحقق من أن Firebase مهيأ مسبقًا
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {

  const auth = firebase.auth();

  // العناصر
  const userToggle = document.getElementById("userPopupToggle");
  const logPopup = document.querySelector(".logPop-wrp");
  const logIcon = document.querySelector(".logReg svg");
  const profileImg = document.createElement("img");
  profileImg.classList.add("userImg");
  profileImg.style.width = "30px";
  profileImg.style.height = "30px";
  profileImg.style.borderRadius = "50%";

  const notLogged = document.querySelector(".NotLog");
  const loggedIn = document.querySelector(".DonLog");
  const logoutBtn = loggedIn.querySelector(".loginS[aria-label='الخروج']");

  // إغلاق البوب آب عند النقر خارجها
  document.addEventListener("click", (e) => {
    if (userToggle.checked && !logPopup.contains(e.target) && e.target !== userToggle && e.target !== logIcon && e.target !== profileImg) {
      userToggle.checked = false;
    }
  });

  // استماع لتغير حالة المستخدم
  auth.onAuthStateChanged((user) => {
    const labelIcon = document.querySelector(".logReg");

    if (user) {
      // لو المستخدم مسجل
      profileImg.src = user.photoURL ? user.photoURL : "https://www.gravatar.com/avatar/?d=mp";
      labelIcon.innerHTML = "";
      labelIcon.appendChild(profileImg);

      notLogged.classList.add("hidden");
      loggedIn.classList.remove("hidden");

    } else {
      // لو مش مسجل
      labelIcon.innerHTML = `
        <svg class='line' viewBox='0 0 24 24'>
          <path d='M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z'/>
          <path d='M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z'/>
          <path d='M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z'/>
        </svg>`;

      notLogged.classList.remove("hidden");
      loggedIn.classList.add("hidden");
    }
  });

  // تسجيل الخروج
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => {
      userToggle.checked = false;
    }).catch((error) => {
      console.error("فشل تسجيل الخروج:", error);
    });
  });

} else {
  console.warn("Firebase غير مهيأ في هذا القالب.");
}
