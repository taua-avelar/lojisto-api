FROM node:22-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o código fonte
COPY . .

# Compilar o aplicativo
RUN npm run build

# Expor a porta da aplicação
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]
