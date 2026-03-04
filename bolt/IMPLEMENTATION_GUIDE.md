# Guia de Implementação - Duka v2.0

**Data:** 04/03/2026
**Versão:** 2.0.0

---

## O Que Foi Feito

Reconstrução completa do sistema Duka com foco em mobile-first, inspirado nos padrões de UX do Tinder e Uber.

### Principais Mudanças

1. **Design System Completo** (`DESIGN_SYSTEM.md`)
   - Tokens CSS (cores, espaçamentos, tipografia)
   - Componentes padronizados
   - Micro-interações e animações
   - UX Writing em português brasileiro

2. **Banco de Dados Supabase**
   - 8 tabelas principais (properties, units, tenants, contracts, charges, payments, expenses, users)
   - Row Level Security (RLS) em todas as tabelas
   - Políticas restritivas baseadas em `auth.uid()`
   - Indexes para performance

3. **Componentes React + TypeScript**
   - Dashboard com métricas em cards grandes (hero numbers)
   - Cobranças com cards swipeable (arrastar para editar/deletar)
   - Despesas com mesma interação swipe
   - Bottom navigation fixa (mobile)
   - Estados de loading (skeleton)
   - Empty states com UX writing humanizado

4. **Autenticação**
   - Supabase Auth integrado
   - Fluxo de login/cadastro
   - Proteção de rotas

---

## Como Funciona

### Estrutura do Projeto

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx       # Tela principal com métricas
│   │   └── MetricCard.tsx      # Card de métrica individual
│   ├── Charges/
│   │   ├── Charges.tsx         # Lista de cobranças
│   │   └── ChargeCard.tsx      # Card swipeable de cobrança
│   ├── Expenses/
│   │   ├── Expenses.tsx        # Lista de despesas
│   │   └── ExpenseCard.tsx     # Card swipeable de despesa
│   └── shared/
│       ├── Badge.tsx           # Badge de status (pago, pendente, etc)
│       ├── Button.tsx          # Botão com variantes
│       ├── Card.tsx            # Card base
│       └── BottomNav.tsx       # Navegação inferior
├── lib/
│   ├── supabase.ts            # Cliente Supabase + tipos
│   └── formatters.ts          # Formatação de moeda, data, etc
├── styles/
│   ├── tokens.css             # Variáveis CSS
│   └── components.css         # Estilos dos componentes
└── App.tsx                    # App principal com roteamento
```

### Fluxo de Dados

1. **Autenticação:**
   - Usuário faz login/cadastro via Supabase Auth
   - Token JWT armazenado automaticamente
   - RLS verifica `auth.uid()` em todas as queries

2. **Dashboard:**
   - Busca todas as `properties` do usuário
   - Agrega `charges` e `expenses` do mês atual
   - Calcula métricas (a receber, recebido, despesas, resultado)
   - Renderiza cards com valores formatados

3. **Cobranças/Despesas:**
   - Lista items do banco com join de `properties` (nome do imóvel)
   - Cards com swipe gesture:
     - Swipe left: revela botões de editar/deletar
     - Swipe < -80px: trava aberto
     - Swipe > -80px: fecha
   - Delete com confirmação

---

## Como Usar

### 1. Setup Inicial

```bash
# Instalar dependências (já está pronto)
npm install

# Configurar variáveis de ambiente
# Já está configurado no .env
```

### 2. Rodar em Desenvolvimento

```bash
npm run dev
```

### 3. Criar Primeiro Usuário

1. Abrir o app
2. Clicar em "Criar conta"
3. Preencher email, senha, nome
4. Fazer login

### 4. Adicionar Dados de Teste

Execute no console do navegador (ou crie via SQL no Supabase):

```js
// 1. Criar um imóvel
const { data: property } = await supabase
  .from('properties')
  .insert({
    name: 'Condomínio do Sol',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    total_units: 12
  })
  .select()
  .single();

// 2. Criar uma unidade
const { data: unit } = await supabase
  .from('units')
  .insert({
    property_id: property.id,
    unit_number: 'Apto 101',
    floor: 1,
    bedrooms: 2,
    bathrooms: 1,
    status: 'rented'
  })
  .select()
  .single();

// 3. Criar um inquilino
const { data: tenant } = await supabase
  .from('tenants')
  .insert({
    full_name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '(11) 99999-9999'
  })
  .select()
  .single();

// 4. Criar um contrato
const { data: contract } = await supabase
  .from('contracts')
  .insert({
    unit_id: unit.id,
    tenant_id: tenant.id,
    start_date: '2026-01-01',
    monthly_rent: 1200,
    payment_day: 5,
    status: 'active'
  })
  .select()
  .single();

// 5. Criar cobranças
await supabase.from('charges').insert([
  {
    contract_id: contract.id,
    property_id: property.id,
    amount: 1200,
    due_date: '2026-03-05',
    status: 'pending'
  },
  {
    contract_id: contract.id,
    property_id: property.id,
    amount: 1200,
    due_date: '2026-02-05',
    status: 'paid',
    paid_date: '2026-02-05'
  }
]);

