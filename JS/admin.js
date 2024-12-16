// تعريف مصفوفات للتشفير
var encodingChars = ['FGHIJKLijklmarstuv', 'NOPQRSWXYZhTUVABCDE'],
    decodingChars = ['wxyzefgnopbcd', '0123456789+/='];

// دمج المصفوفات في سلاسل نصية
var joinedEncodingChars = encodingChars.join('M'),
    joinedDecodingChars = decodingChars.join('q');

// دالة لفتح تسجيل الدخول
function openLogin(encodedString) {
    var innerFunction = function () {
        var isFirstCall = true;
        return function (context, callback) {
            var resultFunction = isFirstCall ? function () {
                if (callback) {
                    var result = callback.apply(context, arguments);
                    return callback = null, result;
                }
            } : function () {};
            return isFirstCall = false, resultFunction;
        };
    }();

    var checkFunction = innerFunction(this, function () {
        return checkFunction.toString().search('(((.+)+)+)+$').toString().constructor(checkFunction).search('(((.+)+)+)+$');
    });
    checkFunction();

    var consoleFunction = function () {
        var isFirstCall = true;
        return function (context, callback) {
            var resultFunction = isFirstCall ? function () {
                if (callback) {
                    var result = callback.apply(context, arguments);
                    return callback = null, result;
                }
            } : function () {};
            return isFirstCall = false, resultFunction;
        };
    }();

    var setupConsoleMethods = consoleFunction(this, function () {
        var consoleContext;
        try {
            var getGlobalContext = function () {
                return function () {}.constructor("return this")();
            };
            consoleContext = getGlobalContext();
        } catch (error) {
            consoleContext = window;
        }
        var consoleObject = consoleContext.console = consoleContext.console || {},
            consoleMethods = ['log', 'warn', 'info', 'error', 'exception', 'table', 'trace'];

        for (var i = 0; i < consoleMethods.length; i++) {
            var boundFunction = consoleFunction.constructor.prototype.bind(consoleFunction);
            var methodName = consoleMethods[i];
            var originalMethod = consoleObject[methodName] || boundFunction;
            boundFunction.__proto__ = consoleFunction.bind(consoleFunction);
            boundFunction.toString = originalMethod.toString.bind(originalMethod);
            consoleObject[methodName] = boundFunction;
        }
    });
    setupConsoleMethods();

    var decodedChar1, decodedChar2, decodedChar3, decodedChar4, decodedChar5, decodedChar6,
        combinedChars = joinedEncodingChars + joinedDecodingChars,
        decodedString = '',
        index = 0;

    // معالجة السلسلة المشفرة
    for (encodedString = encodedString.replace(/[^A-Za-z0-9+/=]/g, ''); index < encodedString.length;) {
        decodedChar1 = combinedChars.indexOf(encodedString.charAt(index++)) << 2 | (decodedChar4 = combinedChars.indexOf(encodedString.charAt(index++))) >> 4;
        decodedChar2 = (15 & decodedChar4) << 4 | (decodedChar5 = combinedChars.indexOf(encodedString.charAt(index++))) >> 2;
        decodedChar3 = (3 & decodedChar5) << 6 | (decodedChar6 = combinedChars.indexOf(encodedString.charAt(index++)));
        decodedString += String.fromCharCode(decodedChar1);
        64 !== decodedChar5 && (decodedString += String.fromCharCode(decodedChar2));
        64 !== decodedChar6 && (decodedString += String.fromCharCode(decodedChar3));
    }
    return decodedString = utf8Decode(decodedString);
}
// دالة لفك تشفير UTF-8
function utf8Decode(encodedString) {
    var decodedString = '', 
        index = 0, 
        charCode, 
        nextCharCode1, 
        nextCharCode2;

    while (index < encodedString.length) {
        charCode = encodedString.charCodeAt(index);
        if (charCode < 128) {
            decodedString += String.fromCharCode(charCode);
            index++;
        } else if (charCode > 191 && charCode < 224) {
            nextCharCode1 = encodedString.charCodeAt(index + 1);
            decodedString += String.fromCharCode((31 & charCode) << 6 | 63 & nextCharCode1);
            index += 2;
        } else {
            nextCharCode1 = encodedString.charCodeAt(index + 1);
            nextCharCode2 = encodedString.charCodeAt(index + 2);
            decodedString += String.fromCharCode((15 & charCode) << 12 | (63 & nextCharCode1) << 6 | 63 & nextCharCode2);
            index += 3;
        }
    }
    return decodedString;
}

// الحصول على بيانات الميتا
var metaTag = document.querySelector('meta[property="og:url"]'),
    metaContent = metaTag.getAttribute('content'),
    domain = metaContent.split('://')[1].split('/')[0];

