# 🥋 Omega Team - Frontend

React 18 + Vite frontend para plataforma de Taekwondo com suporte a múltiplos idiomas (PT, EN, ES) e painel ao vivo para árbitros.

## 📋 Status Atual

- **Versão:** 2.0.0
- **React:** 18+
- **Build Tool:** Vite
- **Idiomas:** Português, English, Español (100% de cobertura)
- **Deploy:** Render.com ou similar

## 🚀 Quick Start

### Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Criar .env com variáveis
VITE_BACKEND_URL=http://localhost:8000

# 3. Executar em dev
npm run dev
```

App rodando em `http://localhost:5173`

### Build & Preview

```bash
npm run build
npm run preview
```

## 📁 Estrutura

```
frontend/src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router config
├── i18n.js                     # ✨ Internacionalização
├── pages/
│   ├── Home.jsx               # Homepage
│   ├── Login.jsx              # Login
│   ├── Cadastro.jsx           # Registro (i18n ✅)
│   ├── Perfil.jsx             # Perfil de usuário
│   ├── Configuracoes.jsx      # Settings (i18n ✅)
│   ├── AdminDashboard.jsx     # Painel admin (refatorado)
│   ├── ArbitroDashboard.jsx   # Painel de árbitro
│   ├── MesarioPanel.jsx       # Painel ao vivo (i18n ✅)
│   ├── LateralPanel.jsx       # Controle de juiz (i18n ✅)
│   └── Live.jsx               # Transmissão ao vivo
├── components/
│   ├── home/                  # Componentes da home
│   ├── admin/                 # AdminEvento, etc (i18n ✅)
│   ├── auth/                  # Login, logout
│   └── common/                # Header, sidebar, etc
├── services/
│   ├── apiClient.js           # HTTP client com interceptores
│   └── api.js                 # Endpoints
├── contexts/
│   ├── AuthContext.jsx        # Autenticação
│   └── ThemeContext.jsx       # Tema (light/dark)
├── utils/
│   ├── enquadramento.js       # Lógica de categorias
│   └── categoriasPadrao.js    # Dados de categorias
└── i18n.js                    # 🌍 Configuração de idiomas
```

## 🌍 Internacionalização (i18n)

### Sistema Implementado
- **Framework:** react-i18next
- **Idiomas:** Portuguese (pt), English (en), Spanish (es)
- **Total de chaves:** 156 (80 originais + 76 novas)
- **Padrão:** kebab-case para nomes de chaves

### Componentes com i18n Completo ✅

| Componente | Strings | Status |
|-----------|---------|--------|
| MesarioPanel.jsx | 40+ | ✅ 100% |
| AdminEvento.jsx | 40+ | ✅ 100% |
| LateralPanel.jsx | 15+ | ✅ 100% |
| Cadastro.jsx | 14 | ✅ 100% |
| Configuracoes.jsx | 9 | ✅ 100% |

### Como Usar i18n

```javascript
import { useTranslation } from 'react-i18next';

export function MeuComponente() {
  const { t } = useTranslation();
  
  return (
    <>
      {/* Chave simples */}
      <h1>{t('titulo_pagina')}</h1>
      
      {/* Com interpolação */}
      <p>{t('bem_vindo', { nome: usuario.nome })}</p>
      
      {/* Em atributos */}
      <button title={t('tooltip_botao')}>
        {t('label_botao')}
      </button>
    </>
  );
}
```

### Estrutura de Chaves (i18n.js)

```javascript
const resources = {
  pt: {
    translation: {
      "titulo_pagina": "Meu Título",
      "bem_vindo": "Bem-vindo, {{nome}}!",
      "erro_conexao": "Erro ao conectar com o servidor",
      // ... 156 chaves
    }
  },
  en: {
    translation: {
      "titulo_pagina": "My Title",
      "bem_vindo": "Welcome, {{name}}!",
      "erro_conexao": "Error connecting to server",
      // ... 156 chaves
    }
  },
  es: {
    translation: {
      "titulo_pagina": "Mi Título",
      "bem_vindo": "¡Bienvenido, {{nombre}}!",
      "erro_conexao": "Error al conectar con el servidor",
      // ... 156 chaves
    }
  }
}
```

