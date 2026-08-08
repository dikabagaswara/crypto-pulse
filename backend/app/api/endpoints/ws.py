from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_mgr import ws_manager
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/live")
async def websocket_live_endpoint(websocket: WebSocket):
    """Real-time WebSocket endpoint streaming PINTU price and volatility updates."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & listen for potential ping/pong from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"event": "pong"}')
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket client error: {str(e)}")
        ws_manager.disconnect(websocket)
