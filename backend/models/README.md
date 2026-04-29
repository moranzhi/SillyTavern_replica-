# Backend Models 数据模型说明

## 目录结构

```
models/
├── __init__.py          # 包初始化,导出所有模型
├── sillytavern.py       # SillyTavern 兼容模型 (仅用于导入/导出)
├── internal.py          # 内部业务模型 (项目核心使用)
└── README.md            # 本文件
```

## 模型分类

### 1. SillyTavern 兼容模型 (`sillytavern.py`)

**用途**: 仅用于与 SillyTavern 格式的数据进行导入/导出兼容

**特点**:
- 严格遵循 SillyTavern 官方规范
- 不参与内部业务逻辑
- 所有字段名、结构与 SillyTavern 保持一致
- 前缀 `ST` 表示 SillyTavern

**主要模型**:
- `STWorldInfo` - SillyTavern 世界书
- `STCharacterCard` - SillyTavern 角色卡
- `STChatHeader` / `STChatMessage` - SillyTavern 聊天记录
- `STGenerationPreset` - SillyTavern 采样预设
- `STPromptPreset` - SillyTavern 提示词预设

**使用场景**:
```python
# 从 SillyTavern 导入时
st_data = json.load(file)
st_character = STCharacterCard(**st_data)

# 转换为内部模型
internal_character = converter.st_to_internal(st_character)

# 导出到 SillyTavern 时
st_data = converter.internal_to_st(internal_character)
json.dump(st_data.dict(), file)
```

### 2. 内部业务模型 (`internal.py`)

**用途**: 项目内部真正使用的数据结构,所有业务逻辑都基于这些模型

**特点**:
- 继承并扩展了 SillyTavern 的功能
- 添加了项目特色功能 (如 LOGIC 激活、RAG 配置、outputSchema 等)
- 所有 API 响应、数据存储、工作流交换都使用这些模型
- 无前缀,直接使用语义化名称

**主要模型**:

#### 世界书相关
- `ActivationType` - 激活方式枚举 (PERMANENT/KEYWORD/RAG/LOGIC)
- `LogicExpression` - 逻辑表达式
- `RAGConfig` - RAG 检索配置
- `WorldInfoEntry` - 世界书条目
- `WorldInfo` - 世界书

#### 角色卡相关
- `OutputSchemaField` - 结构化输出 schema
- `CharacterCard` - 角色卡

#### 聊天记录相关
- `ChatHeader` - 聊天头
- `ChatMessage` - 聊天消息
- `ChatLog` - 完整聊天记录

#### 预设相关
- `GenerationPreset` - 采样参数预设
- `PromptRole` - Prompt 角色枚举
- `PromptEntry` - Prompt 条目
- `PromptPresetView` - Prompt 预设视图

#### RAG 配置
- `RAGSearchConfig` - RAG 搜索配置
- `CharacterRAGConfig` - 角色卡 RAG 配置
- `ChatRAGConfig` - 聊天 RAG 配置

**使用场景**:
```python
# 业务逻辑中直接使用
from models import CharacterCard, WorldInfo

character = CharacterCard(
    id="uuid-123",
    name="Alice",
    description="...",
    ...
)

# API 响应
@app.get("/characters/{id}")
async def get_character(id: str):
    character = service.get_character(id)
    return character  # 返回 internal 模型
```

## 数据转换流程

```
SillyTavern 文件
    ↓ (导入)
STCharacterCard (sillytavern.py)
    ↓ (转换器)
CharacterCard (internal.py)
    ↓ (业务处理)
CharacterCard (internal.py)
    ↓ (转换器)
STCharacterCard (sillytavern.py)
    ↓ (导出)
SillyTavern 文件
```

## 开发规范

### ✅ 正确做法

1. **业务逻辑使用 internal 模型**
   ```python
   from models import CharacterCard
   
   def create_character(data: dict) -> CharacterCard:
       return CharacterCard(**data)
   ```

2. **导入时使用转换器**
   ```python
   from models import STCharacterCard, CharacterCard
   from models.converters import CharacterConverter
   
   def import_character(file_path: str) -> CharacterCard:
       st_data = load_json(file_path)
       st_char = STCharacterCard(**st_data)
       return CharacterConverter.st_to_internal(st_char)
   ```

3. **API 响应使用 internal 模型**
   ```python
   @app.get("/characters")
   async def list_characters() -> List[CharacterCard]:
       return service.list_characters()
   ```

### ❌ 错误做法

1. **不要在业务逻辑中直接使用 ST 模型**
   ```python
   # 错误!
   from models import STCharacterCard
   
   def process_character(char: STCharacterCard):
       ...
   ```

2. **不要混合使用两种模型**
   ```python
   # 错误!
   character = CharacterCard(...)
   character.name = st_character.data.name  # 不要混用
   ```

3. **不要在 API 中暴露 ST 模型**
   ```python
   # 错误!
   @app.get("/characters")
   async def list_characters() -> List[STCharacterCard]:
       ...
   ```

## 添加新模型

当需要添加新的数据类型时:

1. **判断用途**:
   - 如果是为了 SillyTavern 兼容 → 添加到 `sillytavern.py`
   - 如果是项目内部使用 → 添加到 `internal.py`

2. **遵循命名规范**:
   - SillyTavern 模型: 前缀 `ST`
   - 内部模型: 无前缀,使用清晰的语义化名称

3. **添加详细注释**:
   ```python
   class MyModel(BaseModel):
       """
       模型用途说明
       
       详细描述该模型的作用、使用场景等
       """
       field1: str = Field(..., description="字段说明")
   ```

4. **在 `__init__.py` 中导出**:
   ```python
   from .internal import MyModel
   
   __all__ = [
       ...,
       'MyModel',
   ]
   ```

## 转换器 (待实现)

`models/converters.py` 将提供双向转换功能:

```python
class CharacterConverter:
    @staticmethod
    def st_to_internal(st_char: STCharacterCard) -> CharacterCard:
        """SillyTavern → Internal"""
        ...
    
    @staticmethod
    def internal_to_st(int_char: CharacterCard) -> STCharacterCard:
        """Internal → SillyTavern"""
        ...
```

## 总结

- **sillytavern.py** = 外部兼容层 (Import/Export Only)
- **internal.py** = 内部业务层 (Core Business Logic)
- **永远在业务逻辑中使用 internal 模型**
- **通过转换器进行格式转换**
