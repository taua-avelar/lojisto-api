/**
 * Script para testar manualmente as permissões
 * 
 * Este script pode ser usado para testar manualmente as permissões em um ambiente de desenvolvimento.
 * Ele faz requisições para as APIs protegidas com diferentes tokens de autenticação e verifica
 * se as respostas são as esperadas.
 * 
 * Uso:
 * 1. Inicie o servidor NestJS
 * 2. Execute este script: node test-permissions.js
 */

const axios = require('axios');

// Configuração
const API_URL = 'http://localhost:3000';
const STORE_ID = '592db081-7694-469f-bb8f-cc9e6d9f8fb7'; // ID da loja para teste

// Tokens de autenticação (substitua pelos tokens reais)
const OWNER_TOKEN = 'token_do_proprietario';
const SELLER_WITH_PERMISSIONS_TOKEN = 'token_do_vendedor_com_permissoes';
const SELLER_WITHOUT_PERMISSIONS_TOKEN = 'token_do_vendedor_sem_permissoes';

// Função para fazer uma requisição com um token específico
async function makeRequest(method, url, token, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data,
    };

    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      error: error.response?.data || error.message,
    };
  }
}

// Função para testar uma rota específica
async function testRoute(description, method, url, tokens, data = null) {
  console.log(`\n=== Testando: ${description} ===`);
  console.log(`Método: ${method}, URL: ${url}`);

  for (const [role, token] of Object.entries(tokens)) {
    console.log(`\nTestando como ${role}:`);
    const result = await makeRequest(method, url, token, data);
    console.log(`Status: ${result.status}`);
    if (result.status >= 200 && result.status < 300) {
      console.log('Resultado: Sucesso');
    } else {
      console.log(`Erro: ${JSON.stringify(result.error)}`);
    }
  }
}

// Função principal para executar os testes
async function runTests() {
  console.log('Iniciando testes de permissões...\n');

  // Configurar os tokens para cada teste
  const tokens = {
    'Proprietário': OWNER_TOKEN,
    'Vendedor com permissões': SELLER_WITH_PERMISSIONS_TOKEN,
    'Vendedor sem permissões': SELLER_WITHOUT_PERMISSIONS_TOKEN,
  };

  // Testar rotas de produtos
  await testRoute(
    'Listar produtos',
    'get',
    `/stores/${STORE_ID}/products`,
    tokens
  );

  await testRoute(
    'Criar produto',
    'post',
    `/stores/${STORE_ID}/products`,
    tokens,
    { name: 'Produto Teste', price: 10 }
  );

  // Testar rotas de categorias
  await testRoute(
    'Listar categorias',
    'get',
    `/categories/store/${STORE_ID}`,
    tokens
  );

  await testRoute(
    'Criar categoria',
    'post',
    `/categories/store/${STORE_ID}`,
    tokens,
    { name: 'Categoria Teste' }
  );

  // Testar rotas de clientes
  await testRoute(
    'Listar clientes',
    'get',
    `/stores/${STORE_ID}/customers`,
    tokens
  );

  await testRoute(
    'Criar cliente',
    'post',
    `/stores/${STORE_ID}/customers`,
    tokens,
    { name: 'Cliente Teste', phone: '123456789' }
  );

  // Testar rotas de vendas
  await testRoute(
    'Listar vendas',
    'get',
    `/stores/${STORE_ID}/sales`,
    tokens
  );

  await testRoute(
    'Criar venda',
    'post',
    `/stores/${STORE_ID}/sales`,
    tokens,
    {
      customer_id: 'id_do_cliente',
      payment_method: 'cash',
      items: [
        { product_id: 'id_do_produto', quantity: 1, price: 10 }
      ]
    }
  );

  // Testar rotas de crediário
  await testRoute(
    'Listar vendas a crédito',
    'get',
    `/stores/${STORE_ID}/credit-sales`,
    tokens
  );

  // Testar rotas de comissões
  await testRoute(
    'Listar comissões',
    'get',
    `/stores/${STORE_ID}/commissions`,
    tokens
  );

  // Testar rotas de configuração da loja
  await testRoute(
    'Obter configuração da loja',
    'get',
    `/stores/${STORE_ID}/config`,
    tokens
  );

  await testRoute(
    'Atualizar configuração da loja',
    'patch',
    `/stores/${STORE_ID}/config`,
    tokens,
    { name: 'Loja Teste' }
  );

  // Testar rotas de usuários da loja
  await testRoute(
    'Listar usuários da loja',
    'get',
    `/stores/${STORE_ID}/users`,
    tokens
  );

  console.log('\nTestes concluídos!');
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro ao executar os testes:', error);
});
