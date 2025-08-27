# VIPI – Catálogo de Serviços & Controle de Estoque (HTML + TypeScript + Supabase)

Projeto acadêmico da disciplina **Laboratório de Programação para Internet**.  
O objetivo é desenvolver um sistema web com dois módulos principais:

- **Catálogo de Serviços**: registro e exibição de serviços (com fotos, especificações técnicas, tempo de execução, custo etc.), com **controle de visibilidade** (público/privado).
- **Controle de Estoque**: cadastro de ferramentas, **estoque mínimo** e **alertas visuais** para reposição.

Perfis de acesso:
- **Administrador**: acesso completo (catálogo + estoque, incluindo dados sensíveis como tempo e custo).
- **Visitante (cliente)**: acesso apenas ao **catálogo público**, **sem** preços/tempos/dados sensíveis.

> Stack: **HTML + CSS + TypeScript puro** no front-end e **Supabase** (Auth + DB + Storage) no back-end.

---

## Funcionalidades (Roadmap por blocos)

- **Bloco 1 – Preparação do Ambiente**  
  Estrutura base, TypeScript, Live Server, páginas iniciais.
- **Bloco 2 – Autenticação (Supabase)**  
  Projeto no Supabase, regras, login/logout, proteção do painel Admin.
- **Bloco 3 – Serviços (Catálogo Privado)**  
  CRUD completo + upload de imagens no Supabase Storage.
- **Bloco 4 – Catálogo Público (Visitante)**  
  Lista de serviços públicos (sem dados sensíveis) + alternar visibilidade.
- **Bloco 5 – Estoque de Ferramentas**  
  CRUD + estoque mínimo + alerta visual de reposição.
- **Bloco 6 – Relatórios**  
  Relatório de estoque e financeiro básico.

---

## Estrutura do Projeto

vipi-catalogo-estoque/
├─ public/
│ ├─ index.html # Catálogo público (Visitante)
│ ├─ admin.html # Painel do Administrador
│ ├─ login.html # Tela de login
│ ├─ js/ # (gerado) saída compilada do TypeScript
│ └─ assets/ # Imagens (logos, fotos de serviços etc.)
├─ src/
│ ├─ main.ts # Entry genérico/utilidades
│ ├─ pages/
│ │ ├─ public-catalog.ts # Lógica do catálogo público
│ │ ├─ admin-dashboard.ts # Lógica do painel admin
│ │ └─ login.ts # Lógica de autenticação (Bloco 2)
│ ├─ modules/
│ │ ├─ ui.ts # Funções utilitárias de UI
│ │ ├─ types.ts # Tipos/Interfaces compartilhadas
│ │ └─ validators.ts # Validações de formulário
│ └─ supabase/
│ └─ client.ts # Inicialização do Supabase (Bloco 2)
├─ styles/
│ └─ style.css # Estilos básicos (sem framework)
├─ package.json
├─ tsconfig.json
└─ README.md

---

## Pré-requisitos

- **Node.js** LTS (inclui `npm`)  
- **VS Code** com as extensões:
  - **Live Server** (Ritwick Dey)
  - (Opcional) **ESLint** e **Prettier**

Verifique:
```bash
node -v
npm -v
