# ⚡ QUICK START - CHECKLIST DE IMPLEMENTAÇÃO

**Tempo total**: ~40 horas (2-3 semanas)  
**Prioridade**: 🔴 🔴 🔴 CRÍTICA

---

## 📋 SEMANA 1 - ESTRUTURA & AUTH (10 horas)

### ✅ Pré-requisitos
- [ ] Ler [GUIA_MIGRACAO.md](GUIA_MIGRACAO.md) (20 min)
- [ ] Ler [ESTRUTURA_VISUAL.md](ESTRUTURA_VISUAL.md) (15 min)

### ✅ Passo 1: Atualizar main.jsx
```javascript
// main.jsx
import { AuthProvider } from './contexts/AuthContext'

// Envolver a App com AuthProvider
<AuthProvider>
  <App />
</AuthProvider>
```
- [ ] Feito

### ✅ Passo 2: Refatorar Login.jsx
- [ ] Remover fetch() direto
- [ ] Importar `useAuth` do AuthContext
- [ ] Importar `useForm` dos hooks
- [ ] Importar `toast` do services
- [ ] Importar `validateEmail, validatePassword` dos validators
- [ ] Implementar `useForm` com validação
- [ ] Testar com dados válidos
- [ ] Testar com dados inválidos
- [ ] Remover `localStorage.setItem` (agora em AuthContext)
- [ ] Remover `alert()` (agora `toast()`)

### ✅ Passo 3: Refatorar Cadastro.jsx
Mesmo processo que Login.jsx:
- [ ] Importar `useAuth`
- [ ] Importar `useForm`
- [ ] Implementar validação
- [ ] Testar fluxo completo (email → token → cadastro)

### ✅ Passo 4: Remover TODOS os alert()
Usar grep para encontrar:
```bash
grep -r "alert(" src/pages
```

Substituir cada um por:
```javascript
toast.success('...')   // ou error/warning/info
```

- [ ] Página Home.jsx
- [ ] Página Login.jsx ✅ (já feito)
- [ ] Página Cadastro.jsx ✅ (já feito)
- [ ] Página Perfil.jsx
- [ ] Página Configuracoes.jsx
- [ ] Página AdminDashboard.jsx
- [ ] Página ArbitroDashboard.jsx
- [ ] Página MesarioPanel.jsx
- [ ] Página LateralPanel.jsx
- [ ] Página Live.jsx

### ✅ Teste de Sanidade - Semana 1
```bash
npm run dev
```
- [ ] App carrega sem erro
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Sessão persiste ao recarregar
- [ ] Toasts aparecem (canto superior direito)
- [ ] Sem console errors

---

## 📋 SEMANA 2 - VALIDAÇÃO (10 horas)

### ✅ Passo 1: Adicionar useForm em TODOS os formulários

**Formulários a atualizar**:
- [ ] Login.jsx ✅ (já feito)
- [ ] Cadastro.jsx ✅ (já feito)
- [ ] Perfil.jsx - `atualizar-perfil`
- [ ] Perfil.jsx - `alterar-senha`
- [ ] Configuracoes.jsx - `atualizar-preferencias`
- [ ] AdminDashboard.jsx - `criar-campeonato`
- [ ] AdminDashboard.jsx - `criar-categoria`
- [ ] Home.jsx - `inscrever-campeonato` (se houver)

### ✅ Passo 2: Implementar validação em cada formulário

Template:
```javascript
import { useForm } from '@/hooks';
import { validateEmail, validatePassword } from '@/utils/validators/schemas';

const { values, errors, handleChange, handleSubmit } = useForm({
  initialValues: { email: '', senha: '' },
  validate: (v) => {
    const errs = {};
    if (v.email && validateEmail.validate(v.email) !== true) {
      errs.email = 'Email inválido';
    }
    return errs;
  },
  onSubmit: async (valores) => {
    // ... enviar dados
  }
});
```

