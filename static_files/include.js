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
