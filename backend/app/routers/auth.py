from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserRegister, UserResponse, Token
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Temporary in-memory user registry until database models are connected
fake_users_db = {}
user_id_counter = 1

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister):
    global user_id_counter
    if user_in.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_record = {
        "id": user_id_counter,
        "username": user_in.username,
        "email": user_in.email,
        "hashed_password": hash_password(user_in.password),
    }
    fake_users_db[user_in.email] = user_record
    user_id_counter += 1

    return UserResponse(id=user_record["id"], username=user_record["username"], email=user_record["email"])

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fake_users_db.get(form_data.username)  # form_data.username receives email/username
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user["id"])})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(id=user["id"], username=user["username"], email=user["email"]),
    }

from app.routers.deps import get_current_user

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user
