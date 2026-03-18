// 下面这些包如果显示不存在则运行这个代码安装依赖：
// npm install marked marked-highlight highlight.js  
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/base16/github.css";

// 配置 marked 和 markedHighlight
marked.use(
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext"; // 如果语言不支持，回退为纯文本
            return hljs.highlight(code, { language }).value; // 使用 highlight.js 高亮代码
        },
    })
);

// Markdown 解析函数
const MarkdownRenderer = (markdownString)=> {
    const res= marked.parse(markdownString).toString()
    return res; // 将 Markdown 转换为 HTML
};

export default MarkdownRenderer;