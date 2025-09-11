# Instalar todas las dependencias del proyecto
npm install
# o
yarn install

# Instalar una nueva dependencia
npm install 
# o
yarn add 

# Instalar una dependencia de desarrollo
npm install --save-dev 
# o
yarn add --dev 


# Limpiar la caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rd /s /q node_modules
del package-lock.json
npm install