---
title: "網站原始碼的解釋"
date: 2022-03-15T04:38:37+08:00
---

`include.js`
```js
/**
 * 純 js 的 include module
 */
include = {
  /**
   * 將自定義標籤 'include' 中對應的 .html 檔案原始碼取代掉整個自定義標籤。
   */
  html_include_tag: _ => {
    const includes = document.getElementsByTagName("include");
    /** 遍歷全部的 'include' 標籤 */
    for (let include of includes) {
      let src = include.getAttribute("src");
      /** 如果 src 沒有定義則繼續 */
      if (!src) continue;
      include.removeAttribute("src");
      fetch(src)
        .then(res => {
          if (res.ok) {
            res.text()
              .then(html_src => {
                const range = document.createRange().createContextualFragment(html_src);
                include.replaceWith(range);
                /** 遞迴至每個 'include' 標籤不再包含任何 'include' 標籤 */
                this.include.html_include_tag();
              })
          } else {
            include.innerHTML = '<h4>File <i style="font-weight: normal;">' + src + '</i> Not Found.</h4>'
          }
        })
    }
  },

  handleSomeInclude: someInclude => {
    this.include.moveHeader();
    this.include.html_include_tag();
  },

  observer: new MutationObserver((mutations, mutationInstance) => {
    const someInclude = document.getElementsByTagName('include');
    for (let include of someInclude) {
      this.include.handleSomeInclude(include);
      mutationInstance.disconnect();
    }
  }),

  moveHeader: _ => {
    let n = document.querySelectorAll("body > include");
    for (let i of n) {
      if (i.getAttribute("src") == "header.html") {
        let h = document.getElementsByTagName("head");
        h[0].append(i)
      };
    }
  }
}
include.observer.observe(document, {
  childList: true,
  subtree:   true
})

```

`i18n.js`
```js
/**
 * 切換網站語言的 library
 */

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
```

`printmd.js`
```js
printmd = {
  /**
   * 配和 showdown.js 自動將 .md 轉換成 html
   */
  converter: new showdown.Converter(),
  posts: ['my-first-post', 'virtualbox', 'website-source-code'],
  /**
   * 抓取 markdown 內容。
   * @param {string} name 檔案名稱
   * @returns {string}
   */
  fetchmd: async name => {
    try {
      const res = await fetch('./posts/' + name + '.md');
      const md = await res.text();
      return md;
    } catch (err) {
      console.error(err.name, err.message);
    }
  },
  
  convertToHTML: md => {
    return this.printmd.converter.makeHtml(md);
  },

  generatePost: md => {
    const post = document.createElement("article");
    const div = Object.assign(
      document.createElement("div"),
      {className: "wrap"}
    );
    const h2_title = Object.assign(
      document.createElement("h2"),
      {className: "post-title"}
    );
    const time = Object.assign(
      document.createElement("span"), 
      {className: "post-time"}
    );
    div.appendChild(h2_title);
    div.appendChild(time);

    let allLines = md.split("\n")
    /** 文章標題 */
    h2_title.innerText = allLines[1].split("\"")[1];
    /** 文章建立時間 */
    let createDate = allLines[2];
    let date = new Date(createDate.split(" ")[1]);
    time.innerText = new Intl.DateTimeFormat('ko-KR').format(date).toString();
    /** 剔除文章首 4 列的 yaml */
    let md1 = allLines.slice(4).join('\n');

    const md_src = printmd.convertToHTML(md1);
    const md_element = document.createRange().createContextualFragment(md_src);
    
    post.appendChild(div);
    post.appendChild(md_element);
    return post;
  },

  /**
   * 
   * @param {HTMLElement} posts 
   */
  handleArticle: async posts => {
    /** 反轉串列，比較新的文章在前面。 */
    const rev_posts = this.printmd.posts.reverse();
    for (let i of rev_posts) {
      const md = await this.printmd.fetchmd(i);
      const post = this.printmd.generatePost(md);
      posts.appendChild(post);
      Prism.highlightAll(post);
    }
  },

  observer: new MutationObserver((mutations, mutationInstance) => {
    const posts = document.querySelector("#posts > div.container");
    if (posts) {
      this.printmd.handleArticle(posts);
      mutationInstance.disconnect();
    }
  })
}
printmd.observer.observe(document, {
  childList: true,
  subtree:   true
})

```