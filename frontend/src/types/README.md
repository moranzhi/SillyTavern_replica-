# 前端数据类型规范

## 概述

本项目前端采用双层数据类型设计，与后端保持一致：

1. **SillyTavern 兼容层** (`sillytavern.types.ts`) - 仅用于导入导出
2. **内部业务层** (`internal.types.ts`) - 前端真正使用的数据类型

## 目录结构

```
frontend/src/types/
├── index.ts                    # 统一导出
├── sillytavern.types.ts        # SillyTavern 兼容格式（仅导入导出）
├── internal.types.ts           # 内部业务格式（真正使用）
├── converters.ts               # 格式转换函数
└── README.md                   # 本文档
```

## 使用规范

### 1. SillyTavern 兼容层 (ST 前缀)

**用途**: 仅用于与 SillyTavern 格式的文件进行导入导出交互

**包含的类型**:
- `STChatHeader` - SillyTavern 聊天头
- `STChatMessage` - SillyTavern 聊天消息
- `STChatLog` - SillyTavern 完整聊天记录
- `STCharacterCard` - SillyTavern 角色卡
- `STGenerationPreset` - SillyTavern 预设

**使用场景**:
```typescript
// ✅ 正确：导入文件时解析
const stData: STChatLog = JSON.parse(fileContent);

// ✅ 正确：导出文件时序列化
const exportData = convertInternalChatLogToST(internalData);
downloadFile(JSON.stringify(exportData));

// ❌ 错误：不要在业务逻辑中直接使用
const messages = stData.messages; // 应该先转换为内部格式
```

### 2. 内部业务层 (无前缀)

**用途**: 前端所有业务逻辑、状态管理、API 交互都使用这些类型

**包含的类型**:
- `ChatHeader` - 内部聊天头
- `ChatMessage` - 内部聊天消息
- `ChatLog` - 内部完整聊天记录
- `RoleInfo` - 角色信息
- `ChatSummary` - 聊天摘要
- `ApiConfig` - API 配置
- `GenerationPreset` - 生成预设
- `PromptComponent` - Prompt 组件
- `WSRequestMessage` / `WSResponseMessage` - WebSocket 消息

**使用场景**:
```typescript
// ✅ 正确：Store 中使用内部类型
import type { ChatMessage } from '@/types';

const useChatStore = create<{
  messages: ChatMessage[];
}>((set) => ({
  messages: [],
}));

// ✅ 正确：API 响应使用内部类型
const response = await fetch('/api/chat/role/chat');
const data: ChatLog = await response.json();

// ✅ 正确：组件 Props 使用内部类型
interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}
```

### 3. 数据转换

**何时转换**:
- 从文件导入 SillyTavern 格式 → 立即转换为内部格式
- 导出为 SillyTavern 格式 → 从内部格式转换后导出
- API 交互 → 确保后端返回的是 internal 格式

**转换函数**:
```typescript
import {
  convertSTChatLogToInternal,
  convertInternalChatLogToST,
  generateId
} from '@/types';

// SillyTavern → 内部
const internalData = convertSTChatLogToInternal(stData, chatId, characterId);

// 内部 → SillyTavern
const stData = convertInternalChatLogToST(internalData);
```

## 迁移指南

### 从旧代码迁移

如果你正在重构现有的 JSX 文件：

1. **添加类型导入**:
   ```typescript
   import type { ChatMessage, ChatHeader } from '@/types';
   ```

2. **为 State 添加类型注解**:
   ```typescript
   // 之前
   const [messages, setMessages] = useState([]);
   
   // 之后
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   ```

3. **为 Props 添加类型**:
   ```typescript
   interface ComponentProps {
    messages: ChatMessage[];
    userName: string;
   }
   
   const Component: React.FC<ComponentProps> = ({ messages, userName }) => {
     // ...
   };
   ```

4. **为函数参数和返回值添加类型**:
   ```typescript
   // 之前
   const sendMessage = async (content) => {
     // ...
   };
   
   // 之后
   const sendMessage = async (content: string): Promise<void> => {
     // ...
   };
   ```

## 最佳实践

### 1. 始终使用内部类型

