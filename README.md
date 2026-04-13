# Musicardi Web - Real-Time Studio Dashboard

Musicardi Web es la interfaz de control oficial para el ecosistema Musicardi. Desarrollada en Next.js, proporciona un panel de grado de estudio, minimalista y orientado a datos, que permite la monitorización y manipulación de la reproducción en Discord con latencia sub-50ms.

## Características Principales

* **Sincronización Bidireccional:** Implementación de WebSockets para reflejar el estado del motor de audio (tiempo, pausa, cola) instantáneamente en el cliente.
* **Procesamiento de Letras (LRC):** Integración con LRCLib para el análisis y desplazamiento sincronizado de letras basado en el timestamp del flujo de audio activo.
* **Interfaz de Estudio Minimalista:** Diseño utilitario y libre de elementos distractores, con adaptación colorimétrica dinámica basada en el análisis del cover art actual.
* **Control de Motor de Automatización:** Acceso directo a los parámetros del algoritmo del backend, permitiendo alternar los módulos Autoplay y Discovery en tiempo real.
* **Gestión de Cola:** Interfaz de usuario interactiva con soporte para operaciones Drag & Drop sobre la lista de reproducción activa.

## Stack Tecnológico

* **Framework:** Next.js (App Router)
* **Librería UI:** React
* **Estilos:** Tailwind CSS
* **Protocolo de Red:** Socket.io-client

## Requisitos del Sistema

1. Node.js (v18.x o superior)
2. Instancia de Musicardi Core en ejecución y accesible vía red.

## Configuración del Entorno

Crear un archivo `.env.local` en el directorio raíz:

```env
NEXT_PUBLIC_BOT_URL=http://localhost:3001
```
*(Nota: Especificar la URL exacta de transmisión del servicio WebSocket del backend).*

## Despliegue

1. Instalar dependencias:
```bash
git clone <url-del-repositorio>
cd musicardi-web
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

El panel estará accesible a través de `http://localhost:3000`.
