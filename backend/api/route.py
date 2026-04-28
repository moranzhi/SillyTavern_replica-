from fastapi import APIRouter
from .routes import presetsRoute, chatsRoute, worldbooksRoute, apiConfigRoute
from utils.file_utils import get_all_roles_and_chats
from core.config import settings
from pathlib import Path

router = APIRouter()

# 注册子路由
router.include_router(presetsRoute.router)
router.include_router(chatsRoute.router)
router.include_router(worldbooksRoute.router)
router.include_router(apiConfigRoute.router)


# 保留原有的其他路由
@router.get("/tool_bar/get_all_role_and_chat")
def get_all_role_and_chat_endpoint():
	return get_all_roles_and_chats(Path(settings.DATA_PATH))
