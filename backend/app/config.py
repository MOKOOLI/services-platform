from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./dev.db"
    admin_api_key: str = ""
    cors_origins: str = "http://localhost:3000"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model_default: str = "qwen2.5:7b"
    ollama_model_long: str = "qwen2.5:14b"
    ollama_timeout: float = 180.0

    app_env: str = "development"          # set to "production" on Render
    public_api_url: str = "http://localhost:8000"   # used for the payment callback URL

    # Payments: none | zarinpal | mock (mock is refused when app_env == production)
    payment_provider: str = "none"
    zarinpal_merchant_id: str = ""
    zarinpal_sandbox: bool = False

    # Object storage (S3-compatible: Cloudflare R2, AWS S3, Backblaze B2, MinIO)
    s3_endpoint_url: str = ""
    s3_public_endpoint_url: str = ""      # endpoint the BROWSER uses (defaults to s3_endpoint_url)
    s3_region: str = "auto"
    s3_bucket: str = ""
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    max_upload_mb: int = 25
    max_files_per_order: int = 20

    # Notifications
    public_site_url: str = "http://localhost:3000"
    resend_api_key: str = ""
    email_from: str = "Services <onboarding@resend.dev>"
    n8n_webhook_url: str = ""
    n8n_webhook_secret: str = ""

    @property
    def sqlalchemy_url(self) -> str:
        url = self.database_url
        # Render/Heroku style URLs -> psycopg3 driver
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
