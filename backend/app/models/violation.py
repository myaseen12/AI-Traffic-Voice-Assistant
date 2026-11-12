"""
Compatibility module.
Re-exports TrafficRule as Violation to ensure legacy routers, schemas,
and test scripts continue functioning seamlessly.
"""
from app.models.traffic_rule import TrafficRule, Violation

__all__ = ["TrafficRule", "Violation"]
