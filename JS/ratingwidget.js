!function(){
  if("undefined"==typeof BloggerRatingGenerator){
    let n=[".post",".post-outer","article",".item",".blog-post",".hentry",".index-post"],
        o=[".post-title","h1","h2","h3"],
        s=["#main","#Blog1","#Blog00"];

    function t(e) {
      if ("A"===e.tagName && e.getAttribute("href")) {
        let r=e.getAttribute("href").split("?")[0].split("#")[0];
        return 0===r.indexOf(location.protocol+"//"+location.host) && /.*\/\d{4}\/\d{2}\/.*\.html/.test(r) ? e : e.parentNode && "main" !== e.parentNode.id && e.parentNode !== document.body ? t(e.parentNode) : null;
      }
    }

    function e(t) {
      let e=t.split("?")[0].split("#")[0].replace("https:","").replace("http:","").replace("file:","").replace("ftp:","").replace("mailto:","");
      for(;"/"==e[0];) e=e.substring(1);
      for(0===e.indexOf("www.") && (e=e.replace("www.",""));"/"==e[e.length-1];) e=e.substring(0,e.length-1);
      return e=e.replace(/\./g,"_").replace(/\//g,"__").replace(/\,/g,"___").replace(/\s/g,"");
    }

    function r(t, r, l, i) {
      let n=document.createElement("div");
      n.setAttribute("class","BloggerStarRating"), "insertAfter"===l ? t.parentNode.insertBefore(n, t.nextSibling) : t.appendChild(n);
      let o=document.createElement("script");
      for(let t in i) o.setAttribute(t, i[t]);
      o.setAttribute("ratingName", e(r)), o.src="https://cdn.jsdelivr.net/gh/starratingsystem/script@1.0.1/starrater.js", n.appendChild(o);
    }

    function l(t, l) {
      let i, s, a=e(location.href);
      "top" === l.position ? (i=o, s=n) : (i=n, s=o);
      for(let e=0;e<i.length;e++) {
        if(t.querySelector(i[e])) {
          r(t.querySelector(i[e]), a, "top" === l.position ? "insertAfter" : "appendChild", l);
          break;
        }
        if(e===i.length-1) for(let e=0;e<s.length;e++) {
          if(t.querySelector(s[e])) {
            r(t.querySelector(s[e]), a, "top" === l.position ? "appendChild" : "insertAfter", l);
            break;
          }
          if(e===s.length-1) {
            let t=document.createElement("div");
            document.body.appendChild(t), t.style.display="block", t.style.position="fixed", t.style.left="0", t.style.bottom="0", t.style.background="lightblue", t.style.borderTop="1px solid black", r(t, a, "appendChild", l);
          }
        }
      }
    }

    function i(e, l) {
      for(let i=0;i<n.length;i++) {
        if(e.querySelector(n[i])) {
          e.querySelectorAll(n[i]).forEach(e => {
            if(!e.querySelector(".BloggerStarRating")) {
              let i=e.querySelectorAll("a[href]");
              if(i.length) for(let n=0;n<i.length;n++) {
                let o=i[n].getAttribute("href").split("?")[0].split("#")[0];
                if(0===o.indexOf(location.protocol+"//"+location.host) && /.*\/\d{4}\/\d{2}\/.*\.html/.test(o)) {
                  r(i[n], o, "insertAfter", l);
                  break;
                }
                if(n===i.length-1) {
                  let i=t(e);
                  i && r(i, i.getAttribute("href"), "insertAfter", l);
                }
              } else {
                let i=t(e);
                i && r(i, i.getAttribute("href"), "insertAfter", l);
              }
            }
          });
          break;
        }
        if(i===n.length-1) {
          let t=[];
          e.querySelectorAll("a[href]").forEach(e => {
            let i=e.getAttribute("href").split("?")[0].split("#")[0];
            0===i.indexOf(location.protocol+"//"+location.host) && /.*\/\d{4}\/\d{2}\/.*\.html/.test(i) && t.indexOf(i)<0 && (r(e, i, "insertAfter", l), t.push(i));
          });
        }
      }
    }

    function updateStarDisplay(userRating) {
      const stars = document.querySelectorAll('.star');
      stars.forEach((star, index) => {
        star.src = index < userRating ? starRatingSystemSettings.postPage.fullStarImg : starRatingSystemSettings.postPage.emptyStarImg;
      });
    }

    !function t(e) {
      /in/.test(document.readyState) ? setTimeout(function(){ t(e) }, 100) : e();
    }(function() {
      let t=document.body;
      for(let e=0; e<s.length; e++) {
        if(document.querySelector(s[e])) {
          t=document.querySelector(s[e]);
          break;
        }
      }
      /.*\/\d{4}\/\d{2}\/.*\.html/.test(location.href.split("?")[0].split("#")[0]) ? l(t, starRatingSystemSettings.postPage) : /.*\/p\/.*\.html/.test(location.href.split("?")[0].split("#")[0]) ? l(t, starRatingSystemSettings.staticPage) : (i(t, starRatingSystemSettings.indexPage), setInterval(function() { i(t, starRatingSystemSettings.indexPage) }, 1e3));
    });
  } else BloggerRatingGenerator=!0;
}();
