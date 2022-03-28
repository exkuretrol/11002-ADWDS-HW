/**
 * Define JSON
 * @typedef {string} JSON
 */

i18n = {
  /* 擁有的語言設定 */
  availableLangs: ['zh-TW', 'en-US'],
  /* 預設/備取 的語言 */
  defaultLang: 'zh-TW',
  /* 語言設定的資叫夾路徑 */
  localesPath: './static_files/locales/',

  detectLang: _ => {
    const browserLangs = navigator.languages;
    for (let i of browserLangs) {
      if (this.i18n.availableLangs.indexOf(i) >= 0) return i
      else return this.i18n.defaultLang;
    }
  },

  /**
   * 先從 cookie 中提取 'lang' 參數，如果有設定的話，取用該值。若無，從瀏覽器的 http 
   * request 中提取瀏覽器偏好的語言，如果該語言在設定中存在的話，取該値。
   * @return {string} 回傳要用來設定的語言
   */
  getLang: async _ => {
    const preferLang = await cookieStore.get("lang")
      .then(cookie => {
        if (cookie !== null) {
          return cookie.value;
        } else {
          const browserLang = this.i18n.detectLang()
          cookieStore.set("lang", browserLang);
          return browserLang;
        }
      });
    if (preferLang) return preferLang;
  },

  changeLang: async _ => {
    const curLang = await this.i18n.getLang();
    const curInd = this.i18n.availableLangs.indexOf(curLang);
    console.log(curLang);
    let Ind = curInd + 1;
    if ((curInd + 1) > this.i18n.availableLangs.length - 1) Ind = 0;
    await this.i18n.switchLang(this.i18n.availableLangs[Ind]);
  },

  /**
   * 從靜態檔案中抓回設定的語言
   * @return(JSON) 回傳抓到的 .json
   */
  loadLocale: async _ => {
    const lang = await this.i18n.getLang();
    const path = this.i18n.localesPath + lang + '.json'
    document.getElementsByTagName("html")[0].setAttribute("lang", lang);
    try {
      const res = await fetch(path);
      const json = await res.json();
      return json;
    } catch (err) {
      console.error(err.name, err.message);
    }
  },

  /**
   * 切換設定的語言，並使用 cookie 儲存，若輸入語言沒有存在於設定中，則不變更。
   * @param {string} lang 要用於設定的語言
   */
  switchLang: async lang => {
    if (lang !== undefined & this.i18n.availableLangs.indexOf(lang) >= 0) {
      await cookieStore.set("lang", lang);
    }
    const locale = await this.i18n.loadLocale();

    /** 從整個 html 搜尋 'i18n-key' 的元素 */
    const observations = document.querySelectorAll("[i18n-key]");

    /** 替換語言 */
    for (let obs of observations) {
      key = obs.getAttribute("i18n-key")
      const target = locale[key]
      /** 如果該鍵沒有定義 */
      if (target === undefined) {
        console.log(
          `鍵值 '${key}' 沒有在設定檔案中`
        )
        continue;
      };

      /** 若該節點有子節點 */
      if (obs.children.length > 0) {
        for (let i of obs.children) {
          let TN = i.tagName.toLowerCase();

          switch (TN) {
            /** 連結 */
            case 'a':
              i.innerHTML = target;
              break;

            /** 因該不會有東西到這吧＝＝ */
            default:
              console.log(`有個標籤 ${TN} 沒有考慮到。`);
              obs.innerHTML = target;
              break;
          }
        }
        /** 若無 */
      } else {
        obs.innerHTML = target;
      }

    };
  }
}
i18n.switchLang();