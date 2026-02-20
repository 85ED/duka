# Đuka

Sistema web para gestão de aluguel direto entre proprietário e inquilino, focado em pequenas quantidades de imóveis (kitnets, casas e salões) administrados sem imobiliária.

O objetivo do Đuka é substituir controles manuais em planilhas e anotações por uma plataforma centralizada que automatiza cobranças, juros, reajustes, despesas e divisão de lucros entre sócios.

---

## Problema que o sistema resolve

Pequenos proprietários geralmente controlam seus aluguéis manualmente:

* cobrança feita via WhatsApp
* controle em Excel ou bloco de notas
* cálculo manual de juros e atraso
* dificuldade em saber o lucro real
* contratos espalhados em pastas
* despesas misturadas com contas pessoais
* divisão entre sócios feita "no olho"

Isso gera perda de dinheiro, erros e falta de visão financeira.

O Đuka centraliza tudo em um único painel.

---

## Principais funcionalidades

### Gestão de imóveis

* Cadastro de casas, kitnets e salões
* Status do imóvel (ocupado, vago, manutenção)
* Histórico completo de moradores

### Gestão de inquilinos

* Cadastro completo
* Armazenamento de documentos
* Histórico de permanência

### Contratos

* Vinculação automática entre imóvel e inquilino
* Controle de vencimento
* Reajuste automático por período
* Histórico permanente

### Cobrança automática

* Geração mensal de cobranças
* Cálculo automático de multa e juros por atraso
* Atualização do valor em tempo real
* Controle de pagamento

### Financeiro

* Registro de despesas
* Parcelamentos
* Quem pagou a despesa (sócio)
* Serviços recorrentes (água, energia, internet, solar)

### Dashboard

* Receita do mês
* Despesas do mês
* Lucro real
* Quem não pagou
* Atrasos
* Lucro por imóvel
* Divisão automática entre sócios

---

## Tecnologias

Backend

* Node.js
* Express
* SQLite
* JWT Authentication
* Arquitetura MVC

Frontend

* HTML
* CSS
* JavaScript puro (sem frameworks)

O sistema foi projetado para ser leve, simples de hospedar e facilmente escalável para múltiplos clientes.

---

## Estrutura do projeto

```
backend/
  controllers/
  models/
  routes/
  middleware/
  database/

frontend/
  css/
  js/
  pages/

uploads/
database.sqlite
```

---

## Como rodar o projeto

### 1) Clonar o repositório

```
git clone https://github.com/seu-usuario/duka.git
cd duka
```

### 2) Instalar dependências do backend

```
cd backend
npm install
```

### 3) Iniciar servidor

```
node server.js
```

O sistema iniciará em:

```
http://localhost:3000
```

---

## Usuário inicial

Ao iniciar pela primeira vez, crie manualmente um usuário administrador via rota de cadastro ou seed do banco.

---

## Roadmap

* Multi-empresa (modo SaaS)
* Envio automático de cobrança por WhatsApp
* Integração com PIX
* Emissão de recibo
* Aplicativo mobile
* Backup automático na nuvem

---

## Público alvo

Proprietários que possuem de 1 a ~50 imóveis alugados diretamente e precisam de organização financeira sem usar imobiliária.

---

## Licença

Uso interno e experimental. Futuramente poderá ser distribuído como SaaS comercial.

---

## Autor

Edson Felix
