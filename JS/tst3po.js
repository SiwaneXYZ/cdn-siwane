
  // تأكد من تطابق هذه المفاتيح مع تلك الموجودة في سكربت صفحة النقاط
  const articleAppConfig = {
    pointsPageUrl: '/p/points-5.html', // !!! عنوان URL الفعلي لصفحة النقاط الخاصة بك !!!
    requiredDurationMillis: 60 * 1000, // المدة المطلوبة بالمللي ثانية لقراءة المقال (1 دقيقة)
    localStorageKeys: {
        flowStarted: 'articlePointsFlow',
        startTime: 'articleStartTime',
        completed: 'articleCompleted'
    },
    notificationId: 'articlePointsNotification',
    notificationMessageId: 'notificationMessage'
  };

  let redirectTimeout;
  let notificationElement = null;
  let notificationMessageElement = null;
  let durationCheckInterval;


  function clearArticleStartLocalStorageFlags() {
       console.log("Article Script: Clearing article START localStorage flags (flowStarted, startTime).");
      try {
          localStorage.removeItem(articleAppConfig.localStorageKeys.flowStarted);
          localStorage.removeItem(articleAppConfig.localStorageKeys.startTime);
           console.log("Article Script: Article START localStorage flags cleared.");
      } catch(e) {
          console.error("Article Script: Error clearing article START localStorage flags:", e);
      }
  }

   function clearAllArticleLocalStorageFlags() {
       console.log("Article Script: Clearing ALL article localStorage flags.");
        try {
            localStorage.removeItem(articleAppConfig.localStorageKeys.flowStarted);
            localStorage.removeItem(articleAppConfig.localStorageKeys.startTime);
            localStorage.removeItem(articleAppConfig.localStorageKeys.completed);
             console.log("Article Script: ALL article localStorage flags cleared.");
        } catch(e) {
            console.error("Article Script: Error clearing ALL article localStorage flags:", e);
        }
    }

    function formatMillisToMinutesSeconds(millis) {
        const totalSeconds = Math.ceil(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

   function createAndAppendNotification() {
       console.log("Article Script: Creating and appending notification element.");
       notificationElement = document.createElement('div');
       notificationElement.id = articleAppConfig.notificationId;
        notificationElement.style.display = 'flex';
        notificationElement.style.position = 'fixed';
        notificationElement.style.bottom = '20px';
        notificationElement.style.right = '20px';
        notificationElement.style.left = '20px'; /* لتحسين العرض على الجوال */
        notificationElement.style.maxWidth = '400px'; /* تحديد عرض أقصى */
        notificationElement.style.margin = '0 auto'; /* توسيط */
        notificationElement.style.backgroundColor = '#f8f9fa';
        notificationElement.style.color = '#212529';
        notificationElement.style.padding = '15px';
        notificationElement.style.borderRadius = '5px';
        notificationElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notificationElement.style.zIndex = '1000';
        notificationElement.style.textAlign = 'center';
        notificationElement.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        notificationElement.style.transform = 'translateY(100%)';
        notificationElement.style.opacity = '0';
        notificationElement.style.display = 'none'; // إخفاء مبدئي
        notificationElement.style.flexDirection = 'column'; // لترتيب المحتوى عمودياً


       notificationMessageElement = document.createElement('p');
       notificationMessageElement.id = articleAppConfig.notificationMessageId;
        notificationMessageElement.style.margin = '0';
        notificationMessageElement.style.fontSize = '0.9em';
        notificationMessageElement.style.fontWeight = 'bold';


       notificationElement.appendChild(notificationMessageElement);
       document.body.appendChild(notificationElement);

        // إضافة CSS بسيط للتحكم في ظهور الإشعار
        const style = document.createElement('style');
        style.innerHTML = `
            #${articleAppConfig.notificationId}.is-visible {
                transform: translateY(0);
                opacity: 1;
                 display: flex; /* للتأكد من الظهور كـ flex */
            }
        `;
        document.head.appendChild(style);


        console.log("Article Script: Notification element created and appended.");
   }

   function showNotification() {
       if (notificationElement) {
            notificationElement.style.display = 'flex'; // تأكد من تغيير display قبل التحويل
            setTimeout(() => { // إضافة تأخير بسيط للسماح بتطبيق display: flex
                 notificationElement.classList.add('is-visible');
                 console.log("Article Script: Showing notification.");
            }, 50); // تأخير صغير جداً
       }
   }

   function hideAndRemoveNotification() {
        if (notificationElement) {
            notificationElement.classList.remove('is-visible');
             console.log("Article Script: Hiding notification.");
            notificationElement.addEventListener('transitionend', function handler() {
                if (notificationElement && notificationElement.parentNode) {
                     notificationElement.parentNode.removeChild(notificationElement);
                     console.log("Article Script: Notification element removed from DOM.");
                }
                notificationElement.removeEventListener('transitionend', handler);
                 notificationElement = null;
                 notificationMessageElement = null;
            });
            // Fallback for cases where transitionend doesn't fire
            setTimeout(() => {
                 if (notificationElement && notificationElement.parentNode) {
                     if (!notificationElement.classList.contains('is-visible')) { // تحقق مرة أخرى للتأكد من أنه لم يختف بالانتقال
                          notificationElement.parentNode.removeChild(notificationElement);
                           console.log("Article Script: Notification element fallback removed from DOM.");
                           notificationElement = null;
                           notificationMessageElement = null;
                     }
                 }
            }, 500); // أطول قليلاً من مدة الانتقال
        }
   }


  document.addEventListener('DOMContentLoaded', () => {
      console.log("Article Page: DOMContentLoaded fired.");

      notificationElement = document.getElementById(articleAppConfig.notificationId); // حاول العثور عليه أولاً
      notificationMessageElement = document.getElementById(articleAppConfig.notificationMessageId);


      const flowStarted = localStorage.getItem(articleAppConfig.localStorageKeys.flowStarted);
      const startTimeString = localStorage.getItem(articleAppConfig.localStorageKeys.startTime);


      console.log("Article Page: Checking localStorage for flow flags:", {
          flowStarted: flowStarted,
          startTime: startTimeString
      });

      if (flowStarted === 'true' && startTimeString) {
          console.log("Article Page: Article points flow detected. Initializing tracking and notification.");

          const startTime = parseInt(startTimeString);
          // !!! إضافة فحص إضافي لقيمة startTime بعد التحويل !!!
          if (isNaN(startTime) || startTime <= 0) {
              console.error("Article Script: startTime from localStorage is invalid or zero. Clearing flags and exiting flow.", startTime);
               clearAllArticleLocalStorageFlags();
               // إخفاء أو إزالة الإشعار إذا تم إنشاؤه ولكن التدفق غير صالح
               if (notificationElement) hideAndRemoveNotification();
              return;
          }
           console.log("Article Script: Using valid startTime:", startTime);


           if (!notificationElement || !notificationMessageElement) {
                createAndAppendNotification();
           }
           showNotification();


           notificationMessageElement.textContent = `اقرأ لمدة دقيقة واحدة لكسب نقطة. ستتم إعادة التوجيه تلقائياً بعد قضاء الوقت المطلوب.`;

           // !!! إضافة تسجيل داخل setInterval !!!
           durationCheckInterval = setInterval(() => {
               const currentTime = Date.now();
               const timeSpent = currentTime - startTime; // حساب المدة المنقضية
               const timeRemainingMillis = Math.max(0, articleAppConfig.requiredDurationMillis - timeSpent);
               const formattedTimeRemaining = formatMillisToMinutesSeconds(timeRemainingMillis);

                // تسجيل القيم الهامة في كل ثانية
               console.log(`Article Script (Interval): startTime=${startTime}, currentTime=${currentTime}, timeSpent=${timeSpent}, requiredDuration=${articleAppConfig.requiredDurationMillis}, timeRemaining=${timeRemainingMillis}`);


                notificationMessageElement.textContent = `اقرأ لمدة دقيقة واحدة لكسب نقطة. الوقت المتبقي: ${formattedTimeRemaining}. ستتم إعادة التوجيه تلقائياً.`;


               if (timeSpent >= articleAppConfig.requiredDurationMillis) {
                   console.log("Article Script: Required duration met!");

                   // *** تسجيل وفحص حالة علامة الإكمال قبل محاولة تعيينها ***
                   const currentCompletedState = localStorage.getItem(articleAppConfig.localStorageKeys.completed);
                   console.log(`Article Script: Current '${articleAppConfig.localStorageKeys.completed}' state before setting: ${currentCompletedState}`);


                   // Set the completion flag in localStorage if not already set
                   if (currentCompletedState !== 'true') {
                       try {
                           localStorage.setItem(articleAppConfig.localStorageKeys.completed, 'true');
                            console.log(`Article Script: ✅ localStorage flag '${articleAppConfig.localStorageKeys.completed}' set to 'true'.`); // تسجيل إضافي للنجاح

                           // تأكيد القيمة بعد التعيين مباشرة
                           const confirmedCompletedState = localStorage.getItem(articleAppConfig.localStorageKeys.completed);
                            console.log(`Article Script: Confirmed '${articleAppConfig.localStorageKeys.completed}' state AFTER setting: ${confirmedCompletedState}`);


                           notificationMessageElement.textContent = `تهانينا! لقد قضيت الوقت المطلوب. سيتم إعادة توجيهك قريباً لكسب النقطة.`;

                       } catch(e) {
                           console.error("Article Script: ❌ Error setting completion flag in localStorage:", e);
                            notificationMessageElement.textContent = `حدث خطأ في تسجيل الإكمال. يرجى العودة لصفحة النقاط يدوياً.`;
                       }
                   } else {
                       console.log(`Article Script: '${articleAppConfig.localStorageKeys.completed}' was already 'true'. Skipping setItem.`);
                        // Update message even if already true
                        notificationMessageElement.textContent = `تهانينا! لقد قضيت الوقت المطلوب. سيتم إعادة توجيهك قريباً لكسب النقطة.`;
                   }


                   clearInterval(durationCheckInterval);
                   console.log("Article Script: Duration check interval cleared.");

                   // حساب المدة المتبقية قبل إعادة التوجيه لضمان الانتظار قليلاً
                   const totalTimeSinceStart = Date.now() - startTime;
                   const delayUntilRedirect = Math.max(0, articleAppConfig.requiredDurationMillis - totalTimeSinceStart);
                   // إضافة تأخير بسيط بعد اكتمال المدة وقبل التنظيف وإعادة التوجيه
                   const finalRedirectDelay = Math.max(1000, delayUntilRedirect + 500);


                   console.log(`Article Script: Setting final automatic redirect timer for ${finalRedirectDelay}ms.`);

                   // *** تسجيل حالة جميع علامات المقال قبل مسح علامات البدء والإعادة التوجيه ***
                    console.log(`Article Script: localStorage state BEFORE clearing start flags and redirect:`, { ...localStorage });


                   redirectTimeout = setTimeout(() => {
                        console.log("Article Script: Automatic redirect timer expired. Proceeding with cleanup and redirect.");

                       if(notificationElement) {
                           // تأكد من إخفاء الإشعار قبل إعادة التوجيه
                           hideAndRemoveNotification(); // استخدام الدالة التي تتضمن الإزالة من DOM

                           // إضافة تأخير بسيط جداً لضمان بدء الانتقال المرئي قبل إعادة التوجيه الفعلي
                            setTimeout(() => {
                                clearArticleStartLocalStorageFlags();
                                console.log("Article Script: Performing automatic redirect to points page.");
                                window.location.href = articleAppConfig.pointsPageUrl;
                           }, 50); // تأخير بسيط
                       } else {
                            // إذا لم يكن هناك إشعار، قم بالتنظيف وإعادة التوجيه مباشرة بعد التأخير
                             clearArticleStartLocalStorageFlags();
                             console.log("Article Script: Performing automatic redirect to points page.");
                             window.location.href = articleAppConfig.pointsPageUrl;
                       }


                   }, finalRedirectDelay);


               }

           }, 1000);


           window.addEventListener('beforeunload', handleBeforeUnload);


       } else {
           console.log("Article Page: Not in article points flow. No tracking or dynamic notification set.");
           // قم بتنظيف جميع علامات المقال إذا لم يتم الكشف عن التدفق لسبب ما
           clearAllArticleLocalStorageFlags();
           if (notificationElement) hideAndRemoveNotification(); // إخفاء وإزالة الإشعار إذا كان موجوداً
       }
    });


    function handleBeforeUnload() {
        console.log("Article Script: window.onbeforeunload fired. Checking duration for potential completion save and clearing start flags.");

        // مسح العدادات لتجنب التشغيل بعد المغادرة
        if (durationCheckInterval) {
            clearInterval(durationCheckInterval);
            console.log("Article Script: Duration check interval cleared on beforeunload.");
        }
         if (redirectTimeout) {
             clearTimeout(redirectTimeout);
              console.log("Article Script: Redirect timeout cleared on beforeunload.");
         }

         // محاولة إخفاء الإشعار عند المغادرة اليدوية
         if(notificationElement) {
             notificationElement.style.display = 'none'; // إخفاء فوري
             console.log("Article Script: Hiding notification on beforeunload.");
         }


        const flowStarted = localStorage.getItem(articleAppConfig.localStorageKeys.flowStarted);
        const startTimeString = localStorage.getItem(articleAppConfig.localStorageKeys.startTime);
        const completed = localStorage.getItem(articleAppConfig.localStorageKeys.completed);

        console.log(`Article Script: onbeforeunload state check: flowStarted=${flowStarted}, startTime=${startTimeString}, completed=${completed}`);


        // إذا كان التدفق قد بدأ، ولديك وقت بدء صالح، ولم يتم الإكمال بالفعل
        if (flowStarted === 'true' && startTimeString && completed !== 'true') {
            const startTime = parseInt(startTimeString);
            const currentTime = Date.now();
            const duration = currentTime - startTime;
            const requiredDuration = articleAppConfig.requiredDurationMillis;

            console.log(`Article Script: onbeforeunload duration check - ${duration}ms spent, Required: ${requiredDuration}ms`);

            // تحقق إذا قضى المستخدم المدة المطلوبة
            if (!isNaN(startTime) && startTime > 0 && duration >= requiredDuration) {
                console.log("Article Script: Required duration met on beforeunload. Attempting to set completion flag.");
                try {
                    // حاول تعيين علامة الإكمال
                    localStorage.setItem(articleAppConfig.localStorageKeys.completed, 'true');
                     console.log(`Article Script: ✅ (onbeforeunload) localStorage flag '${articleAppConfig.localStorageKeys.completed}' set to 'true'.`);
                } catch(e) {
                    console.error("Article Script: ❌ (onbeforeunload) Error setting completion flag in localStorage:", e);
                }
            } else {
                console.log("Article Script: Required duration NOT met on beforeunload.");
            }
        } else {
            console.log("Article Script: Not in active article flow, already completed, or invalid state. No special action on beforeunload save.");
        }

         // !!! دائماً قم بمسح علامات البدء عند المغادرة لتجنب بقائها في Local Storage !!!
         console.log(`Article Script: localStorage state BEFORE clearing start flags in beforeunload:`, { ...localStorage });

         clearArticleStartLocalStorageFlags(); // مسح علامات البدء
         console.log("Article Script: Article start localStorage flags cleared on beforeunload.");

         // لا تمسح علامة completed هنا في onbeforeunload، يجب أن تبقى لتقرأها صفحة النقاط
    }


    window.addEventListener('unload', () => {
      console.log("Article Script: window.unload fired. Cleaning up timers and listeners.");
       // هذه تحدث غالباً بعد onbeforeunload، للتنظيف النهائي
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
         console.log("Article Script: Redirect timeout cleared on unload.");
      }
      if (durationCheckInterval) {
          clearInterval(durationCheckInterval);
           console.log("Article Script: Duration check interval cleared on unload.");
      }
       window.removeEventListener('beforeunload', handleBeforeUnload);
        console.log("Article Script: Beforeunload listener removed on unload.");

         // لا تقم بمسح Local Storage هنا أيضاً، دعه لصفحة النقاط
    });


    console.log("Article page script loaded.");


