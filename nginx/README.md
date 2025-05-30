# Configuração Nginx para API Lojisto

Este diretório contém as configurações necessárias para configurar o nginx como proxy reverso para a API Lojisto.

## Arquivos

- `api.lojisto.site.conf` - Configuração do nginx para o domínio api.lojisto.site
- `setup-nginx.sh` - Script automatizado para configurar o nginx
- `README.md` - Esta documentação

## Configuração Automática

### 1. Executar o script de configuração

```bash
# No servidor EC2, execute:
sudo bash /home/ubuntu/lojisto-api/nginx/setup-nginx.sh
```

### 2. Configurar DNS

Configure o DNS para apontar `api.lojisto.site` para o IP do servidor EC2:
- **Tipo**: A
- **Nome**: api.lojisto.site
- **Valor**: 54.235.18.125

### 3. Obter certificado SSL

```bash
# Após configurar o DNS, execute:
sudo certbot --nginx -d api.lojisto.site
```

## Configuração Manual

### 1. Instalar nginx e certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Copiar configuração

```bash
sudo cp /home/ubuntu/lojisto-api/nginx/api.lojisto.site.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/api.lojisto.site.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 3. Testar e recarregar

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Recursos da Configuração

### Segurança
- ✅ Redirecionamento HTTP → HTTPS
- ✅ Headers de segurança (XSS, CSRF, etc.)
- ✅ Rate limiting (10 req/s com burst de 20)
- ✅ SSL/TLS moderno (TLS 1.2+)

### Performance
- ✅ Compressão gzip
- ✅ Proxy buffering otimizado
- ✅ Cache de sessão SSL
- ✅ HTTP/2 habilitado

### CORS
- ✅ Configurado para https://lojisto.site
- ✅ Suporte a preflight requests
- ✅ Headers necessários para API

### Proxy Reverso
- ✅ Proxy para http://127.0.0.1:8000 (PM2)
- ✅ Headers de proxy corretos
- ✅ Timeouts configurados
- ✅ WebSocket support (se necessário)

## Comandos Úteis

```bash
# Verificar status do nginx
sudo systemctl status nginx

# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/api.lojisto.site.access.log
sudo tail -f /var/log/nginx/api.lojisto.site.error.log

# Verificar certificados SSL
sudo certbot certificates

# Renovar certificados (automático via cron)
sudo certbot renew --dry-run
```

## Estrutura Final

Após a configuração, a estrutura será:

```
Internet → nginx (443/80) → PM2 (8000) → NestJS API
```

- **nginx**: Proxy reverso, SSL, segurança, cache
- **PM2**: Gerenciamento de processo, logs, restart
- **NestJS**: API backend

## Troubleshooting

### Erro 502 Bad Gateway
```bash
# Verificar se a API está rodando
pm2 status
pm2 logs lojisto-api

# Verificar se a porta 8000 está aberta
sudo netstat -tlnp | grep :8000
```

### Erro de SSL
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew
```

### Logs do nginx
```bash
# Logs de acesso
sudo tail -f /var/log/nginx/api.lojisto.site.access.log

# Logs de erro
sudo tail -f /var/log/nginx/api.lojisto.site.error.log
```
