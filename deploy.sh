#!/bin/bash

# Script de deployment para o Lojisto Backend API
# Este script cria um pacote com todos os arquivos necessários e envia para o EC2

set -e

echo "🚀 Iniciando processo de deployment da API..."

# Configurações
EC2_HOST="54.235.18.125"
EC2_USER="ubuntu"
REMOTE_DIR="/home/ubuntu/lojisto-api"
PACKAGE_NAME="lojisto-api-deployment.tar.gz"

# Verificar se a chave SSH foi fornecida
if [ -z "$1" ]; then
    echo "❌ Erro: Caminho para a chave SSH não fornecido"
    echo "Uso: ./deploy.sh /caminho/para/sua/chave.pem"
    exit 1
fi

SSH_KEY="$1"

# Verificar se a chave SSH existe
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Erro: Chave SSH não encontrada: $SSH_KEY"
    exit 1
fi

# Verificar se o build existe
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build não encontrado. Execute 'npm run build' primeiro."
    exit 1
fi

echo "📦 Criando pacote de deployment..."

# Criar lista de arquivos para incluir no pacote
cat > .deployignore << EOF
.git
.gitignore
.env.local
.env.development.local
.env.test.local
.env.production.local
*.log
.DS_Store
Thumbs.db
.idea
.vscode
*.swp
*.swo
coverage
.nyc_output
deploy.sh
.deployignore
README.md
docker-compose.yml
Dockerfile
.dockerignore
node_modules/.cache
node_modules/.bin
src
test
*.spec.ts
*.test.ts
tsconfig.json
tsconfig.build.json
nest-cli.json
eslint.config.mjs
.prettierrc
dist/**/*.d.ts
dist/**/*.map
dist/**/*.tsbuildinfo
EOF

# Criar o pacote com os arquivos necessários (incluindo node_modules)
echo "📁 Incluindo arquivos no pacote (incluindo node_modules para evitar problemas de memória no EC2)..."
tar --exclude-from=.deployignore -czf "$PACKAGE_NAME" \
    dist \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    nginx \
    node_modules

echo "📤 Enviando pacote para o EC2..."

# Enviar o pacote para o EC2
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$PACKAGE_NAME" "$EC2_USER@$EC2_HOST:/home/ubuntu/"

echo "🔧 Configurando aplicação no EC2..."

# Executar comandos no EC2
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'ENDSSH'
    set -e

    echo "🛑 Parando aplicação anterior (se existir)..."
    pm2 stop lojisto-api || true
    pm2 delete lojisto-api || true

    echo "🗂️ Preparando diretório..."
    sudo rm -rf /home/ubuntu/lojisto-api
    mkdir -p /home/ubuntu/lojisto-api
    mkdir -p /home/ubuntu/logs

    echo "📦 Extraindo pacote..."
    cd /home/ubuntu
    tar -xzf lojisto-api-deployment.tar.gz -C lojisto-api

    echo "⚙️ Criando arquivo .env..."
    cd lojisto-api
    cat > .env << 'ENVEOF'
PORT=8000
DB_HOST=lojisto-postgres.ce5s2iasahw1.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123!
DB_DATABASE=back_gestao_loja
JWT_SECRET=$2a$12$KJvgTw809rPZ6dJV/DClPenLHI/4rBzmVbdmEATYhSwcIlB.SwNui
FRONTEND_URL=https://lojisto.site,http://localhost:3000
ENVEOF

    echo "✅ Dependências já incluídas no pacote, pulando instalação..."

    echo "🚀 Iniciando aplicação com PM2..."
    pm2 start ecosystem.config.js
    pm2 save

    echo "📊 Status da aplicação:"
    pm2 status

    echo "🧹 Limpando arquivos temporários..."
    rm -f /home/ubuntu/lojisto-api-deployment.tar.gz

    echo "✅ Deployment concluído com sucesso!"
    echo "🌐 API rodando em: http://54.235.18.125:8000"
ENDSSH

# Limpar arquivo temporário local
rm -f "$PACKAGE_NAME"
rm -f .deployignore

echo ""
echo "🎉 Deployment concluído com sucesso!"
echo "🌐 Sua API está rodando em: http://$EC2_HOST:8000"
echo "📊 Para verificar o status: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'pm2 status'"
echo "📋 Para ver os logs: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'pm2 logs lojisto-api'"
