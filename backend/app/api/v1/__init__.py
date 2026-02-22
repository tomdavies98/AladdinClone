from fastapi import APIRouter

from app.api import auth
from app.api.v1 import (
    design_principles,
    data_analytics,
    ecosystem,
    esg_climate,
    operations,
    portfolios,
    private_markets,
    risk,
    trading,
    wealth,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(portfolios.router, prefix="/portfolios", tags=["portfolios"])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"])
api_router.include_router(trading.router, prefix="/trading", tags=["trading"])
api_router.include_router(operations.router, prefix="/operations", tags=["operations"])
api_router.include_router(private_markets.router, prefix="/private-markets", tags=["private-markets"])
api_router.include_router(data_analytics.router, prefix="/data-analytics", tags=["data-analytics"])
api_router.include_router(esg_climate.router, prefix="/esg-climate", tags=["esg-climate"])
api_router.include_router(wealth.router, prefix="/wealth", tags=["wealth"])
api_router.include_router(ecosystem.router, prefix="/ecosystem", tags=["ecosystem"])
api_router.include_router(design_principles.router, prefix="/design-principles", tags=["design-principles"])