```typescript
// ✅ 好
const handleMessageUpdate = (message: ChatMessage) => {
  // 业务逻辑
};

// ❌ 坏 - 混用 SillyTavern 类型
const handleMessageUpdate = (message: STChatMessage) => {
  // 这会导致与后端 API 不兼容
};
```

### 2. 在边界处进行转换

```typescript
// ✅ 好 - 在导入时立即转换
const handleImport = async (file: File) => {
  const content = await file.text();
  const stData: STChatLog = JSON.parse(content);
  const internalData = convertSTChatLogToInternal(stData, generateId(), characterId);
  setMessages(internalData.messages);
};

// ❌ 坏 - 在整个应用中使用 SillyTavern 格式
const handleImport = async (file: File) => {
  const content = await file.text();
  const stData: STChatLog = JSON.parse(content);
  setMessages(stData.slice(1)); // 直接使用 ST 格式
};
```

### 3. Store 中使用内部类型

```typescript
// ✅ 好
import type { ChatMessage, ApiConfig } from '@/types';

const useStore = create<{
  messages: ChatMessage[];
  apiConfig: ApiConfig | null;
}>((set) => ({
  messages: [],
  apiConfig: null,
}));

// ❌ 坏 - 使用 any 或未定义的类型
const useStore = create<{
  messages: any[];
  apiConfig: any;
}>((set) => ({
  messages: [],
  apiConfig: null,
}));
```

### 4. API 调用时使用内部类型

```typescript
// ✅ 好
const fetchChatHistory = async (role: string, chat: string): Promise<ChatLog> => {
  const response = await fetch(`/api/chat/${role}/${chat}`);
  return response.json(); // 后端返回 internal 格式
};

// ❌ 坏 - 没有类型注解
const fetchChatHistory = async (role, chat) => {
  const response = await fetch(`/api/chat/${role}/${chat}`);
  return response.json();
};
```

## 与后端的对应关系

| 前端类型 | 后端模型 | 说明 |
|---------|---------|------|
| `ChatHeader` | `backend/models/internal.py:ChatHeader` | 完全对应 |
| `ChatMessage` | `backend/models/internal.py:ChatMessage` | 前端额外添加 `floor` 字段 |
| `ChatLog` | `backend/models/internal.py:ChatLog` | 完全对应 |
| `ApiConfig` | 前端特有 | 前端本地存储的 API 配置 |
| `GenerationPreset` | `backend/models/internal.py:GenerationPreset` | 字段命名略有差异（camelCase vs snake_case） |

## 常见问题

### Q: 为什么需要两层类型？

**A**: 
- **SillyTavern 层**: 保持与外部生态的兼容性，用户可以导入导出 SillyTavern 格式的文件
- **内部层**: 简化业务逻辑，添加项目特色功能（如 floor、tableData 等），与后端保持一致

### Q: 什么时候使用转换器？

**A**: 
- 仅在 I/O 边界使用（文件导入导出）
- 业务逻辑中始终使用内部类型
- API 交互由后端负责转换，前端直接使用内部类型

### Q: 如何添加新类型？

**A**: 
1. 判断类型的用途：
   - 如果是 SillyTavern 兼容 → 添加到 `sillytavern.types.ts`
   - 如果是内部业务使用 → 添加到 `internal.types.ts`
2. 如需转换 → 在 `converters.ts` 中添加转换函数
3. 在 `index.ts` 中导出（如果使用了 `export *` 则自动导出）

## 示例代码

完整的类型使用示例请参考：
- `src/Store/Slices/ChatBoxSlice.jsx` - ChatBox Store（待重构）
- `src/Store/Slices/RoleSelectorSlice.jsx` - RoleSelector Store（待重构）
- `src/components/ChatBox/ChatBox.jsx` - ChatBox 组件（待重构）

## 后续工作

当前类型系统已建立，下一步需要：
1. ✅ 更新 Store 使用新的类型定义
2. ✅ 更新组件 Props 使用类型注解
3. ✅ 确保 API 调用与后端 internal 模型一致
4. ⏳ 考虑将 `.jsx` 文件迁移到 `.tsx` 以获得完整的类型检查
