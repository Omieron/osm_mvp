# Python 3.11 tabanlı bir imaj kullan
FROM python:3.11

# Çalışma dizinini belirle
WORKDIR /app

# Gerekli paketleri yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir fastapi  # FastAPI'yi kesin olarak yükle

# Backend kodlarını konteynere kopyala
COPY . .

# Uygulamayı başlat
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]