### Categorias de Chaves

**Erros (20):** erro_*, ERRO_GENERICO_*  
**Sucesso (8):** *_sucesso, conta_ativada_sucesso  
**UI Live (15):** painel_*, luta_*, aguardando_*  
**Labels (14):** check_in_*, juiz_*, placar_*  
**Status (5):** confirmado, pendente, cancelado  

## 🔧 Mudanças Recentes

### ✅ Correções de Bugs

**MesarioPanel.jsx (Linha 408)**
- ❌ Antes: `{t('media_final')}}`  (extra })
- ✅ Depois: `{t('media_final')}` (corrigido)

**Home.jsx**
- ❌ Antes: Código duplicado no final
- ✅ Depois: Limpeza e single export

### ✅ Internacionalização Completa

5 componentes principais agora totalmente traduzidos:
- MesarioPanel (live scoring)
- AdminEvento (event management)
- LateralPanel (judge controls)
- Cadastro (registration)
- Configuracoes (settings)

## 📦 Dependências Principais

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "react-i18next": "^13.5.0",
  "i18next": "^23.7.0",
  "i18next-language-detector": "^7.2.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.294.0",
  "react-hook-form": "^7.50.0",
  "zod": "^3.22.0"
}
```

## 🌍 Deploy no Render

### Build Command
```bash
npm run build
```

### Start Command (Web Service)
```bash
npm run preview
```

### Ou usar Static Site
```bash
# Apenas serve os arquivos static do dist/
```

### Environment Variables
```
VITE_BACKEND_URL=https://seu-backend.onrender.com
```

## 🎯 Roteamento

| Path | Componente | Acesso |
|------|-----------|--------|
| `/` | Home | Público |
| `/login` | Login | Público |
| `/cadastro` | Cadastro | Público |
| `/perfil` | Perfil | Autenticado |
| `/configuracoes` | Settings | Autenticado |
| `/admin` | AdminDashboard | Admin |
| `/arbitro` | ArbitroDashboard | Árbitro |
| `/mesario/{campId}` | MesarioPanel | Mesário |
| `/lateral/{campId}` | LateralPanel | Juiz Lateral |
| `/live/{campId}` | Live | Transmissão |

## 🎨 Tema & Styling

- **Framework:** Tailwind CSS 3+
- **Cores Principais:**
  - `omega-red`: #DC2626
  - `omega-dark`: #1F2937
- **Responsive:** Mobile-first design

## 🔐 Autenticação

Via **AuthContext** (React Context):
```javascript
// Armazena: nome, email, role, token
// Métodos: login(), logout(), isAuthenticated()
```

Tokens armazenados em `localStorage` (key: `usuarioOmegaTeam`)

## ⚡ Performance

- Code splitting automático (Vite)
- Lazy loading de páginas
- Otimização de imagens
- Caching de assets

## 🐛 Problemas Conhecidos

### Parse Error no Build
**Solução:** Verificar sintaxe JSX, especialmente `{t()}` com chaves extras.

### i18n não carregando
**Solução:** Verificar se `i18n.js` está importado em `main.jsx` antes de render.

## 📚 Adicionar Nova Chave de Tradução

1. Abra `src/i18n.js`
2. Adicione a chave em PT:
```javascript
"pt: { translation: { 
  "nova_chave": "Texto em português"
}}"
```
3. Adicione em EN e ES também
4. Use no componente:
```javascript
{t('nova_chave')}
```

## 🔄 Próximos Passos

- [ ] Implementar WebSocket para updates ao vivo
- [ ] Toast notifications (react-hot-toast)
- [ ] Novos componentes: Perfil, ArbitroDashboard
- [ ] PWA (Progressive Web App)
- [ ] Testes com Cypress/Vitest

## 👨‍💻 Stack

- React 18
- Vite
- Tailwind CSS
- i18next
- React Router v6
- Zod + React Hook Form

## 📄 Licença

Privado - Omega Team

---

**Última atualização:** 18 de Abril de 2026
