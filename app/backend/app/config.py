from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Mi Backend con FastAPI"
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()