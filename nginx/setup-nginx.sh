#!/bin/bash

# Script para configurar nginx para a API Lojisto
# Execute este script no servidor EC2 como root ou com sudo

set -e

echo "🔧 Configurando nginx para API Lojisto..."

# Verificar se nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não está instalado. Instalando..."
    apt update
    apt install -y nginx
fi

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo "📜 Instalando certbot para SSL..."
    apt install -y certbot python3-certbot-nginx
fi

# Backup da configuração atual (se existir)
if [ -f "/etc/nginx/sites-available/api.lojisto.site" ]; then
    echo "📋 Fazendo backup da configuração existente..."
    cp /etc/nginx/sites-available/api.lojisto.site /etc/nginx/sites-available/api.lojisto.site.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copiar configuração do nginx
echo "📁 Copiando configuração do nginx..."
cp /home/ubuntu/lojisto-api/nginx/api.lojisto.site.conf /etc/nginx/sites-available/api.lojisto.site

# Criar link simbólico para sites-enabled
echo "🔗 Ativando site..."
ln -sf /etc/nginx/sites-available/api.lojisto.site /etc/nginx/sites-enabled/

# Remover configuração padrão se existir
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "🗑️ Removendo configuração padrão..."
    rm -f /etc/nginx/sites-enabled/default
fi

# Testar configuração do nginx
echo "🧪 Testando configuração do nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração do nginx válida!"
    
    # Recarregar nginx
    echo "🔄 Recarregando nginx..."
    systemctl reload nginx
    
    # Verificar se nginx está rodando
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx está rodando!"
    else
        echo "🚀 Iniciando nginx..."
        systemctl start nginx
        systemctl enable nginx
    fi
    
    echo ""
    echo "🎉 Configuração do nginx concluída!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure o DNS para apontar api.lojisto.site para este servidor"
    echo "2. Execute o comando para obter certificado SSL:"
    echo "   sudo certbot --nginx -d api.lojisto.site"
    echo ""
    echo "🌐 Após configurar SSL, sua API estará disponível em:"
    echo "   https://api.lojisto.site"
    echo ""
    echo "📊 Para verificar status:"
    echo "   sudo systemctl status nginx"
    echo "   sudo nginx -t"
    
else
    echo "❌ Erro na configuração do nginx!"
    exit 1
fi
