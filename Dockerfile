# Utilizamos una imagen base ligera pero completa de Node 20
FROM node:20-bullseye-slim

# Instalamos FFmpeg, Wget y las dependencias de compilación para Canvas
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Descargamos el binario nativo e independiente de yt-dlp para Linux
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -O /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

# Configuramos el directorio de trabajo del bot
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias e instalamos
COPY package*.json ./
RUN npm install

# Copiamos el resto del código (index.js, .env si aplica, etc.)
COPY . .

# Exponemos el puerto de WebSockets para el Dashboard
EXPOSE 3001

# Comando de arranque
CMD ["node", "index.js"]