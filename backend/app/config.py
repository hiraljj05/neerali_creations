from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    owner_password_hash: str
    jwt_secret: str
    allowed_origin: str = "http://localhost:5173"
    jwt_expire_minutes: int = 60 * 2
    jwt_remember_minutes: int = 60 * 24 * 30

    class Config:
        env_file = ".env"


settings = Settings()
