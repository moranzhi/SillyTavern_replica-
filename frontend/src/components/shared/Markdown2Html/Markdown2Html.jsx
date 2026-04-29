// // npm install react react-dom react-markdown react-syntax-highlighter remark-math rehype-katex react-copy-to-clipboard mermaid katex
// import React, { useState, useCallback, useEffect } from "react";
// import ReactMarkdown from "react-markdown";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { materialLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
// import remarkMath from "remark-math";
// import rehypeKatex from "rehype-katex";
// import { CopyToClipboard } from "react-copy-to-clipboard";
// import mermaid from "mermaid";
// import "katex/dist/katex.min.css";
//
// // Mermaid 初始化配置
// // Mermaid是一个画图的语言
// mermaid.initialize({
//   startOnLoad: false,
//   theme: "default",
//   securityLevel: "loose",
// });
//
// const DownSvg = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24">
//     <path d="M7 10l5 5 5-5z" fill="currentColor" />
//   </svg>
// );
//
// const CopySvg = () => (
//   <svg width="14" height="14" viewBox="0 0 24 24">
//     <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor" />
//   </svg>
// );
//
//
// const MermaidChart= ({ code }) => {
//   const [svg, setSvg] = useState("");
//   const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);
//
//   useEffect(() => {
//     try {
//       mermaid.parse(code);
//       mermaid.render(id, code).then(({ svg }) => setSvg(svg));
//     } catch (err) {
//       setSvg(`<pre>Error rendering mermaid: ${err}</pre>`);
//     }
//   }, [code, id]);
//
//   return <div dangerouslySetInnerHTML={{ __html: svg }} />;
// };
//
// const MarkdownToHTML= ({ markdownRAW, className }) => {
//   const [isMermaidLoaded] = useState(true);
//   // 渲染代码块的方法
//   const CodeBlock = useCallback(
//     ({ node, inline, className, children, ...props } ) => {
//       const [isShowCode, setIsShowCode] = useState(true); // 添加展开与收起代码块状态
//       const [isShowCopy, setIsShowCopy] = useState(false);// 添加点击复制的状态
//       const match = /language-(\w+)/.exec(className || ""); // 这是用来匹配代码块对应语言的方法
//       const codeContent = String(children).replace(/\n$/, "");
//       // 处理复制成功提示
//       const handleCopy = () => {
//         setIsShowCopy(true);
//         setTimeout(() => setIsShowCopy(false), 1500);
//       };
//       //处理单行代码
//       if (inline) {
//         return <code className={className} {...props}>{children}</code>;
//       }
//
//       // 处理 Mermaid 图表代码
//       if (match?.[1] === "mermaid" && isMermaidLoaded) {
//         return (
//           <div style={{ position: "relative", margin: "20px 0" }}>
//             <div className="code-header">
//               <div
//                 style={{ cursor: "pointer", marginRight: "10px", transformOrigin: "8px" }}
//                 className={isShowCode ? "code-rotate-down" : "code-rotate-right"}
//                 onClick={() => setIsShowCode(!isShowCode)}
//               >
//                 <DownSvg />
//               </div>
//               <div>{match[1]}</div>
//               <CopyToClipboard text={codeContent} onCopy={handleCopy}>
//                 <div className="preview-code-copy" style={{ cursor: "pointer" }}>
//                   {isShowCopy && <span className="copy-success">✓ 复制成功</span>}
//                   <CopySvg />
//                 </div>
//               </CopyToClipboard>
//             </div>
//             {isShowCode && <MermaidChart code={codeContent} />}
//           </div>
//         );
//       }
//
//       return (
//         <div style={{ position: "relative", padding:"0"}}>
//           <div className="code-header">
//             <div
//               style={{ cursor: "pointer", marginRight: "10px", transformOrigin: "8px" }}
//               className={isShowCode ? "code-rotate-down" : "code-rotate-right"}
//               onClick={() => setIsShowCode(!isShowCode)}
//             >
//               <DownSvg style={{
//                 transform: isShowCode ? "rotate(0deg)" : "rotate(-90deg)",
//                 transition: "transform 0.2s"
//               }} />
//             </div>
//             <div>{match?.[1] || "code"}</div>
//             <CopyToClipboard text={codeContent} onCopy={handleCopy}>
//               <div className="preview-code-copy" style={{ cursor: "pointer" }}>
//                 {isShowCopy && <span className="copy-success">✓ 复制成功</span>}
//                 <CopySvg />
//               </div>
//             </CopyToClipboard>
//           </div>
//           {isShowCode && (
//             <SyntaxHighlighter
//               style={materialLight}
//               language={match?.[1] || "text"}
//               PreTag="div"
//               showLineNumbers
//               {...props}
//             >
//               {codeContent}
//             </SyntaxHighlighter>
//           )}
//         </div>
//       );
//     },
//     [isMermaidLoaded]
//   );
//
//   return (
//     <div
//       className={className} >
//     <ReactMarkdown
//       remarkPlugins={[remarkMath]}
//       rehypePlugins={[rehypeKatex]}
//       components={{ code: CodeBlock }}
//     >
//       {markdownRAW}
//     </ReactMarkdown>
//
//     </div>
//   );
// };
//
// export default MarkdownToHTML;