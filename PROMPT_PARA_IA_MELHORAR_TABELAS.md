# PROMPT PARA IA - MELHORAR RESPONSIVIDADE DAS TABELAS DO SISTEMA DUKA

## 📋 CONTEXTO
Você receberá o CSS atual de tabelas de um sistema de gestão imobiliária. As tabelas funcionam bem no desktop, mas ficam **muito ruins no mobile**. Preciso que você crie um CSS responsivo profissional, moderno e funcional para mobile/tablet.

## 🎯 OBJETIVO
Transformar as tabelas em **cards responsivos no mobile** que sejam:
- Profissionais e bonitos
- Fáceis de ler e navegar
- Otimizados para touch
- Mantendo toda funcionalidade (botões, badges, links)

## 📱 BREAKPOINTS
- **Mobile**: max-width: 768px (transformar em cards)
- **Tablet**: 769px - 1024px (tabela compacta)
- **Desktop**: min-width: 1025px (tabela normal)

## 🏗️ ESTRUTURAS DE DADOS DO SISTEMA

### 1. **INQUILINOS** (5 colunas)
```
Nome | Documento | Email | Telefone | Ações
João Silva | 123.456.789-00 | joao@email.com | (11) 99999-9999 | [Editar]
```

### 2. **CONTRATOS** (6 colunas)
```
Empreendimento | Unidade | Status | Inquilino | Aluguel | Ações
Residencial Sol | Apt 101 | ativo | João Silva | R$ 1.200,00 | [Ver][Editar]
```

### 3. **DESPESAS** (6 colunas)
```
Propriedade | Descrição | Valor | Data | Status | Ações
Despesa geral | Água - Fevereiro | R$ 557,96 | 20/02/2026 | pending | [Baixar]
```

### 4. **SERVIÇOS** (5 colunas)
```
Ícone | Nome | Valor | Status | Ações
🏠 | Aluguel | R$ 1.200,00 | ativo | [Editar][Excluir]
```

### 5. **RISCO FINANCEIRO** (5 colunas) - Dashboard
```
Inquilino | Valor do contrato | Valor vencido | Dias em atraso | Impacto
João Silva | R$ 1.120,00 | R$ 100,00 | 18 | 15.36%
```

## 🎨 DESIGN SYSTEM DISPONÍVEL

### Variáveis CSS:
```css
:root {
    --primary: #1a73e8;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --white: #ffffff;
    --light-bg: #f8fafc;
    --text-primary: #2d3748;
    --text-secondary: #64748b;
    --border-color: #e2e8f0;
    --shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    --radius: 8px;
}
```

### Componentes:
```css
.badge-success { background: #dcfce7; color: #166534; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-overdue { background: #fee2e2; color: #991b1b; }

.btn-small { padding: 4px 8px; font-size: 12px; }
```

## ✅ REQUISITOS OBRIGATÓRIOS

### Mobile (≤768px):
1. **Cards independentes** para cada linha da tabela
2. **Layout vertical** com informações bem organizadas
3. **Headers fixos** dentro de cada card (ex: "Nome:", "Email:")
4. **Visual hierárquico** - dados mais importantes em destaque
5. **Botões touch-friendly** (min 44px)
6. **Badges preservados** com cores originais
7. **Valores monetários** bem formatados e destacados
8. **Separação visual** clara entre cards
9. **Scroll suave** sem quebrar layout
10. **Performance otimizada**

### Tablet (769-1024px):
1. **Tabela compacta** com colunas reduzidas
2. **Font-size menor** mas legível
3. **Padding otimizado**
4. **Possível scroll horizontal** se necessário

### Desktop (≥1025px):
1. **Manter CSS atual** da tabela normal
2. **Melhorar hover** e interactions

## 🚀 PADRÃO ESPERADO PARA MOBILE

### Exemplo de Card para Despesa:
```
┌─────────────────────────────┐
│ DESPESA GERAL              │
├─────────────────────────────┤
│ Água - Fevereiro           │
│                            │
│ 💰 R$ 557,96               │
│ 📅 20/02/2026              │
│ 🟡 pending                 │
│                            │
│      [Baixar] ──────────── │
└─────────────────────────────┘
```

### Exemplo de Card para Inquilino:
```
┌─────────────────────────────┐
│ JOÃO SILVA                 │
├─────────────────────────────┤
│ 📄 123.456.789-00          │
│ 📧 joao@email.com          │
│ 📱 (11) 99999-9999         │
│                            │
│         [Editar] ────────── │
└─────────────────────────────┘
```

## ⚠️ PROBLEMAS ATUAIS A RESOLVER
1. Tabelas muito "esticadas" verticalmente
2. Labels sobrepostos
3. Valores monetários malformados
4. Botões malposicionados
5. Badges distorcidos
6. Hierarquia visual confusa
7. Scroll horizontal indesejado
8. Touch targets pequenos
9. Padding inadequado
10. Performance ruim

## 📦 ENTREGÁVEL
- CSS completo e funcional
- Comentários explicando cada seção
- Media queries bem organizadas
- Código otimizado e limpo
- Compatível com todos os navegadores modernos

## 💡 DICAS DE IMPLEMENTAÇÃO
- Use `flexbox` e `grid` para layouts responsivos
- Implemente `aspect-ratio` para consistência visual
- Use `clamp()` para tipografia responsiva
- Considere `transform` para animações suaves
- Otimize para `will-change` em elementos animados
- Use `gap` ao invés de margins quando possível

Agora trabalhe sua mágica e crie um CSS responsivo profissional! 🎨✨