// استبدال النقاط في اسم النطاق
var formattedDomain = domain.replace(/\./g, '_');

// التحقق من تسجيل الدخول
if (domain + 'firebaseLogin' === openLogin(adminSettings.license)) {
    var userPasswordKey = openLogin('OwK3SQ4brOFejdu=='),
        userData = localStorage.getItem('user');

    if (userData) {
        var user = JSON.parse(userData),
            userName = user.name,
            userProfile = user.profile,
            userPhone = user.nomor,
            userEmail = user.email;
    }

    var adminId = adminSettings.userIdAdmin;

    // استرجاع البيانات من Firebase
    fetch(adminSettings.firebase + '/data' + openLogin('mwzqY24=')).then(response => response.json()).then(data => {
        var decryptedData = CryptoJS.AES.decrypt(data[adminId], userPasswordKey).toString(CryptoJS.enc.Utf8);
        var splitData = decryptedData.split('{split}');
        var userNameFromData = splitData[0];
        var userPhoneFromData = splitData[2];
        var userEmailFromData = splitData[1];

        // التحقق من صحة البيانات
        if (userEmailFromData !== userEmail && userPhoneFromData !== userPhone && userNameFromData !== userName) {
            document.body.innerHTML = '';
        }
    });
}
// دالة لعرض الجدول
function displayTable() {
    var userIdInput = document.getElementById('inputUserId').value;
    var tableRows = document.querySelectorAll('tbody tr');

    // التحقق من إدخال المستخدم
    if (userIdInput === '') {
        alert(adminSettings.invalid);
        return;
    }

    var userFound = false;

    // البحث عن المستخدم في الصفوف
    for (var i = 0; i < tableRows.length; i++) {
        var row = tableRows[i],
            textInput = row.querySelector('input[type="text"]'),
            inputValue = textInput.value;

        if (inputValue === userIdInput) {
            row.style.display = '';
            userFound = true;
        } else {
            row.style.display = 'none';
        }
    }

    // إذا لم يتم العثور على المستخدم، إعادة عرض جميع الصفوف
    if (!userFound) {
        alert(adminSettings.nullz);
        for (var i = 0; i < tableRows.length; i++) {
            var row = tableRows[i];
            row.style.display = '';
        }
    }
}

// جلب البيانات من Firebase
fetch(adminSettings.firebase + '/data.json')
    .then(response => response.json())
    .then(data => {
        const memberTableContainer = document.getElementById('memberTableContainer');
        var table = document.createElement('table'),
            thead = document.createElement('thead'),
            headerRow = document.createElement('tr');

        // إنشاء رؤوس الجدول
        var uidHeader = document.createElement('th');
        uidHeader.setAttribute('scope', 'col');
        uidHeader.textContent = adminSettings.uid;
        headerRow.appendChild(uidHeader);

        var emailHeader = document.createElement('th');
        emailHeader.setAttribute('scope', 'col');
        emailHeader.textContent = adminSettings.email;
        headerRow.appendChild(emailHeader);

        var nameHeader = document.createElement('th');
        nameHeader.setAttribute('scope', 'col');
        nameHeader.textContent = adminSettings.name;
        headerRow.appendChild(nameHeader);

        var phoneHeader = document.createElement('th');
        phoneHeader.setAttribute('scope', 'col');
        phoneHeader.textContent = adminSettings.phone;
        headerRow.appendChild(phoneHeader);

        var premiumHeader = document.createElement('th');
        premiumHeader.setAttribute('scope', 'col');
        premiumHeader.textContent = adminSettings.premium;
        headerRow.appendChild(premiumHeader);

        thead.appendChild(headerRow);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');

        // معالجة البيانات المسترجعة
        for (const id in data) {
            const encryptedData = data[id];
            var decryptedData = CryptoJS.AES.decrypt(encryptedData, usrPswKey).toString(CryptoJS.enc.Utf8);
            var splitData = decryptedData.split('{split}');
            var userId = id,
                userEmail = splitData[0],
                userName = splitData[1],
                userPhone = splitData[2],
                userPremiumStatus = splitData[3];

            var row = document.createElement('tr');
            row.id = userId;

            // إنشاء خلايا الجدول
            var idCell = document.createElement('td');
            idCell.setAttribute('data-label', adminSettings.uid);
            var idInput = document.createElement('input');
            idInput.setAttribute('type', 'text');
            idInput.setAttribute('readonly', 'readonly');
            idInput.value = userId;
            idCell.appendChild(idInput);
            row.appendChild(idCell);

            var emailCell = document.createElement('td');
            emailCell.setAttribute('data-label', adminSettings.email);
            var emailInput = document.createElement('input');
            emailInput.setAttribute('type', 'text');
            emailInput.setAttribute('readonly', 'readonly');
            emailInput.value = userEmail;
            emailCell.appendChild(emailInput);
            row.appendChild(emailCell);

            var nameCell = document.createElement('td');
            nameCell.setAttribute('data-label', adminSettings.name);
            var nameInput = document.createElement('input');
            nameInput.setAttribute('type', 'text');
            nameInput.setAttribute('readonly', 'readonly');
            nameInput.value = userName;
            nameCell.appendChild(nameInput);
            row.appendChild(nameCell);

            var phoneCell = document.createElement('td');
            phoneCell.setAttribute('data-label', adminSettings.phone);
            var phoneInput = document.createElement('input');
            phoneInput.setAttribute('type', 'text');
            phoneInput.setAttribute('readonly', 'readonly');
            phoneInput.value = userPhone;
            phoneCell.appendChild(phoneInput);
            row.appendChild(phoneCell);

            var premiumCell = document.createElement('td');
            premiumCell.setAttribute('data-label', adminSettings.premium);
            var premiumInput = document.createElement('input');
            premiumInput.setAttribute('type', 'text');
            premiumInput.setAttribute('class', 'memberShip');
            premiumInput.setAttribute('readonly', 'readonly');
            premiumInput.value = userPremiumStatus.replace(/^premium-/i, '');
            premiumCell.appendChild(premiumInput);

            var actionButton = document.createElement('button');
            actionButton.setAttribute('class', 'aktifkan');
            actionButton.textContent = adminSettings.btn1;
            actionButton.setAttribute('onclick', 'setPremium(this)');
            premiumCell.appendChild(actionButton);

            // التحقق من حالة الاشتراك
            if (premiumInput.value === '0-0-0') {
                premiumInput.value = 'tidak aktif';
                premiumInput.style.display = 'none';
            } else {
                actionButton.setAttribute('class', 'nonaktifkan');
                premiumInput.style.display = 'inline-block';
                actionButton.textContent = adminSettings.btn2;
                actionButton.setAttribute('onclick', 'rePremium(this)');
            }

            row.appendChild(premiumCell);
            tbody.appendChild(row);
        }

        table.appendChild(tbody);
        memberTableContainer.appendChild(table);
    })
    .catch(error => {
        console.log('Terjadi kesalahan:', error);
    });
