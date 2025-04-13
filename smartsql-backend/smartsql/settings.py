"""
Django settings for smartsql project.

Generated by 'django-admin startproject' using Django 5.2.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import dotenv_values, load_dotenv # Import load_dotenv
from io import StringIO


print("🔥 settings.py loaded!")

BASE_DIR = Path(__file__).resolve().parent.parent

IS_CLOUD_RUN = False

# 优先检查云端环境变量注入的 Secret 内容
if 'ENV_FILE' in os.environ:
    print("✅ 检测到 Cloud Run 的 ENV_FILE，将从环境变量中加载配置。")
    IS_CLOUD_RUN = True

    # 用 dotenv 解析 ENV_FILE 中的 .env 内容
    raw_env = os.environ.get("ENV_FILE", "")
    config = dotenv_values(stream=StringIO(raw_env))
    for key, value in config.items():
        os.environ[key] = value  # ✅ 手动注入环境变量
else:
    # 如果是本地运行，加载本地 .env 文件
    dotenv_path = BASE_DIR / '.env'
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
        print("✅ 加载本地 .env 文件。")
    else:
        print("⚠️ 本地 .env 文件不存在。")
    IS_CLOUD_RUN = False

# --- Get OpenAI API Key ---
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
print("✅ OPENAI_API_KEY Loaded:", OPENAI_API_KEY)

# === DEBUG 设置 ===
DEBUG = os.environ.get("DEBUG", "False") == "True" and not IS_CLOUD_RUN

# === ALLOWED_HOSTS ===
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
print("✅ ALLOWED_HOSTS Loaded:", ALLOWED_HOSTS)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'fallback-secret-key-if-not-set')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

# AI Settings
DB_SCHEMA_DESCRIPTION = os.environ.get("DB_SCHEMA_DESCRIPTION", "").encode().decode("unicode_escape")

# Read ALLOWED_HOSTS as comma-separated string and split into list
# Fallback to empty list if not set
# allowed_hosts_str = os.getenv('DJANGO_ALLOWED_HOSTS', '')
# ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_str.split(',') if host.strip()] if allowed_hosts_str else []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'instructor',
    'rest_framework',
    'corsheaders',
    'student',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'smartsql.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'smartsql.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'default_db_name'), # Provide fallback
        'USER': os.environ.get('DB_USER', 'default_db_user'), # Provide fallback
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),       # Fallback to empty string
        'HOST': os.environ.get('DB_HOST', 'localhost'),   # Fallback to localhost
        'PORT': os.environ.get('DB_PORT', '3306'),        # Fallback to default MySQL port
        'OPTIONS': {
            'auth_plugin': 'caching_sha2_password',
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://storage.googleapis.com",
]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.CustomJWTAuthentication',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=36500),  # 100年
    'REFRESH_TOKEN_LIFETIME': timedelta(days=36500),
    # ... 其他配置
}



