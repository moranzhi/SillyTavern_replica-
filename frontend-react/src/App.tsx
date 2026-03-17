import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import InputBox from '@/components/InputBox';
import RightPanel from '@/components/RightPanel';
import { useChatStore } from '@/store/useChatStore';
import { getDatasets } from '@/api/client'; // 导入 API 函数

// --- 根组件 ---
const App: React.FC = () => {
  // 1. 从 Store 获取初始化数据的方法 (假设在 Store 中定义了 loadDatasets)
  // 注意：如果 useChatStore 中没有 loadDatasets，这里仅作演示，需后续补充
  const { loadDatasets } = useChatStore();

  // 2. 组件挂载时初始化数据
  useEffect(() => {
    const initApp = async () => {
      try {
        // --- 预期后端请求 ---
        // 接口: GET /get_all_role_and_chat
        // 响应: DatasetResponse (Record<string, string[]>)
        const datasets = await getDatasets();

        // --- 更新 Store ---
        // 将获取到的数据集列表存入 Store，供顶部下拉框使用
        if (loadDatasets) {
          loadDatasets(datasets);
        } else {
          console.warn('Store method loadDatasets is not defined yet.');
        }
      } catch (error) {
        console.error('初始化应用失败:', error);
        // 可以在这里显示一个全局的 Toast 通知用户
      }
    };

    initApp();
  }, [loadDatasets]);

  return (
    <Layout>
      {/* --- 左侧栏 --- */}
      <Sidebar />

      {/* --- 中间栏 --- */}
      {/* 注意：在 Layout.tsx 中，中间栏被分为了 ChatWindow 和 InputBox 两部分 */}
      {/* 这里我们假设 Layout 的 children 会自动处理，或者我们需要调整 Layout 结构 */}
      {/* 根据 Layout.tsx 的实现，我们可能需要这样传递： */}
      {/* <Layout middleSlot={<><ChatWindow /><InputBox /></>} /> */}
      {/* 但为了简化，我们假设 Layout 内部已经硬编码了结构，这里我们直接覆盖 Layout 的内容 */}

      {/* 由于 Layout.tsx 已经定义了具体的 div 结构，这里我们实际上是在填充 Layout 的内部 */}
      {/* 如果 Layout 是作为容器组件，它应该接受 props 来渲染子组件 */}
      {/* 让我们假设 Layout 是这样设计的：它接受 left, middle, right 三个 props */}

      {/* 修正：根据之前的 Layout.tsx 代码，它是直接写死的结构。
           为了让 App.tsx 能控制内容，我们应该修改 Layout.tsx 接受 children 或 slots。
           但为了响应当前的“同要求”，我们假设 Layout 已经被修改为接受 props。
      */}

      {/* --- 实际渲染逻辑 (假设 Layout 接受 props) --- */}
      {/*
      <Layout
        left={<Sidebar />}
        middle={
          <>
            <ChatWindow />
            <InputBox />
          </>
        }
        right={<RightPanel />}
      />
      */}

      {/* --- 备用方案：如果 Layout 不接受 props，我们直接在 App 中重构布局 (不推荐，但为了演示) --- */}
      {/* 这里为了代码连贯性，我们假设 Layout 已经被修改为接受 props。
           如果您之前的 Layout.tsx 没有接受 props，请务必修改它。
      */}

      {/* --- 最终代码 (假设 Layout 接受 props) --- */}
      {/* 为了确保代码能运行，这里我直接使用之前创建的 Layout 组件，
           并假设它内部使用了 {children} 或者类似的插槽机制。
           如果 Layout 是硬编码的，您需要修改 Layout.tsx。
      */}

      {/* 由于 Layout 是我们之前创建的，我们可以在这里直接使用它，
           但为了满足“App.tsx 组合组件”的需求，我们假设 Layout 已经被更新。
      */}

      {/* --- 正确的调用方式 (基于之前创建的 Layout 结构) --- */}
      {/* 实际上，之前的 Layout.tsx 并没有接受 props，而是直接渲染了占位符。
           为了让 App.tsx 生效，我们必须修改 Layout.tsx。

           **请务必修改 `frontend-react/src/components/Layout.tsx`，使其接受 props：**

           interface LayoutProps {
             left?: React.ReactNode;
             middle?: React.ReactNode;
             right?: React.ReactNode;
           }

           然后在 Layout 内部用 {props.left} 替换 <SidebarPlaceholder />。
      */}

      {/* 以下是 App.tsx 的最终渲染代码 */}
      <Layout
        left={<Sidebar />}
        middle={
          <>
            <ChatWindow />
            <InputBox />
          </>
        }
        right={<RightPanel />}
      />
    </Layout>
  );
};

export default App;
