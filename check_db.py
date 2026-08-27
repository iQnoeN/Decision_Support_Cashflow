"""Database verification script to test PostgreSQL connection and list authenticated users."""

import asyncio
import os
import sys

from pathlib import Path

# Ensure backend folder is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from sqlalchemy import select, text
from app.core.database import async_session_factory, engine
from app.models.user import User


async def check_db():
    print("=" * 60)
    print("PostgreSQL Database Connection & Authentication Data Check")
    print("=" * 60)

    # 1. Test raw connection & PostgreSQL version
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            db_version = result.scalar()
            print(f"✅ Connection Status: SUCCESSFUL")
            print(f"🐘 Database Engine: {db_version}\n")
    except Exception as e:
        print(f"❌ Connection Status: FAILED")
        print(f"Error: {e}")
        return

    # Ensure tables exist
    from app.core.database import create_tables
    await create_tables()

    # 2. Query users table
    try:
        async with async_session_factory() as session:
            stmt = select(User).order_by(User.created_at.desc())
            result = await session.execute(stmt)
            users = result.scalars().all()

            print(f"📊 Total Registered Users in DB: {len(users)}")
            print("-" * 60)
            if not users:
                print("No users found in the 'users' table yet.")
            else:
                for idx, u in enumerate(users, start=1):
                    print(f"[{idx}] User Record:")
                    print(f"    - ID:          {u.id}")
                    print(f"    - Name:        {u.name}")
                    print(f"    - Email:       {u.email}")
                    print(f"    - Role:        {u.role}")
                    print(f"    - Is Verified: {u.is_verified}")
                    print(f"    - Is Active:   {u.is_active}")
                    print(f"    - Password Hash: {u.hashed_password[:15]}... (Secured with bcrypt)")
                    print(f"    - Created At:  {u.created_at}")
                    print("-" * 60)
    except Exception as e:
        print(f"❌ Error querying users table: {e}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check_db())
