# Despliegue en Heroku

## Requisitos previos

1. Cuenta en Heroku: https://signup.heroku.com/
2. Heroku CLI instalado: https://devcenter.heroku.com/articles/heroku-cli

## Pasos para desplegar

### 1. Instalar Heroku CLI (si no lo tienes)

```bash
# Windows (con chocolatey)
choco install heroku-cli

# O descarga el instalador desde:
# https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login en Heroku

```bash
heroku login
```

### 3. Crear la aplicación en Heroku

```bash
# Crea una nueva app (Heroku generará un nombre único)
heroku create

# O especifica un nombre personalizado
heroku create nombre-de-tu-app
```

### 4. Inicializar Git (si no lo has hecho)

```bash
git init
git add .
git commit -m "Preparar para deploy en Heroku"
```

### 5. Desplegar a Heroku

```bash
git push heroku main

# O si tu rama principal es 'master':
git push heroku master
```

### 6. Abrir la aplicación

```bash
heroku open
```

## Ver logs

```bash
heroku logs --tail
```

## Variables de entorno (opcional)

```bash
# Si necesitas configurar variables de entorno
heroku config:set NODE_ENV=production
```

## Comandos útiles

```bash
# Ver estado de la app
heroku ps

# Reiniciar la app
heroku restart

# Ver información de la app
heroku info

# Eliminar la app (cuidado!)
heroku apps:destroy nombre-de-tu-app
```

## Notas importantes

- La aplicación usa Angular SSR (Server-Side Rendering)
- El servidor escucha en el puerto que Heroku asigna dinámicamente (process.env.PORT)
- El build se ejecuta automáticamente en Heroku mediante el script `heroku-postbuild`
- Node.js versión 20.x es requerida

## URL de la aplicación

Después del despliegue, tu aplicación estará disponible en:
```
https://nombre-de-tu-app.herokuapp.com
```
