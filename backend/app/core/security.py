"""Security utilities: password hashing, JWT creation & verification, email sending."""

import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

import bcrypt

# ── Password hashing ─────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    try:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    except Exception:
        return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False


# ── JWT tokens ────────────────────────────────────────────────


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_verification_token(email: str) -> str:
    """Create a short-lived token for email verification (24 h)."""
    return create_access_token(
        {"sub": email, "purpose": "email_verify"},
        expires_delta=timedelta(hours=24),
    )


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT token. Returns payload dict or None."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


# ── Email sending ─────────────────────────────────────────────


def send_verification_email(to_email: str, token: str) -> bool:
    """Send an email-verification link via SMTP.

    Returns True if sent successfully, False otherwise.
    If SMTP is not configured, logs a warning and returns False.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP not configured — skipping verification email for %s. "
            "Set SMTP_USER and SMTP_PASSWORD in .env to enable.",
            to_email,
        )
        return False

    verify_url = f"{settings.FRONTEND_URL}/verify?token={token}"

    html_body = f"""\
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:32px">
      <h2 style="color:#14b8a6">CashflowAI — Verify Your Email</h2>
      <p>Click the button below to verify your email address and activate your account:</p>
      <a href="{verify_url}"
         style="display:inline-block;padding:14px 28px;background:#14b8a6;color:#0f172a;
                font-weight:700;text-decoration:none;border-radius:12px;margin:16px 0">
        Verify Email Address
      </a>
      <p style="font-size:13px;color:#94a3b8">
        If you did not create an account, you can safely ignore this email.
      </p>
      <p style="font-size:12px;color:#64748b;margin-top:24px">
        Or copy this link: {verify_url}
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your CashflowAI account"
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], [to_email], msg.as_string())
        logger.info("Verification email sent to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send verification email to %s", to_email)
        return False


# ── Google OAuth Token Verification ───────────────────────────

import json
import urllib.request
import urllib.error


def verify_google_id_token(token: str, expected_client_id: Optional[str] = None) -> dict[str, Any]:
    """Verify a Google OAuth ID token with Google's OAuth2 tokeninfo API.

    Returns payload dictionary containing email, name, picture, sub.
    Raises ValueError on invalid token or audience mismatch.
    """
    token_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
    try:
        req = urllib.request.Request(
            token_url,
            headers={"User-Agent": "CashflowApp/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                raise ValueError("Google token verification returned non-200 status")
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error("Failed to verify Google token: %s", str(e))
        raise ValueError(f"Invalid or expired Google token: {str(e)}") from e

    # Check audience if configured
    client_id = expected_client_id or settings.GOOGLE_CLIENT_ID
    if client_id:
        aud = payload.get("aud")
        azp = payload.get("azp")
        if aud != client_id and azp != client_id:
            logger.warning(
                "Google token audience mismatch. Expected: %s, Received aud: %s, azp: %s",
                client_id, aud, azp
            )
            raise ValueError("Token audience does not match configured Google Client ID")

    # Check issuer
    iss = payload.get("iss")
    if iss not in ["accounts.google.com", "https://accounts.google.com"]:
        raise ValueError("Invalid Google token issuer")

    email = payload.get("email")
    if not email:
        raise ValueError("Google token does not contain an email address")

    return {
        "email": email,
        "name": payload.get("name") or email.split("@")[0],
        "picture": payload.get("picture", ""),
        "email_verified": payload.get("email_verified") in [True, "true", "True"],
        "sub": payload.get("sub"),
    }
