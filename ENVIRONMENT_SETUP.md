# Configuração de Variáveis de Ambiente

## Resumo das Alterações

Todas as referências às URLs do backend (`http://localhost:8000`) foram migradas para usar variáveis de ambiente. Isso permite que o seu aplicativo funcione corretamente em diferentes ambientes (local, staging, produção).

## Arquivos Criados/Modificados

### ✅ Novos Arquivos:
- **`.env`** - Variáveis de ambiente local (não fazer commit)
- **`.env.example`** - Exemplo de configuração (fazer commit)
- **`src/services/api.js`** - Módulo centralizado para chamadas à API

### ✅ Arquivos Atualizados:
Todos os 9 componentes foram atualizados para importar e usar `API_BASE_URL`:
1. `src/pages/Login.jsx`
2. `src/pages/Cadastro.jsx`
3. `src/pages/Home.jsx`
4. `src/pages/AdminDashboard.jsx`
5. `src/pages/Perfil.jsx`
6. `src/pages/Configuracoes.jsx`
7. `src/pages/LateralPanel.jsx`
8. `src/pages/MesarioPanel.jsx`
9. `src/pages/ArbitroDashboard.jsx`
10. `src/pages/Live.jsx`

## Como Usar

### 1. **Desenvolvimento Local**

O arquivo `.env` já está configurado para apontar ao backend local:

```env
VITE_BACKEND_URL=http://localhost:8000
```

Garanta que seu backend está rodando em `http://localhost:8000`.

### 2. **Deploy no Render**

Quando fizer deploy no Render, adicione a variável de ambiente no painel de controle:

1. Vá para seu projeto no Render Dashboard
2. Acesse **Environment**
3. Adicione a variável:
   ```
   VITE_BACKEND_URL=https://seu-backend.onrender.com
   ```
   (Substitua pela URL real do seu backend no Render)

4. Faça o redeploy

### 3. **Outros Ambientes**

Para qualquer outro ambiente (staging, produção, etc.), adicione a variável correspondente:

```env
VITE_BACKEND_URL=https://seu-dominio.com/api
```

## Importação da API Base URL

Nos arquivos de componentes, a importação é feita assim:

```javascript
import { API_BASE_URL } from '../services/api';
```

E está disponível para usar diretamente:

```javascript
const response = await fetch(`${API_BASE_URL}/api/endpoint`);
```

## Módulo API Helper (Novo)

Criamos um módulo `src/services/api.js` que centraliza as chamadas à API com helpers úteis:

```javascript
import { apiGet, apiPost, apiPatch, apiDelete, API_BASE_URL } from '../services/api';

// Usar os helpers
const data = await apiGet('/api/campeonatos');
const result = await apiPost('/api/inscricoes', payload);
```

## ⚠️ Importante

- **Não faça commit do arquivo `.env`** - Ele está no `.gitignore`
- Use `.env.example` como template para documentar quais variáveis são necessárias
- As variáveis no `.env` devem ser prefixadas com `VITE_` para serem acessíveis no código (isso é um requirement do Vite)

## Verificação

Para verificar se tudo está funcionando:

1. No console do navegador, execute:
   ```javascript
   console.log(import.meta.env.VITE_BACKEND_URL)
   ```

2. Você deve ver a URL configurada no `.env`

## Suporte

Se tiver dúvidas sobre a configuração de variáveis no Render, consulte:
- https://render.com/docs/configure-environment-variables
