"""Pydantic schemas for authentication requests and responses."""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(
        default="finance_manager",
        pattern="^(financial_analyst|finance_manager|cfo_executive)$",
    )


class LoginRequest(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response returned after login/register."""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    """Public-facing user profile data."""
    id: str
    name: str
    email: str
    role: str
    is_verified: bool
    avatar: str = ""

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    detail: str = ""


class GoogleLoginRequest(BaseModel):
    """Schema for Google OAuth login/registration."""
    token: str = Field(..., description="Google ID Token / Credential")
    role: str = Field(
        default="finance_manager",
        pattern="^(financial_analyst|finance_manager|cfo_executive)$",
    )


class GoogleConfigResponse(BaseModel):
    """Schema for Google OAuth public configuration."""
    client_id: str | None = None
