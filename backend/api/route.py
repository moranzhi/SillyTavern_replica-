from fastapi import APIRouter
from .routes import presetsRoute, chatsRoute, worldbooksRoute

router = APIRouter()

# 注册子路由
router.include_router(presetsRoute.router)
router.include_router(chatsRoute.router)
router.include_router(worldbooksRoute.router)


# 保留原有的其他路由
@router.get("/tool_bar/get_all_role_and_chat")
def get_all_role_and_chat_endpoint():
	from ..tools.get_all_role_and_chat import get_all_role_and_chat
	return get_all_role_and_chat()
