#!/bin/bash

# Compilar o código TypeScript
echo "Compilando o código..."
npm run build

# Executar o script de teste
echo "Executando o teste de pagamento..."
node dist/credit-sales/test-payment.js
