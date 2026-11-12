"""
Redirect seed entry point to app.database.seeds.
"""
from app.database.seeds import run_seed, seed_database

__all__ = ["run_seed", "seed_database"]
