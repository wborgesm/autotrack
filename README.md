# AutoTrack — Sistema SaaS para oficinas mecânicas

## 📌 O que é o AutoTrack
Sistema SaaS de gestão para oficinas mecânicas. Multi-tenant, cada empresa (oficina) tem os seus próprios dados isolados.

## 🛠 Stack principal
- **Next.js 14.2.35** (App Router, src/app/)
- **TypeScript** (strict)
- **Prisma 5** + **PostgreSQL**
- **NextAuth 4** (JWT, credenciais)
- **Tailwind CSS 3** + **Radix UI**
- **PM2** (cluster mode, 2 instâncias, zero downtime com `pm2 reload`)
- **Apache** (proxy reverso para HTTPS)
- **Ollama** (DeepSeek 1.5B instalado, mas chatbot atual usa sistema de regras + sinónimos, sem IA ativa no momento)
- **Gemini API** (fallback para chatbot, configurado mas não ativo por padrão)
- **whatsapp-web.js** (WhatsApp integrado)
- **Traccar SMS Gateway** (SMS via telemóvel Android)

## 🧩 Módulos implementados
- Dashboard (KPIs, gráficos Recharts)
- Ordens de Serviço (fluxo completo: ABERTA → ENTREGUE, notificações automáticas)
- Clientes (NIF, telefone, morada)
- Veículos (matrícula, marca, modelo)
- Stock (código automático, código de barras, margem europeia)
- Caixa (abertura/fecho, carrinho, método de pagamento, troco, itens livres)
- Financeiro (receita/despesa, integração automática com Caixa)
- Relatórios (resumo, ordens, financeiro, exportação CSV)
- Orçamentos (conversão para OS)
- Ponto Eletrónico (geolocalização, raio da oficina)
- Alugueres (cálculo automático de valor total)
- Encomendas (fornecedores, receção de material)
- Configurações (perfil, dados da oficina, redes sociais, localização)
- Auditoria (logs de alterações, restrita por nível)
- Alertas (anti-fraude: cancelamentos, descontos, OS sem pagamento)
- Empresas/Tenants (apenas SUPER_ADMIN)
- Notificações (SMS + WhatsApp, envio manual e automático)
- Chatbot integrado (balão flutuante, respostas rápidas, sistema de aulas, feedback)

## 🤖 Chatbot — estado atual
... (incluir o resto do README que me forneceste, até ao fim)

---

## 🤖 Chatbot — estado atual (28 Abril 2026)

- **Motor de regras** com 16 aulas interativas, 30+ sinónimos e matching flexível
- **Aulas passo a passo** com sugestão "próximo" (memória de contexto entre mensagens)
- **Saudação personalizada** com o nome do utilizador autenticado
- **Pesquisa web integrada** (DuckDuckGo, grátis) apenas para temas do AutoTrack
- **Sistema de feedback** 👍/👎 com registo na base de dados (ChatLog)
- **Painel de analytics** (`/chat-analytics`) com:
  - taxa de acerto das regras
  - lista de perguntas órfãs (sem resposta)
  - botão "Adicionar ao chatbot" para criar regras rapidamente
- **Cache de IA** (ChatCache) para evitar chamadas repetidas ao Gemini
- **Fallback IA** via Gemini (opcional, desligado por padrão)
- **Modo Beta** com badge no chat e recolha contínua de feedback

---

## 🔐 Permissões customizadas (Novo)

- Campo `permissoesExtras` no `Usuario` (Prisma)
- Administrador pode dar acesso a recursos adicionais por utilizador
- Hierarquia respeitada: nenhum nível pode criar utilizadores de nível superior ao seu
- SUPER_ADMIN pode editar qualquer utilizador sem restrições
- Interface de edição com checkboxes das permissões extra diretamente na página de Utilizadores

---

## 📦 Outras melhorias recentes

- Página `/encomendas` com listagem, filtros e integração com API
- Avatar dos utilizadores nos cartões da página `/usuarios`
- Referências a "Traccar" substituídas por "Autotrack" na interface do cliente
- Cache de respostas da IA para reduzir latência e custos
- Deploy com zero downtime mantido via PM2 (cluster mode)

