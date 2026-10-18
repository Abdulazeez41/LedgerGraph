import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "LedgerGraph - SME Credit & Working Capital Copilot for Developing & Frontier Markets"
    VERSION: str = "1.0.0"

    # FalkorDB settings
    FALKORDB_HOST: str = os.getenv("FALKORDB_HOST", "localhost")
    FALKORDB_PORT: int = int(os.getenv("FALKORDB_PORT", "6380"))
    FALKORDB_GRAPH: str = os.getenv("FALKORDB_GRAPH", "ledgergraph")

    # Currency Settings (Universal / Frontier Market)
    CURRENCY_SYMBOL: str = os.getenv("CURRENCY_SYMBOL", "$")
    CURRENCY_CODE: str = os.getenv("CURRENCY_CODE", "USD")

    # LLM Settings (OpenAI / OpenAI compatible)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