- [ ] Perfil.jsx
- [ ] Configuracoes.jsx
- [ ] AdminDashboard.jsx (formulário campeonato)
- [ ] AdminDashboard.jsx (formulário categoria)

### ✅ Passo 3: Remover validação fraca

Encontrar todos os:
```javascript
type="email"        // ❌ Remover
required            // ❌ Remover (usar validador)
pattern="..."       // ❌ Remover
```

Substituir por validadores específicos do `schemas.js`

- [ ] Home.jsx
- [ ] Login.jsx ✅
- [ ] Cadastro.jsx ✅
- [ ] Perfil.jsx
- [ ] Configuracoes.jsx
- [ ] AdminDashboard.jsx

### ✅ Teste de Sanidade - Semana 2
- [ ] Email inválido mostra erro
- [ ] Senha fraca mostra erro
- [ ] CPF inválido mostra erro (Perfil)
- [ ] Formulário com erro NÃO envia
- [ ] Sem validação genérica (type="email")

---

## 📋 SEMANA 3 - COMPONENTES GRANDES (12 horas)

### ✅ Passo 1: Dividir AdminDashboard.jsx (1100 linhas)

**Estrutura final**:
```
components/
├── admin/
│   ├── AdminTabs.jsx              (wrapper - 50 linhas)
│   ├── AdminCampeonatos.jsx       (aba campeonatos - 200 linhas)
│   ├── AdminCategorias.jsx        (aba categorias - 200 linhas)
│   ├── AdminEvento.jsx            (aba evento - 200 linhas)
│   └── AdminUsuarios.jsx          (aba usuários - 150 linhas)
```

**Passo a passo**:
1. [ ] Criar pasta `components/admin/`
2. [ ] Extrair lógica de campeonatos → AdminCampeonatos.jsx
3. [ ] Extrair lógica de categorias → AdminCategorias.jsx
4. [ ] Extrair lógica de evento → AdminEvento.jsx
5. [ ] Extrair lógica de usuários → AdminUsuarios.jsx
6. [ ] Criar AdminTabs.jsx que importa os 4 componentes
7. [ ] Atualizar AdminDashboard.jsx para usar AdminTabs
8. [ ] Testar cada aba

### ✅ Passo 2: Dividir Home.jsx (450 linhas)

**Estrutura final**:
```
components/
├── home/
│   ├── HomeBanner.jsx             (topo - 80 linhas)
│   ├── CampeonatosLista.jsx       (lista campeonatos - 120 linhas)
│   ├── MuralNoticias.jsx          (notícias - 100 linhas)
│   └── InscricaoModal.jsx         (modal - 80 linhas)
```

**Passo a passo**:
1. [ ] Criar pasta `components/home/`
2. [ ] Extrair banner → HomeBanner.jsx
3. [ ] Extrair lista → CampeonatosLista.jsx
4. [ ] Extrair notícias → MuralNoticias.jsx
5. [ ] Extrair modal → InscricaoModal.jsx
6. [ ] Home.jsx agora importa estes componentes
7. [ ] Testar cada seção

### ✅ Passo 3: Refatorar Perfil.jsx (300 linhas)

**Estrutura final**:
```
components/
├── perfil/
│   ├── PerfilForm.jsx             (dados - 120 linhas)
│   ├── FotoUpload.jsx             (foto com crop - 80 linhas)
│   └── SenhaForm.jsx              (alterar senha - 60 linhas)
```

**Passo a passo**:
1. [ ] Criar pasta `components/perfil/`
2. [ ] Extrair formulário dados → PerfilForm.jsx
3. [ ] Extrair upload foto → FotoUpload.jsx
4. [ ] Extrair alterar senha → SenhaForm.jsx
5. [ ] Perfil.jsx agora é um container
6. [ ] Testar cada componente

### ✅ Teste de Sanidade - Semana 3
- [ ] AdminDashboard carrega (dividido em componentes)
- [ ] Cada aba funciona
- [ ] Home carrega (dividido em seções)
- [ ] Perfil carrega (dividido em componentes)
- [ ] Sem console errors
- [ ] Sem duplicate keys (React warning)