// 6. Criar despesas
await supabase.from('expenses').insert([
  {
    property_id: property.id,
    category: 'Manutenção',
    description: 'Conserto do portão eletrônico',
    amount: 450,
    expense_date: '2026-03-01',
    status: 'paid',
    payment_method: 'pix'
  },
  {
    property_id: property.id,
    category: 'Limpeza',
    description: 'Produtos de limpeza para áreas comuns',
    amount: 120,
    expense_date: '2026-03-15',
    status: 'pending'
  }
]);
```

---

## Diferenciais vs Versão Anterior

### Design

| Antes | Agora |
|-------|-------|
| Cards azuis chapados | Cards brancos com sombras sutis |
| Tipografia uniforme | Hierarquia clara (labels pequenas, valores grandes) |
| Sem estados de hover/press | Feedback visual em toda interação |
| Spinners genéricos | Skeleton screens |
| Mensagens em inglês técnico | UX writing BR ("Tá tudo pago!") |

### Interações

| Antes | Agora |
|-------|-------|
| Botões de ação visíveis sempre | Swipe to reveal (menos poluído) |
| Clique para tudo | Gestos + cliques (mobile-native) |
| Sem feedback tátil | Scale + transform em :active |
| Navegação por menu | Bottom nav fixo (alcance do polegar) |

### Performance

| Antes | Agora |
|-------|-------|
| CSS inline no HTML | CSS em arquivos separados + cache |
| Sem lazy loading | Loading progressivo |
| Queries sem otimização | Indexes + RLS eficiente |
| Bundle grande | Code splitting + tree shaking |

### Acessibilidade

| Antes | Agora |
|-------|-------|
| Touch targets variáveis | Mínimo 48x48px em tudo |
| Contraste inconsistente | WCAG AA em todos os pares |
| Sem focus visible | Outline em :focus-visible |
| Sem ARIA labels | ARIA em ícones funcionais |

---

## Customização

### Cores

Edite `src/styles/tokens.css`:

```css
:root {
  --primary-600: #2563EB; /* Azul padrão */
  /* Troque para sua cor */
  --primary-600: #7C3AED; /* Roxo */
  --primary-600: #059669; /* Verde */
}
```

### Espaçamentos

```css
:root {
  --space-4: 16px; /* Padrão */
  /* Aumente para mais "respiro" */
  --space-4: 20px;
}
```

### Tipografia

```css
:root {
  --text-4xl: 36px; /* Hero numbers */
  /* Aumente para impacto maior */
  --text-4xl: 42px;
}
```

---

## Próximos Passos (Backlog)

### Funcionalidades

- [ ] Criar/editar cobranças (modal)
- [ ] Criar/editar despesas (modal)
- [ ] Gerar cobranças automáticas mensais
- [ ] Relatórios (gráficos de receita/despesa)
- [ ] Notificações push (vencimentos)
- [ ] Exportar para PDF/Excel
- [ ] Multi-inquilino (adicionar sócios)

### UX

- [ ] Pull to refresh nas listas
- [ ] Animação de confetti ao marcar como pago
- [ ] Dark mode
- [ ] Filtros nas listas (por status, data, etc)
- [ ] Busca global

### Técnico

- [ ] PWA (instalar como app nativo)
- [ ] Offline first (cache com service worker)
- [ ] Testes automatizados (Vitest + Testing Library)
- [ ] CI/CD (GitHub Actions)

---

## Troubleshooting

### "Missing Supabase environment variables"

**Problema:** Variáveis não encontradas.

**Solução:**
```bash
# Verificar se .env existe
cat .env

# Deve conter:
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Dashboard mostra R$ 0,00 em tudo

**Problema:** Sem dados no banco.

**Solução:** Adicionar dados de teste (ver seção "Como Usar" > "Adicionar Dados de Teste").

### Swipe não funciona no desktop

**Comportamento esperado:** Swipe é mobile-only. No desktop, adicione botões visíveis ou use hover.

### Build falha com erro de TypeScript

**Solução:**
```bash
# Limpar cache
rm -rf node_modules/.vite
npm run build
```

---

## Contato e Suporte

**Documentação completa:** Ver `DESIGN_SYSTEM.md`

**Dúvidas sobre implementação:** Consulte os comentários no código ou crie uma issue.

**Performance:** Use o Lighthouse do Chrome DevTools para auditar.

---

## Changelog

### v2.0.0 (04/03/2026)

- Reescrita completa do frontend
- Novo design system inspirado em Tinder/Uber
- Banco de dados Supabase com RLS
- Componentes React + TypeScript
- Swipe gestures em cards
- Bottom navigation mobile-first
- UX writing em português brasileiro
- Skeleton loading states
- Empty states humanizados
- Build otimizado: 287kb JS (84kb gzip)
