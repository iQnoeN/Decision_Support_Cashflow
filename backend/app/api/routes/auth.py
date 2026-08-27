import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_verification_token,
    decode_access_token,
    hash_password,
    send_verification_email,
    verify_google_id_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    GoogleConfigResponse,
    GoogleLoginRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_to_response(user: User) -> UserResponse:
    """Convert a User ORM instance to a UserResponse schema."""
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        is_verified=user.is_verified,
        avatar="",
    )


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Create a new user and send a verification email."""
    logger.info("Registration attempt for %s", body.email)

    # Check if email already exists — if so, update password and details
    existing = await db.execute(select(User).where(User.email == body.email))
    existing_user = existing.scalar_one_or_none()
    if existing_user is not None:
        existing_user.name = body.name
        existing_user.hashed_password = hash_password(body.password)
        existing_user.role = body.role
        existing_user.is_verified = True
        await db.commit()
        await db.refresh(existing_user)
        return MessageResponse(
            message="Account credentials updated successfully! You can now sign in with your password.",
            detail="user_updated",
        )

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send verification email
    token = create_verification_token(body.email)
    email_sent = send_verification_email(body.email, token)

    if email_sent:
        return MessageResponse(
            message="Registration successful. Please check your email to verify your account.",
            detail="verification_email_sent",
        )
    else:
        user.is_verified = True
        await db.commit()
        return MessageResponse(
            message="Registration successful! Your account is active. You can now sign in.",
            detail="verification_email_skipped",
        )


@router.get(
    "/verify",
    response_model=MessageResponse,
    summary="Verify user email address",
)
async def verify_email(
    token: str = Query(..., description="Email verification token"),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Verify a user's email using the token from the verification link."""
    payload = decode_access_token(token)
    if payload is None or payload.get("purpose") != "email_verify":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token missing email claim",
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_verified:
        return MessageResponse(message="Email already verified. You can log in.")

    user.is_verified = True
    await db.commit()

    return MessageResponse(message="Email verified successfully. You can now log in.")


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT",
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate with email + password and receive a JWT."""
    logger.info("Login attempt for %s", body.email)

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            user.is_verified = True
            await db.commit()
            await db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in. Check your inbox.",
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated",
        )

    access_token = create_access_token(data={"sub": user.email})

    return TokenResponse(
        access_token=access_token,
        user=_user_to_response(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    return _user_to_response(current_user)


@router.get(
    "/google/config",
    response_model=GoogleConfigResponse,
    summary="Get Google OAuth client ID configuration",
)
async def get_google_config() -> GoogleConfigResponse:
    """Return public Google OAuth client ID for frontend authentication."""
    return GoogleConfigResponse(client_id=settings.GOOGLE_CLIENT_ID)


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Authenticate or register with Google OAuth ID token",
)
async def google_login(
    body: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Verify Google token, find or create user in database, and issue access token."""
    logger.info("Google OAuth login attempt")
    try:
        google_user = verify_google_id_token(body.token)
    except ValueError as e:
        logger.warning("Google login failed verification: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    email = google_user["email"].lower()
    name = google_user["name"]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            name=name,
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            role=body.role,
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("New user successfully created via Google: %s (%s)", email, body.role)
    else:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated",
            )
        if not user.is_verified:
            user.is_verified = True
            await db.commit()
            await db.refresh(user)
        logger.info("Existing user successfully authenticated via Google: %s", email)

    access_token = create_access_token(data={"sub": user.email})
    resp = _user_to_response(user)
    if google_user.get("picture"):
        resp.avatar = google_user["picture"]

    return TokenResponse(
        access_token=access_token,
        user=resp,
    )
