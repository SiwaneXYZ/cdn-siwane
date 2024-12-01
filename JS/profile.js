// صفحة الملف الشخصي - آخر تحديث: 06-05-2024 21:06
var kyO = ['FGHIJKLijklmarstuv', 'NOPQRSWXYZhTUVABCDE'];
var kyT = ['wxyzefgnopbcd', '0123456789+/='];
var jkyO = kyO.join('M');
var jkyT = kyT.join('q');

// دالة لفك تشفير بيانات الدخول
function loginOpen(data) {
  var decoded = '';
  var index = 0;
  var combinedChars = jkyO + jkyT;

  // إزالة الرموز غير المطلوبة
  data = data.replace(/[^A-Za-z0-9+/=]/g, '');

  while (index < data.length) {
    var char1 = combinedChars.indexOf(data.charAt(index++)) << 2 | (char2 = combinedChars.indexOf(data.charAt(index++))) >> 4;
    var char3 = (char2 & 0xF) << 4 | (char4 = combinedChars.indexOf(data.charAt(index++))) >> 2;
    var char5 = (char4 & 0x3) << 6 | (char6 = combinedChars.indexOf(data.charAt(index++)));

    decoded += String.fromCharCode(char1);
    if (char4 !== 0x40) decoded += String.fromCharCode(char3);
    if (char6 !== 0x40) decoded += String.fromCharCode(char5);
  }

  // فك تشفير الـ UTF-8
  return utf8Decode(decoded);
}

// دالة لتحويل التشفير إلى UTF-8
function utf8Decode(str) {
  var result = '';
  var i = 0;
  while (i < str.length) {
    var byte1 = str.charCodeAt(i++);
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else {
      var byte2 = str.charCodeAt(i++);
      if (byte1 >= 0xC0 && byte1 <= 0xDF) {
        result += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
      } else {
        var byte3 = str.charCodeAt(i++);
        result += String.fromCharCode(((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F));
      }
    }
  }
  return result;
}

// التعامل مع بيانات الملف الشخصي
var myMeta = document.querySelector('meta[property="og:url"]');
var mContent = myMeta.getAttribute('content');
var splitmContent = mContent.split('://')[1].split('/')[0];
var contentFnsh = splitmContent.replace(/\./g, '_');

// إذا كان المستخدم قد سجل دخوله
if (splitmContent + 'firebaseLogin') {
  var usrPswKey = loginOpen('OwK3SQ4brOFejdu==');
  
  if (localStorage.getItem('user') === null) {
    window.location.href = profileSettings.redirect;
  }

  var userData = localStorage.getItem('user');
  if (userData) {
    var user = JSON.parse(userData);
    var userId = user.uid;
    var userName = user.name;
    var userPhone = user.nomor;
    var userEmail = user.email;
    var userMembership = user.membership;

    // التحكم في عرض البيانات بناءً على الاشتراك
    var wrapPremium = document.querySelector('#paket-premium-wrap');
    var inPremium = document.querySelector('#paket-premium');
    
    async function getCurrentDate() {
      try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
        if (!response.ok) throw new Error('فشل في تحميل البيانات');
        const data = await response.json();
        return data.datetime.slice(0, 10);
      } catch (error) {
        console.error(error);
      }
    }

    getCurrentDate().then(currentDate => {
      const today = new Date().toISOString().slice(0, 10);
      if (currentDate > today) {
        var storedUser = localStorage.getItem('user');
        if (storedUser) {
          var membershipDate = JSON.parse(storedUser).membership;
          var formattedDate = 'premium-' + today.split('-')[2] + '-' + today.split('-')[1] + '-' + today.split('-')[0];
          user.membership = formattedDate;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    });

    // تحديث الاشتراك من قاعدة البيانات
    fetch(firebaseConfig.databaseURL + '/data' + loginOpen('mwzqY24='))
      .then(response => response.json())
      .then(data => {
        var decryptedData = CryptoJS.AES.decrypt(data[userId], usrPswKey).toString(CryptoJS.enc.Utf8);
        var userDetails = decryptedData.split('{split}');
        var expiryDate = userDetails[3].replace(/^premium-/i, '');
        var [day, month, year] = expiryDate.split(/[- :]/);
        
        // حساب ما إذا كان الاشتراك قد انتهى
        var expiry = new Date(year, month - 1, day);
        var current = new Date();
        if (expiry <= current) {
          wrapPremium.classList.add('hidden');
        } else {
          inPremium.value = profileSettings.memberShipAktif + expiryDate;
          wrapPremium.classList.remove('hidden');
        }
      }).catch(error => {
        console.error(error);
        wrapPremium.classList.add('hidden');
      });

    // تحديث بيانات المستخدم في الصفحة
    document.querySelector('#email').value = user.email;
    document.querySelector('#nama').value = user.name || profileSettings.empty;
    document.querySelector('#noHp').value = user.nomor || profileSettings.empty;
    document.querySelector('#uId').value = user.uid;

    // عرض صورة الملف الشخصي إذا كانت موجودة
    if (user.profile && user.profile.startsWith('https://')) {
      var imgElement = document.createElement('img');
      imgElement.src = user.profile;
      imgElement.alt = user.name;
      var parentElement = document.querySelector('.profile');
      parentElement.innerHTML = '';
      parentElement.appendChild(imgElement);
    }
  }

  // تفعيل زر تعديل البيانات
  document.querySelector('.editData').addEventListener('click', editDataProfileP);

  // دالة لتعديل بيانات الملف الشخصي
  function editDataProfileP() {
    document.querySelector('#noHp').toggleAttribute('disabled');
    document.querySelector('#nama').toggleAttribute('disabled');
    document.querySelector('.editData').classList.toggle('hidden');
    document.querySelector('.logout').classList.toggle('hidden');
    document.querySelector('.perbarui').classList.toggle('hidden');
    document.querySelector('.batal').classList.toggle('hidden');
    document.querySelector('kbd').classList.toggle('hidden');
  }
}
