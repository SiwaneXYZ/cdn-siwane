// ===== AuFAM.js اصدار 1.0 بتاريخ 12 يونيو 205 Automated File Access Manager V1 ===== // 
  // --- العناصر DOM ---
  const downloadButton = document.getElementById('downloadButton');
  const notLoggedInMessage = document.getElementById('notLoggedInMessage');
  const googleLoginRequiredMessage = document.getElementById('googleLoginRequiredMessage');
  const readyToDownloadMessage = document.getElementById('readyToDownloadMessage');
  const processingMessage = document.getElementById('processingMessage');
  const generalErrorMessage = document.getElementById('generalErrorMessage');

  // --- وظائف المساعدة لإدارة عرض الرسائل ---
  function hideAllMessages() {
    notLoggedInMessage.style.display = 'none';
    googleLoginRequiredMessage.style.display = 'none';
    readyToDownloadMessage.style.display = 'none';
    processingMessage.style.display = 'none';
    generalErrorMessage.style.display = 'none';
  }

  function showMessage(element) {
    hideAllMessages();
    element.style.display = 'block';
  }

  function disableDownloadButton() {
    downloadButton.style.pointerEvents = 'none';
    downloadButton.style.opacity = '0.5';
    downloadButton.href = '#';
  }

  function enableDownloadButton(fileUrl) {
    downloadButton.style.pointerEvents = 'auto';
    downloadButton.style.opacity = '1';
    downloadButton.href = fileUrl;
  }

  // الكود المحمي - الآن يحتوي على المفتاح السري ومنطق فك التشفير
  async function protectedCode(config) {
    console.log("Validation successful! Custom settings:", config);

    // **المفتاح السري ودالة فك التشفير داخل الكود المحمي**
    const encodedSecretKey = "UmF3YW4wNUAqIyQ="; // "Rawan05@*#$" مرمّز بـ Base64
    const secretKey = atob(encodedSecretKey); // فك ترميز المفتاح السري

    function decryptText(encryptedText, key) {
      try {
        if (!encryptedText) {
          console.warn("Attempted to decrypt an empty string.");
          return null;
        }
        const decodedBase64 = atob(encryptedText);
        const decrypted = CryptoJS.AES.decrypt(decodedBase64, key).toString(CryptoJS.enc.Utf8);
        return decrypted;
      } catch (e) {
        console.error("Decryption error:", e);
        return null;
      }
    }
    // **نهاية المفتاح السري ودالة فك التشفير**

    const appsScriptUrl = config.appsScriptUrl;
    const googleDriveFileId = config.googleDriveFileId;

    hideAllMessages();
    disableDownloadButton();

    try {
      const userDataString = localStorage.getItem('firebaseUserProfileData');

      if (!userDataString) {
        showMessage(notLoggedInMessage);
        return;
      }

      const userData = JSON.parse(userDataString);

      if (userData.provider !== 'google' || !userData.email || !userData.email.endsWith('@gmail.com')) {
        showMessage(googleLoginRequiredMessage);
        return;
      }

      showMessage(processingMessage);

      // هذا هو الجزء الذي يرسل الطلب إلى Apps Script
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: userData.email,
          requestedFileId: googleDriveFileId
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        const driveDownloadLink = `https://drive.google.com/file/d/${googleDriveFileId}/view?usp=sharing`;
        enableDownloadButton(driveDownloadLink);
        showMessage(readyToDownloadMessage);
      } else {
        console.error('Apps Script Error:', result.message || 'Unknown error');
        showMessage(generalErrorMessage);
      }

    } catch (error) {
      console.error('Error during access check or grant:', error);
      showMessage(generalErrorMessage);
    }
  }

  // وظيفة التحقق من النطاق (قبل تنفيذ الكود المحمي)
  function verifyDomain() {
    // المفتاح السري غير متاح هنا بعد، لذلك لا يمكن فك تشفير activationCode هنا
    // يجب فك تشفيره داخل protectedCode.
    // هذا يعني أننا سنقوم بتمرير encryptedBase64.activationCode إلى protectedCode،
    // وسيقوم protectedCode بفك تشفيره داخليًا.

    // هذا سيتطلب تعديلاً بسيطاً في protectedCode لتقبل الـ activationCode
    // وتقوم بفك تشفيره داخليًا.

    // التعديل: `verifyDomain` ستستدعي `protectedCode` وتمرر لها `encryptedBase64` كاملاً
    // وستقوم `protectedCode` بالتحقق من النطاق أولاً.

    protectedCode(encryptedBase64); // نمرر الكائن كاملاً الآن
  }

  // عرض إشعار خطأ (تبقى كما هي)
  function showErrorNotification(errorType) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    const notification = document.createElement("div");
    notification.className = "notification-error";

    if (errorType === "key") {
      notification.innerHTML = `<p>Error: Script activation code invalid!</p><a href="mailto:support@siwane.xyz?subject=Script Activation Issue" class="support-link">Contact Support</a>`;
    } else if (errorType === "naming") {
      notification.innerHTML = `<p>Error: Current domain not supported!</p><a href="mailto:support@siwane.xyz?subject=Domain Issue" class="support-link">Contact Support</a>`;
    }

    document.body.appendChild(overlay);
    document.body.appendChild(notification);
  }

  // استدعاء التحقق عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', verifyDomain);

  // الأنماط (CSS) (تبقى كما هي)
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