---

## 📋 SEMANA 4 - PERFORMANCE & FINAL (8 horas)

### ✅ Passo 1: Remover Polling

Encontrar todos os `setInterval` / `setTimeout` com polling:
```bash
grep -r "setInterval\|setTimeout" src/pages
```

Substituir por WebSocket (FUTURE - adicionar depois):
- [ ] Live.jsx - polling a cada 10s → WebSocket
- [ ] MesarioPanel.jsx - polling contínuo → WebSocket
- [ ] LateralPanel.jsx - polling a cada 2s → WebSocket

### ✅ Passo 2: Lazy Loading de Imagens

Adicionar em componentes que exibem imagens:
```javascript
<img src="..." loading="lazy" />
```

- [ ] Home.jsx (imagens de campeonatos)
- [ ] Perfil.jsx (foto de perfil)
- [ ] AdminDashboard.jsx (se houver imagens)

### ✅ Passo 3: React.memo para componentes pequenos

```javascript
export default React.memo(MeuComponente);
```

Aplicar em componentes que recebem mesmas props:
- [ ] `components/common/*`
- [ ] `components/forms/*`
- [ ] `components/admin/*`

### ✅ Passo 4: Code Cleanup

- [ ] Remover `console.log` em produção
- [ ] Remover comentários desnecessários
- [ ] Remover imports não utilizados
- [ ] Formatar código (Prettier)

### ✅ Teste Final - Semana 4
```bash
npm run build
npm run preview  # Testar build de produção
```

- [ ] Build sem warnings
- [ ] App funciona em produção
- [ ] Nenhum console error
- [ ] Performance melhorada (DevTools)
- [ ] Lighthouse score > 90

---

## 🔄 CHECKLIST GERAL

### Antes de começar
- [ ] Fazer backup do código (`git commit`)
- [ ] Ler toda a documentação

### Semana 1
- [ ] ✅ AuthProvider em main.jsx
- [ ] ✅ Login refatorado
- [ ] ✅ Cadastro refatorado
- [ ] ✅ Remover todos alert()

### Semana 2
- [ ] ✅ useForm em todos formulários
- [ ] ✅ Validadores implementados
- [ ] ✅ Sem validação fraca (type="email")

### Semana 3
- [ ] ✅ AdminDashboard dividido (4 componentes)
- [ ] ✅ Home dividido (5 componentes)
- [ ] ✅ Perfil refatorado (3 componentes)

### Semana 4
- [ ] ✅ Polling removido
- [ ] ✅ Lazy loading implementado
- [ ] ✅ React.memo aplicado
- [ ] ✅ Code cleanup

### Testes
- [ ] ✅ Funcional (todas as features)
- [ ] ✅ Performance (DevTools)
- [ ] ✅ Validação (todos os formulários)
- [ ] ✅ Autenticação (login/logout)

---

## 📊 RASTREAMENTO DE PROGRESSO

```
Semana 1: [████░░░░░░] 40%
Semana 2: [░░░░░░░░░░]  0%
Semana 3: [░░░░░░░░░░]  0%
Semana 4: [░░░░░░░░░░]  0%
─────────────────────────
Total:    [████░░░░░░] 10%
```

---

## 📞 DÚVIDAS DURANTE A IMPLEMENTAÇÃO?

1. Revisar [GUIA_MIGRACAO.md](GUIA_MIGRACAO.md)
2. Revisar exemplos em componentes já refatorados
3. Testar em `npm run dev`
4. Verificar console para errors

---

## ✅ SUCESSO!

Quando tudo estiver pronto:
```bash
npm run build
npm run deploy  # ou push para Render
```

**Resultado final**:
- ✅ Frontend profissional
- ✅ Código limpo e manutenível
- ✅ Performance otimizada
- ✅ Pronto para produção
- ✅ Fácil de escalar

🚀 **Let's go!**
