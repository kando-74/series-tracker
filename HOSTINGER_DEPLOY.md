# Deploy en Hostinger - Series Tracker

## Requisitos
- Plan Hostinger Application Hosting con Node.js (compatible con Next.js)
- Git o acceso para subir archivos ZIP

## Paso 1: Preparar el proyecto para producción

```bash
cd ~/series-tracker

# Instalar dependencias
npm install

# Hacer build de producción
npm run build
```

Esto genera la carpeta `.next/` con la aplicación compilada.

## Paso 2: Subir a Hostinger

### Opción A: Via Git (recomendado)
1. Sube el proyecto a GitHub/GitLab
2. En Hostinger → Application → New Application → Git Repository
3. Conecta tu repositorio y hace deploy automático

### Opción B: Via ZIP
1. Comprime todo el proyecto EXCEPTO `node_modules`
```bash
cd ~/series-tracker
zip -r series-tracker.zip . -x "node_modules/*" -x ".next/cache/*"
```
2. Sube el ZIP via File Manager de Hostinger
3. Descomprime en el directorio de la aplicación

## Paso 3: Configurar Variables de Entorno (importante)

En Hostinger → Application Settings → Environment Variables, añade:

```
JWT_SECRET=una-clave-secreta-aleatoria-muy-larga
NODE_ENV=production
```

Genera una clave segura con:
```bash
openssl rand -base64 32
```

## Paso 4: Iniciar la aplicación

Hostinger Application Hosting debería detectar automáticamente:
- Framework: Next.js
- Build command: `npm run build`
- Start command: `npm start`

Si no, configúralo manualmente.

## Estructura de archivos necesaria en Hostinger

```
/series-tracker/
├── app/
├── lib/
├── public/
├── .next/
├── data/              ← se crea automáticamente (contiene tracker.db)
├── node_modules/
├── package.json
├── schema.sql
├── next.config.js
└── (todos los archivos del proyecto)
```

## Base de datos

La base de datos SQLite se guarda en:
```
/data/tracker.db
```

Este archivo se crea automáticamente al usar la app por primera vez.

## Troubleshooting

### Error 500 al iniciar
- Verifica que `JWT_SECRET` está configurado
- Revisa los logs en Hostinger → Application → Logs

### No responde en el puerto
- Hostinger expone el puerto 3000 por defecto
- La variable `PORT` puede necesitar configuración

### Errores de permisos en /data
```bash
chmod 755 /data
chmod 644 /data/tracker.db 2>/dev/null
```

## Dominio personalizado

En Hostinger → Application → Settings → Domain:
1. Conecta tu dominio
2. SSL se configura automáticamente
3. Asegúrate de que el dominio apunta a la aplicación

## Actualizaciones

Para actualizar:
1. Sube los archivos modificados
2. Ejecuta `npm run build` de nuevo
3. Reinicia la aplicación desde el panel de Hostinger
