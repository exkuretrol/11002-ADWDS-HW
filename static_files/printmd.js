printmd = {
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