---

## 🎨 Interface moderna (29 Abril 2026)

- **CSS variables do Radix UI** integradas com Tailwind — dark mode funcional em todos os componentes (dialogs, dropdowns, calendário)
- **Tokens de design** definidos em `tailwind.config.ts` (cores da marca, sombras suaves, border-radius 2xl/3xl)
- **Fundo com gradiente suave** e transições em todos os elementos interactivos
- **AppShell responsivo** com sidebar drawer em mobile e overlay
- **Header com toggle de tema** (🌙/☀️) e notificações
- **Tabelas com scroll horizontal** em ecrãs pequenos (utilitário `table-responsive`)
- **Efeito glass** disponível via classe utilitária (`glass`) para cards e diálogos

---

## 🛠️ Correções recentes (29 Abril 2026)

- **Chatbot** — matching corrigido para evitar confusão entre "ponto" e "caixa", remoção de artefactos markdown (`**`) da pergunta, saudação personalizada mantida
- **Super Admin** — texto substituído por "Autotrack" nas respostas visíveis ao cliente
- **Badge Beta** — aviso permanente no chat: "⚡ Chat em versão Beta — pode cometer erros."
- **Página de clientes** — correção de `map is not a function` (API híbrida array/objeto)
- **Permissões** — ajustes na página de utilizadores (função `revogarSessoes` unificada)

---

## 🎨 Interface — Modo Claro Padrão (29 Abril 2026)

- **Modo claro** é o padrão para todos os utilizadores.
- O **modo escuro** pode ser ativado manualmente no toggle (🌙/☀️) do header.
- Corrigidos bugs visuais que ocorriam com dark mode automático.

---

## 🛒 POS Completo (29 Abril 2026)

- **Abertura de caixa** com saldo inicial validado.
- **Itens livres** (serviços/mão‑de‑obra) com nome e valor manual.
- **Split payment** com múltiplos métodos (dinheiro, cartão, MB WAY, transferência, ref. MB).
- **Cálculo automático de troco** e validação de "falta pagar".
- **Pesquisa inteligente** de produtos do stock por nome ou código.
- **Atualização automática de stock** para itens do inventário.

## 🔐 Permissões refinadas

- SUPER_ADMIN pode escolher a empresa ao criar um utilizador.
- ADMIN cria utilizadores automaticamente vinculados ao seu tenant.
- Configurações da empresa visíveis para todos, mas editáveis apenas por GERENTE ou superior.
- SUPER_ADMIN pode apagar utilizadores, revogar sessões e assumir identidade (login como).

## 🎨 Interface

- **Modo claro** como padrão; dark mode disponível no toggle.
- **Efeito glass** nos cards e diálogos (backdrop‑filter).
- **Sidebar responsiva** com drawer em mobile.
- **Logo da oficina** personalizável via upload nas Configurações.
- **Dashboard** com KPIs de tendência, alerta de stock crítico, últimos OS e utilizadores online (SUPER_ADMIN).

## 🛠️ Infraestrutura

- Deploy com **zero downtime** usando script atómico e PM2.
- Cache de IA (ChatCache) para evitar chamadas repetidas ao Gemini.
- Pesquisa web integrada (DuckDuckGo) apenas para temas do AutoTrack.
- Build temporária movida para `/tmp` para evitar ficheiros grandes no Git.

---

## 🔄 Restauro (30 Abril 2026)

- Sistema restaurado a partir do backup local de 29 Abril 2026.
- Todas as funcionalidades estão operacionais.
- Schema do Prisma e páginas mantidos no estado funcional.

---

## 🔄 Restauro (30 Abril 2026)

- Sistema restaurado a partir do backup local de 29 Abril 2026.
- Todas as funcionalidades estão operacionais.
- Schema do Prisma e páginas mantidos no estado funcional.

---

## 🔄 Restauro (30 Abril 2026)

- Sistema restaurado a partir do backup local de 29 Abril 2026.
- Todas as funcionalidades estão operacionais.
- Schema do Prisma e páginas mantidos no estado funcional.
