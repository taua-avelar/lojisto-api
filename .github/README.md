# Lojisto API - CI/CD Documentation

## Deployment Automático

### Configuração GitHub Actions

O deployment automático é executado sempre que há um push para a branch `main` ou pode ser executado manualmente.

#### Secrets Necessários

Configure os seguintes secrets no GitHub:

- `EC2_HOST`: 54.235.18.125
- `EC2_USER`: ubuntu  
- `EC2_PRIVATE_KEY`: Conteúdo da chave SSH privada

#### Processo de Deployment

1. **Build**: Compila a aplicação TypeScript
2. **Package**: Cria pacote com dist, node_modules e configs
3. **Deploy**: Envia para EC2 via SCP
4. **Setup**: Configura e inicia com PM2
5. **Verify**: Verifica se a aplicação está online

### Deployment Manual

Para fazer deployment manual:

```bash
# 1. Fazer build da aplicação
npm run build

# 2. Executar script de deploy
./deploy.sh /caminho/para/chave.pem
```

### Configuração PM2

A aplicação roda com PM2 usando as seguintes configurações:

- **Nome**: lojisto-api
- **Script**: dist/main.js
- **Porta**: 8000
- **Memória máxima**: 512MB
- **Logs**: /home/ubuntu/logs/

### Comandos Úteis

```bash
# Ver status das aplicações
pm2 status

# Ver logs da API
pm2 logs lojisto-api

# Reiniciar API
pm2 restart lojisto-api

# Parar API
pm2 stop lojisto-api
```

### Estrutura no EC2

```
/home/ubuntu/
├── lojisto-api/          # Backend API
│   ├── dist/             # Código compilado
│   ├── node_modules/     # Dependências
│   ├── ecosystem.config.js
│   └── .env
├── lojisto-front/        # Frontend (já existente)
└── logs/                 # Logs de ambas aplicações
    ├── lojisto-api-*.log
    └── lojisto-front-*.log
```

### Banco de Dados

A aplicação conecta no RDS PostgreSQL:
- **Host**: lojisto-postgres.ce5s2iasahw1.us-east-1.rds.amazonaws.com
- **Porta**: 5432
- **Database**: back_gestao_loja
