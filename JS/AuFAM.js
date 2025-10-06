// ===== AuFAM.js اصدار 1.0 بتاريخ 12 يونيو 205 Automated File Access Manager V1 ===== // 
  
  // فك تشفير النص المشفر باستخدام CryptoJS
  function decryptText(encryptedText, key) {
    try {
      const decodedBase64 = atob(encryptedText);
      const decrypted = CryptoJS.AES.decrypt(decodedBase64, key).toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (e) {
      return null;
    }
  }

  // المفتاح السري مرمّز بـ Base64
  const encodedSecretKey = "UmF3YW4wNUAqIyQ="; // "Rawan05@*#$" مشفر بـ Base64
  const secretKey = atob(encodedSecretKey);

  // دالة عرض رسالة خطأ
  function showErrorNotification(errorType) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    const notification = document.createElement("div");
    notification.className = "notification-error";

    if (errorType === "key") {
      notification.innerHTML = `
        <p>خطأ: رمز التفعيل غير صحيح!</p>
        <a href="mailto:support@siwane.xyz?subject=مشكلة في رمز التفعيل" class="support-link">اتصل بالدعم</a>
      `;
    } else if (errorType === "naming") {
      notification.innerHTML = `
        <p>خطأ: النطاق الحالي غير مدعوم!</p>
        <a href="mailto:support@siwane.xyz?subject=مشكلة في النطاق" class="support-link">اتصل بالدعم</a>
      `;
    }

    document.body.appendChild(overlay);
    document.body.appendChild(notification);
  }

  // دالة الكود المحمي - توضع هنا سكربتك الأصلي
  function protectedCode(config) {
    console.log("تم التحقق بنجاح! الإعدادات:", config);

    // *** هنا تبدأ سكربت التحميل الخاص بك *** 

    document.addEventListener('DOMContentLoaded', function() {
      const downloadBoxes = document.querySelectorAll('.dlBox');
      const webAppUrl = config.googleAppsScriptUrl;

      const firebaseUserProfileData = localStorage.getItem('firebaseUserProfileData');
      let userEmail = null;

      try {
        if (firebaseUserProfileData) {
          const userData = JSON.parse(firebaseUserProfileData);
          userEmail = userData.email;
        }
      } catch (e) {
        console.error("Error parsing firebaseUserProfileData:", e);
      }

      function displayMessage(dlBoxId, message, isError = false) {
        const messageElement = document.getElementById(`message${dlBoxId.replace('downloadBox', '')}`);
        const errorMessageElement = document.getElementById(`errorMessage${dlBoxId.replace('downloadBox', '')}`);

        if (messageElement) { messageElement.textContent = ''; messageElement.style.display = 'none'; }
        if (errorMessageElement) { errorMessageElement.textContent = ''; errorMessageElement.style.display = 'none'; }

        if (isError) {
          if (errorMessageElement) {
            errorMessageElement.innerHTML = message;
            errorMessageElement.style.display = 'block';
          }
        } else {
          if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.display = 'block';
          }
        }
      }

      function clearMessages(dlBoxId) {
        const messageElement = document.getElementById(`message${dlBoxId.replace('downloadBox', '')}`);
        const errorMessageElement = document.getElementById(`errorMessage${dlBoxId.replace('downloadBox', '')}`);
        if (messageElement) { messageElement.textContent = ''; messageElement.style.display = 'none'; }
        if (errorMessageElement) { errorMessageElement.textContent = ''; errorMessageElement.style.display = 'none'; }
      }

      downloadBoxes.forEach(dlBox => {
        const dlBoxId = dlBox.id;
        const button = dlBox.querySelector('.button');
        const fileId = button ? button.dataset.fileId : null;
        const originalButtonIcon = button ? button.innerHTML : null;

        clearMessages(dlBoxId);

        if (!button || !fileId) {
          if (button) {
            button.href = '#';
            button.target = '_self';
            button.style.pointerEvents = 'none';
            button.innerHTML = '<i class="icon warnS"></i>';
          }
          displayMessage(dlBoxId, 'خطأ في إعداد الملف. يرجى <a href="https://m.me/elhizazi1" target="_blank" rel="noopener noreferrer">الاتصال بالمسؤول</a>.', true);
          return;
        }

        if (!userEmail) {
          button.href = '#';
          button.target = '_self';
          button.style.pointerEvents = 'none';
          displayMessage(dlBoxId, 'انا اهمل جميع طلبات اذن الوصول لهدا الملف يرجى <a href="/p/login.html"><b>تسجيل الدخول</b></a> للوصول إليه تاكد من انك سجلت الدخول عن طريق حساب جوجل او ان نهاية بريدك الالكتروني <b>@gmail.com</b> سيتم اضافة اذونات الوصول تلقائيا لحسابك <b>Gmail</b>.', true);
          return;
        }

        if (!userEmail.endsWith('@gmail.com')) {
          button.href = '#';
          button.target = '_self';
          button.style.pointerEvents = 'none';
          displayMessage(dlBoxId, `الوصول متاح فقط لبريد Gmail.<br/> بريدك الحالي هو: <b>${userEmail}</b>. يرجى التأكد من أنك سجلت الدخول عن طريق حساب جوجل أو أن نهاية بريدك الإلكتروني <b>@gmail.com</b>. يرجى <a href="/p/login.html"><b>تسجيل الدخول</b></a> بحساب Gmail أو <a href="https://m.me/elhizazi1" target="_blank" rel="noopener noreferrer"><b>الاتصال بالمسؤول</b></a> للمساعدة.`, true);
          return;
        }

        button.href = '#';
        button.target = '_self';
        button.innerHTML = originalButtonIcon;
        button.style.pointerEvents = 'auto';

        button.addEventListener('click', function(event) {
          event.preventDefault();

          clearMessages(dlBoxId);
          displayMessage(dlBoxId, 'جار التحقق من الصلاحيات...', false);

          const currentButton = this;
          currentButton.innerHTML = '<i class="icon spinS"></i>';
          currentButton.style.pointerEvents = 'none';

          fetch(webAppUrl, {
              method: 'POST',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: 'email=' + encodeURIComponent(userEmail) + '&fileId=' + encodeURIComponent(fileId)
            })
            .then(response => {
              if (!response.ok) {
                return response.text().then(text => { throw new Error(`Status ${response.status}: ${text}`); });
              }
              return response.json();
            })
            .then(data => {
              if (data.status === 'success' || data.status === 'info') {
                displayMessage(dlBoxId, 'تم التحقق بنجاح. جاري التوجيه للتنزيل...', false);
                if (data.downloadUrl && data.fileName) {
                  const a = document.createElement('a');
                  a.href = data.downloadUrl;
                  a.download = data.fileName;
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } else {
                  displayMessage(dlBoxId, 'تم منح الصلاحية، ولكن رابط التنزيل أو اسم الملف غير متوفر. يرجى <a href="https://m.me/elhizazi1" target="_blank" rel="noopener noreferrer"><b>الاتصال بالمسؤول</b></a>.', true);
                }
              } else {
                displayMessage(dlBoxId, 'فشل منح حق الوصول: ' + data.message + ' يرجى <a href="https://m.me/elhizazi1" target="_blank" rel="noopener noreferrer"><b>الاتصال بالمسؤول</b></a> للمساعدة.', true);
              }
            })
            .catch(error => {
              console.error('Error:', error);
              displayMessage(dlBoxId, 'حدث خطأ أثناء محاولة منح حق الوصول. يرجى المحاولة مرة أخرى لاحقًا أو <a href="https://m.me/elhizazi1" target="_blank" rel="noopener noreferrer"><b>الاتصال بالمسؤول</b></a>.', true);
            })
            .finally(() => {
              currentButton.innerHTML = originalButtonIcon;
              currentButton.style.pointerEvents = 'auto';
              setTimeout(() => clearMessages(dlBoxId), 5000);
            });
        });
      });
    });
    // *** نهاية سكربت التحميل ***
  }

  // دالة التحقق من النطاق وتشغيل الكود المحمي
  function verifyDomain() {
    const decryptedText = decryptText(encryptedBase64.activationCode, secretKey);
    if (decryptedText) {
      const currentDomain = window.location.hostname.replace(/^www\./, '');
      const cleanDecryptedText = decryptedText.replace(/^www\./, '');
      if (currentDomain === cleanDecryptedText) {
        protectedCode(encryptedBase64.customSettings);
      } else {
        showErrorNotification("naming");
      }
    } else {
      showErrorNotification("key");
    }
  }

  verifyDomain();

  // الكود الإضافي لعرض الإشعارات وأسلوب التصميم
  const style = `
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.7);
      z-index: 999;
      backdrop-filter: blur(5px);
    }
    .notification-error {
      background-color: #f8d7da;
      color: #721c24;
      padding: 20px;
      text-align: center;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      font-weight: bold;
      font-size: 18px;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: slideIn 0.5s ease-in-out;
      z-index: 1000;
      width: 80%;
      max-width: 500px;
    }
    .support-link {
      display: block;
      margin-top: 15px;
      padding: 10px;
      background-color: #25d366;
      color: white;
      text-decoration: none;
      font-weight: bold;
      border-radius: 5px;
      text-align: center;
    }
    .support-link:hover {
      background-color: #128c7e;
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = style;
  document.head.appendChild(styleSheet);