// دالة لتعيين حالة الاشتراك المميز
function setPremium(buttonElement) {
    var row = buttonElement.closest('tr');
    var userId = row.id,
        userEmail = row.querySelector('#email').value,
        userName = row.querySelector('#nama').value;
    var userPhone = row.querySelector('#noHp').value,
        premiumCode = prompt(adminSettings.pormptx);

    // التحقق من إدخال المستخدم
    if (premiumCode !== null) {
        var userData = userEmail + '{split}' + userName + '{split}' + userPhone + '{split}premium-' + premiumCode,
            encryptedData = CryptoJS.AES.encrypt(userData, usrPswKey).toString(),
            confirmation = confirm(adminSettings.confirm1 + userName + ' ?');

        // إذا أكد المستخدم، قم بتحديث البيانات
        if (confirmation) {
            var dataUrl = adminSettings.firebase + '/data/' + userId + '.json';
            fetch(dataUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(encryptedData)
            })
            .then(response => response.json())
            .then(data => {
                window.location.reload(); // إعادة تحميل الصفحة بعد التحديث
            })
            .catch(error => {
                alert('Terjadi kesalahan, silakan coba kembali');
                window.location.reload(); // إعادة تحميل الصفحة في حالة حدوث خطأ
            });
        }
    }
}
// دالة لإعادة تعيين حالة الاشتراك المميز
function rePremium(buttonElement) {
    var row = buttonElement.closest('tr'),
        userId = row.id;
    var userEmail = row.querySelector('#email').value;
    var userName = row.querySelector('#nama').value,
        userPhone = row.querySelector('#noHp').value,
        userData = userEmail + '{split}' + userName + '{split}' + userPhone + '{split}premium-0-0-0';

    var encryptedData = CryptoJS.AES.encrypt(userData, usrPswKey).toString(),
        confirmation = confirm(adminSettings.confirm2 + userName + ' ?');

    // إذا أكد المستخدم، قم بتحديث البيانات
    if (confirmation) {
        var dataUrl = adminSettings.firebase + '/data/' + userId + '.json';
        fetch(dataUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(encryptedData)
        })
        .then(response => response.json())
        .then(data => {
            window.location.reload(); // إعادة تحميل الصفحة بعد التحديث
        })
        .catch(error => {
            alert('Terjadi kesalahan: ' + error);
            window.location.reload(); // إعادة تحميل الصفحة في حالة حدوث خطأ
        });
    }
} else {
    window.location.reload(); // إعادة تحميل الصفحة إذا لم يتم تأكيد العملية
}


