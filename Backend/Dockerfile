FROM node:20-alpine

WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il codice sorgente
COPY . .

# Compila il TypeScript
RUN npm run build

# Esponi la porta del backend
EXPOSE 8080

# Il comando viene sovrascritto dal docker-compose
# ma questo è il comando di default
CMD ["npm", "run", "start"]
