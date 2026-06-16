"""
Dashboard and analytics routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import DashboardStats, RecentActivityResponse, AnalyticsResponse, ActivityItem
from app.services import analytics_service

router = APIRouter(tags=["Dashboard & Analytics"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get summary statistics for the dashboard cards."""
    return analytics_service.get_dashboard_stats(db, current_user.id)


@router.get("/dashboard/recent-activity", response_model=RecentActivityResponse)
def get_recent_activity(
    limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get the current user's recent activity feed."""
    items = analytics_service.get_recent_activity(db, current_user.id, limit)
    return RecentActivityResponse(items=[ActivityItem(**i) for i in items])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get analytics data for charts (line, pie, bar) on the analytics dashboard."""
    return analytics_service.get_analytics(db, current_user.id)
