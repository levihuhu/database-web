# 基础镜像（带 Python）
FROM python:3.10

# 不写 pyc 文件、打印实时输出
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# 复制所有项目文件
COPY . .

# 设置默认端口（Cloud Run 会自动设置 PORT 环境变量）
CMD ["gunicorn", "smartsql.wsgi:application", "--bind", "0.0.0.0:$PORT"]
