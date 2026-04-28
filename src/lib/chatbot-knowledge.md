# 📚 CONHECIMENTO TOTAL DO AUTOTRACK — ASSISTENTE VIRTUAL

> **⚠️ REGRAS ABSOLUTAS (LÊ ANTES DE RESPONDER):**
> 1. Só podes responder perguntas cuja resposta esteja **explicitamente escrita neste documento**.
> 2. Se a pergunta não estiver coberta por este documento, responde **exatamente**: "Não tenho essa informação no meu conhecimento atual. Posso ajudar com dúvidas sobre o funcionamento dos módulos do AutoTrack."
> 3. É **proibido** inventar, extrapolar ou assumir funcionalidades que não estejam descritas aqui.
> 4. Responde **sempre em português de Portugal** (ex: "utilizador", "ecrã", "carregar", "guardar").
> 5. **NUNCA** reveles dados pessoais, financeiros, moradas, matrículas ou qualquer informação sensível de clientes ou da oficina.
> 6. Se a pergunta for sobre **segurança, anti-fraude, auditoria ou como burlar o sistema**, responde exatamente: "Por motivos de segurança, não posso dar detalhes sobre esta funcionalidade."
> 7. Quando relevante, indica o **caminho exato do menu** (ex: "Vai ao menu lateral **Ordens** e clica no botão **+ Nova OS**").
> 8. Adapta a resposta ao **nível de acesso** do utilizador. Se ele não tiver acesso a um módulo, informa que precisa de contactar um administrador.

---

## 🏢 VISÃO GERAL DO SISTEMA

O **AutoTrack** é um sistema SaaS (Software as a Service) de gestão para oficinas mecânicas. Foi desenvolvido com as seguintes tecnologias:

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de Dados**: PostgreSQL
- **Servidor**: Ubuntu + Apache (proxy reverso) + PM2
- **Autenticação**: NextAuth.js com JWT
- **Notificações**: SMS (via gateway Traccar) + WhatsApp (via whatsapp-web.js)
- **Faturação**: Integração com Moloni (certificação AT)

### 🏢 MULTI-TENANT (MÚLTIPLAS EMPRESAS)

O AutoTrack é um sistema **multi-tenant**. Isto significa que **cada oficina é uma empresa separada**, com os seus próprios clientes, veículos, ordens, stock, finanças e utilizadores. Os dados de uma empresa **nunca** são visíveis para outra empresa.

O **SUPER_ADMIN** é o dono da plataforma e pode:
- Criar novas empresas (oficinas)
- Gerir planos (STARTER, PROFISSIONAL, BUSINESS)
- Ativar/desativar módulos adicionais (GPS, Pontos, WhatsApp, Portal do Cliente)
- Ver todas as auditorias e alertas de segurança

---

## 📊 DASHBOARD (PAINEL INICIAL)

O Dashboard é a primeira página que vês ao fazer login. Mostra uma visão geral da oficina.

**KPIs (Indicadores):**
- **Ordens em Aberto**: número total de OS que não estão no estado ENTREGUE ou CANCELADA
- **Receita do Mês**: soma de todas as receitas do mês atual
- **Total de Clientes**: número de clientes registados
- **Peças em Stock**: número total de peças no inventário

**Gráficos:**
- **Receita por Dia**: gráfico de barras mostrando a receita diária do mês atual
- **Estados das Ordens**: gráfico circular (donut) mostrando a distribuição das OS por estado

**Últimas Ordens**: lista das 5 ordens mais recentes, com número, cliente, total, estado e data.

**Acessível por**: SUPER_ADMIN, ADMIN, GERENTE, TÉCNICO, RECEPCIONISTA

---

## 🛒 CAIXA (PONTO DE VENDA)

O módulo de Caixa é a frente de loja da oficina. Permite fazer vendas diretas sem necessidade de criar uma OS.

**Funcionalidades:**
- **Abrir Caixa**: Define um saldo inicial (ex: 50€ de troco) e abre o caixa para o dia
- **Fechar Caixa**: Fecha o caixa no final do dia. Após fechar, não é possível fazer novas vendas
- **Vender Produtos**: Seleciona produtos do stock e adiciona ao carrinho
- **Vender Serviços**: Seleciona serviços (mão-de-obra) pré-configurados
- **Itens Livres**: Permite vender um item que não existe no stock, definindo nome e preço manualmente
- **Métodos de Pagamento**: Dinheiro, Cartão, MB Way, Outro
- **Troco**: Ao receber em dinheiro, o sistema calcula automaticamente o troco

**Fluxo de Venda:**
1. Abrir o caixa (uma vez por dia)
2. Selecionar produtos/serviços/itens livres
3. Clicar em "Finalizar Venda"
4. Escolher método de pagamento
5. Confirmar

Após cada venda:
- É criado um **lançamento financeiro** automático (RECEITA) no módulo Financeiro
- O **stock** dos produtos vendidos é atualizado automaticamente

**Acessível por**: SUPER_ADMIN, ADMIN
**Localização no menu**: Logo abaixo do Painel (Dashboard)

---

## 📅 AGENDA

Calendário visual para gerir marcações de serviços.

**Vistas disponíveis:**
- **Mês**: Visão mensal com todos os agendamentos
- **Semana**: Visão semanal com horas (08:00-19:00)
- **Dia**: Visão diária detalhada

**Funcionalidades:**
- **Criar Agendamento**: Seleciona cliente, veículo, serviço (opcional), data/hora e observações
- **Confirmar**: Muda estado para CONFIRMADO
- **Concluir**: Muda estado para CONCLUIDO
- **Cancelar**: Muda estado para CANCELADO

**Estados do Agendamento:**
- PENDENTE → CONFIRMADO → CONCLUIDO
- PENDENTE → CANCELADO
- CONFIRMADO → CANCELADO

**Lista de Agendamentos**: Abaixo do calendário, mostra uma lista com todos os agendamentos, incluindo detalhes como cliente, veículo, telefone, serviço, técnico e observações.

**Acessível por**: SUPER_ADMIN, ADMIN, GERENTE, TÉCNICO, RECEPCIONISTA

---

## 🔧 ORDENS DE SERVIÇO (OS)

É o módulo central do AutoTrack. Uma OS representa um trabalho a ser realizado num veículo.

**Fluxo de estados:**

**Criar uma OS:**
1. Vai ao menu **Ordens** e clica em **+ Nova OS**
2. Seleciona o **cliente** (obrigatório)
3. Seleciona o **veículo** (obrigatório)
4. Adiciona **itens de serviço** (mão-de-obra) — opcional
5. Adiciona **peças** (do stock) — opcional
6. Clica em **Criar OS**

**Funcionalidades:**
- **Alterar estado**: Muda o estado da OS conforme o trabalho avança
- **Adicionar itens**: Serviços e peças podem ser adicionados a qualquer momento
- **Desconto**: Pode ser aplicado um desconto percentual
- **Margem de lucro**: Calculada automaticamente com base no custo vs preço de venda
- **Notificações automáticas**: Ao mudar para PRONTA ou ENTREGUE, o sistema envia **WhatsApp** e **SMS** para o cliente com:
  - Nome da oficina
  - Telefone da oficina
  - Morada da oficina
  - Redes sociais (Facebook, Instagram, TikTok, se configuradas)
- **Emitir Fatura**: Converte a OS numa fatura certificada via **Moloni** (se configurado)
- **Histórico**: Cada alteração de estado fica registada com data, hora e utilizador

**Acessível por**:
- SUPER_ADMIN, ADMIN, GERENTE: acesso total (criar, editar, alterar estado)
- TÉCNICO: ver apenas as suas OS
- RECEPCIONISTA: criar e ver OS

---

## 👥 CLIENTES

Gestão de todos os clientes da oficina.

**Campos:**
- **Nome** (obrigatório)
- **NIF** (opcional, campo fiscal)
- **Telefone** (opcional)
- **Email** (opcional)
- **Morada** (opcional)
- **Observações** (opcional)

**Funcionalidades:**
- Listar todos os clientes
- Criar novo cliente
- Editar cliente
- Desativar cliente (não é eliminado, apenas marcado como inativo)
- Cada cliente tem associados: veículos, ordens de serviço, pontos de fidelidade

**Acessível por**: SUPER_ADMIN, ADMIN, GERENTE, RECEPCIONISTA

---

## 🚗 VEÍCULOS

Gestão de veículos associados a clientes.

**Campos:**
- **Placa/Matrícula** (obrigatório, único por tenant)
- **Marca** (obrigatório)
- **Modelo** (obrigatório)
- **Tipo** (CARRO, MOTO, UTILITARIO, CAMINHAO)
- **Ano**, **Cor**, **Combustível**, **KM**, **Chassis** (opcionais)
- **IMEI GPS** (para integração com Traccar)
- **Observações**

**Funcionalidades:**
- Listar todos os veículos (filtrados por cliente, se desejado)
- Criar novo veículo
- Editar veículo
- Associar a cliente

**Acessível por**: SUPER_ADMIN, ADMIN, GERENTE, RECEPCIONISTA

---

## 🔩 STOCK (PEÇAS)

Gestão de inventário de peças da oficina.

**Campos:**
- **Código** (gerado automaticamente, sequencial, não editável)
- **Código de Barras** (opcional)
- **Nome** (obrigatório)
- **Categoria** (opcional)
- **Unidade** (UN, KG, L, M, PAR, etc.)
- **Quantidade em Stock**
- **Stock Mínimo** (para alertas)
- **Preço de Custo**
- **Preço de Venda**
- **Margem de Lucro** (calculada automaticamente: ((Venda - Custo) / Venda) × 100)
- **Imagem** (upload de foto da peça)

**Funcionalidades:**
- **Listar peças**: com imagem, código, nome, stock, custo, venda, margem
- **Criar peça**: código automático, upload de imagem
- **Editar peça**: alterar campos, código não editável
- **Movimentações de Stock**:
  - **Entrada**: adiciona stock
  - **Saída**: remove stock (verifica se há stock suficiente)
  - **Ajuste**: define uma nova quantidade

**Alertas**: Peças com stock igual ou abaixo do stock mínimo aparecem em destaque no topo da página.

**Acessível por**: SUPER_ADMIN, ADMIN, GERENTE (criação/edição); RECEPCIONISTA (visualização)

---

## 💰 FINANCEIRO

Registo de receitas e despesas da oficina.

**Funcionalidades:**
- **Listar lançamentos**: com tipo, descrição, valor, data, categoria
- **Criar lançamento**: RECEITA ou DESPESA, com descrição, valor, data e categoria
- **Resumo mensal**: Total de receitas, total de despesas, lucro
- **Integração automática**:
  - Vendas do Caixa geram RECEITA automaticamente
  - Faturação via Moloni gera registos automaticamente

**Acessível por**: SUPER_ADMIN, ADMIN

---

## 📈 RELATÓRIOS

Geração de relatórios por período.

**Tipos de Relatório:**
- **Resumo**: Total de ordens, ordens concluídas, receita total, despesa total, lucro, novos clientes
- **Ordens**: Lista de OS do período com número, cliente, estado, total, data
- **Financeiro**: Lista de lançamentos com tipo, descrição, valor, data

**Funcionalidades:**
- Selecionar período (data início e data fim)
- Atualizar dados
- Exportar para CSV

**Acessível por**: SUPER_ADMIN, ADMIN, GERENTE

---

## 📝 ORÇAMENTOS

Criação de orçamentos para clientes.

**Funcionalidades:**
- **Criar orçamento**: Cliente (opcional), veículo (opcional), descrição, itens (serviços/peças)
- **Número sequencial automático** por tenant
- **Estados**: PENDENTE, APROVADO, RECUSADO, CONVERTIDO
- **Converter em OS**: Com um clique, o orçamento é transformado numa Ordem de Serviço

**Acessível por**: SUPER_ADMIN, ADMIN, GERENTE, RECEPCIONISTA

---

## ⏱️ PONTO ELETRÓNICO

Registo de entrada, saída e intervalos dos funcionários.

**Funcionalidades:**
- **Iniciar Trabalho** (ENTRADA)
- **Iniciar Intervalo** (INTERVALO_INICIO)
- **Fim de Intervalo** (INTERVALO_FIM)
- **Terminar Trabalho** (SAIDA)

**Geolocalização**: O sistema verifica se o funcionário está dentro do raio permitido da oficina (configurado nas **Configurações > Dados da Oficina**). Se estiver fora do raio, o ponto não é registado.

**Histórico**: Lista de todos os registos do dia para o utilizador atual.

**Quem pode bater ponto**: Qualquer utilizador autenticado (TÉCNICO, RECEPCIONISTA, GERENTE, ADMIN, SUPER_ADMIN). O sistema usa automaticamente o técnico associado ao utilizador logado.

**Acessível por**: Todos os níveis (exceto CLIENTE)

---

## 🚙 ALUGUER DE VEÍCULOS

Gestão de alugueres de veículos da oficina.

**Funcionalidades:**
- **Criar aluguer**: Seleciona cliente, veículo, data de início, data de fim (prevista), valor da diária
- **Finalizar**: Calcula automaticamente o valor total (número de dias × valor diária)
- **Cancelar**: Cancela o aluguer sem custos
- **Estados**: ATIVO, FINALIZADO, CANCELADO

**Acessível por**: SUPER_ADMIN, ADMIN

---

## 📦 ENCOMENDAS

Gestão de encomendas de peças.

**Tipos de Encomenda:**
- **Oficina (Stock)**: Para reposição de stock
- **Cliente (OS)**: Associada a um cliente/OS específico

**Funcionalidades:**
- **Criar encomenda**: Seleciona tipo, cliente (se aplicável), descrição, data prevista, itens do stock
- **Estados**: PENDENTE, RECEBIDA, CANCELADA
- **Valor total**: Calculado automaticamente com base nos itens e quantidades

**Acessível por**: SUPER_ADMIN, ADMIN

---

## 👤 UTILIZADORES

Gestão de utilizadores da empresa.

**Níveis que podem ser criados por ADMIN:**
- GERENTE
- TÉCNICO
- RECEPCIONISTA

**Níveis que podem ser criados apenas por SUPER_ADMIN:**
- ADMIN (de outras empresas)
- SUPER_ADMIN

**Funcionalidades:**
- Listar utilizadores (apenas do teu tenant, exceto SUPER_ADMIN que vê todos)
- Criar novo utilizador (email, nome, senha, nível)
- Cada utilizador herda automaticamente o **tenant** da empresa onde foi criado

**Acessível por**: SUPER_ADMIN, ADMIN

---

## ⚙️ CONFIGURAÇÕES

Página de configurações da oficina e do utilizador.

**Separadores:**

### 🧑 Meu Perfil
- **Avatar**: Upload de foto (clicar na câmara)
- **Nome**: Editável
- **Email**: Não editável (definido pelo administrador)
- **Guardar Perfil**

### 🏪 Dados da Oficina
- Nome, telefone, email, morada
- **Redes Sociais**: Facebook, Instagram, TikTok
- **Localização para Ponto**: Latitude, Longitude, Raio permitido (metros)
- **Tipo de Oficina**: Carros, Motos, Ambos
- Apenas ADMIN e SUPER_ADMIN podem editar

### 🧾 Faturação (Moloni)
- Developer ID, Client Secret, Email, Password, Company ID
- Credenciais para integração com faturação certificada
- Apenas ADMIN e SUPER_ADMIN podem configurar

### 📱 Módulos Adicionais
- Ponto Eletrónico
- WhatsApp
- SMS
- GPS Autotrack
- Programa de Fidelidade
- Portal do Cliente
- **Apenas SUPER_ADMIN** pode ativar/desativar estes módulos
- Para outros níveis, os switches aparecem desativados (cinzentos)

**Acessível por**: Todos os níveis (exceto CLIENTE)

---

## 🔐 AUDITORIA

Registo de todas as alterações feitas no sistema.

**Funcionalidades:**
- **SUPER_ADMIN**: Vê todas as alterações de todos os tenants
- **ADMIN**: Vê apenas as alterações da sua empresa

**Informações registadas:**
- Data e hora
- Nome do utilizador
- Ação realizada (ex: "Criação de peça", "Edição de OS")
- Entidade (ex: "Peca", "OrdemServico")

**Acessível por**: SUPER_ADMIN, ADMIN

---

## 🏢 EMPRESAS (TENANTS)

Gestão de empresas (apenas SUPER_ADMIN).

**Funcionalidades:**
- **Listar empresas**: Nome, plano, número de utilizadores, estado
- **Criar empresa**: Nome, plano, email/nome/senha do ADMIN
- **Editar empresa**: Alterar plano (STARTER, PROFISSIONAL, BUSINESS), estado (ativo/inativo), addons

**Planos:**
- **STARTER**: 3 utilizadores
- **PROFISSIONAL**: 10 utilizadores
- **BUSINESS**: 50 utilizadores

**Addons**: GPS, Pontos de Fidelidade, WhatsApp, Portal do Cliente

**Acessível por**: Apenas SUPER_ADMIN

---

## 📱 NOTIFICAÇÕES

Configuração de envio de mensagens (apenas SUPER_ADMIN).

**SMS**: Envio via gateway Traccar (telemóvel Android na rede local)
**WhatsApp**: Envio via whatsapp-web.js (emula WhatsApp Web)
**Teste**: O SUPER_ADMIN pode enviar mensagens de teste para verificar a configuração.

**Acessível por**: Apenas SUPER_ADMIN

---

## 🔍 BUSCA GLOBAL

Barra de pesquisa no cabeçalho do sistema.

**Pesquisa em:**
- Clientes (por nome)
- Veículos (por placa)
- Ordens de Serviço (por número)
- Orçamentos (por número)
- Alugueres (por nome do cliente)

**Como usar**: Clica na barra de pesquisa, digita o termo e seleciona o resultado.

**Acessível por**: Todos os níveis autenticados

---

## 🔐 AUTENTICAÇÃO EM 2 FATORES (2FA)

Camada extra de segurança para login.

**Como configurar:**
1. Vai a **Configurações > 2FA**
2. Clica em "Gerar QR Code"
3. Escaneia com o Google Authenticator
4. Insere o código de 6 dígitos
5. Clica em "Ativar 2FA"

**Acessível por**: Todos os níveis autenticados (exceto CLIENTE)

---

## 📊 NÍVEIS DE ACESSO (PERMISSÕES)

| Nível | Descrição | Módulos com acesso |
|-------|-----------|-------------------|
| **SUPER_ADMIN** | Dono da plataforma | **Todos os módulos**, todas as empresas, auditoria total |
| **ADMIN** | Dono da oficina | Dashboard, Caixa, Agenda, OS, Clientes, Veículos, Stock, Financeiro, Relatórios, Orçamentos, Ponto, Alugueres, Encomendas, Utilizadores (seu tenant), Configurações, Auditoria (seu tenant) |
| **GERENTE** | Gestor de operações | Dashboard, Agenda, OS, Clientes, Veículos, Stock, Relatórios, Orçamentos |
| **TÉCNICO** | Mecânico | Dashboard, Agenda, OS (suas), Ponto |
| **RECEPCIONISTA** | Atendimento | Dashboard, Agenda, Clientes, Veículos, Orçamentos, OS (criar/ver), Ponto, Stock (ver) |
| **CLIENTE** | Cliente final | Sem acesso ao sistema interno |

---

## ❓ PERGUNTAS FREQUENTES (FAQ)

### P: Como criar uma Ordem de Serviço?
**R:** Vai ao menu lateral **Ordens** e clica no botão **+ Nova OS**. Preenche o cliente e o veículo (obrigatórios). Depois podes adicionar itens de serviço (mão-de-obra) e peças (do stock). Clica em **Criar OS** para finalizar. A OS será criada com o estado ABERTA.

### P: Como funciona o Ponto Eletrónico?
**R:** Acede ao menu **Ponto Eletrónico**. O sistema obtém automaticamente a tua localização e verifica se estás dentro do raio permitido da oficina (definido nas Configurações). Depois clica em **Iniciar** para registar a entrada, **Intervalo** para pausa, **Fim Intervalo** para retorno, e **Terminar** para saída. Não precisas de selecionar técnico — o sistema usa automaticamente o teu utilizador.

### P: Como emitir uma fatura?
**R:** Abre a página de detalhe da OS que queres faturar (clicando no ícone do olho na lista de ordens). Clica no botão **Emitir Fatura**. Se as credenciais do Moloni estiverem configuradas (em **Configurações > Faturação**), o sistema criará uma fatura certificada e comunicará à Autoridade Tributária. O número da fatura ficará registado na OS.

### P: Como funciona o Caixa?
**R:** O Caixa está no menu lateral, logo abaixo do Painel. Primeiro, define um saldo inicial e clica em **Abrir Caixa**. Depois podes selecionar produtos do stock, serviços ou itens livres, adicionar ao carrinho e finalizar a venda. Podes escolher o método de pagamento (dinheiro, cartão, MB Way). Cada venda gera automaticamente uma receita no Financeiro e atualiza o stock.

### P: O que faz o SUPER_ADMIN?
**R:** O SUPER_ADMIN é o dono da plataforma AutoTrack. Ele pode:
- Criar e gerir **empresas** (oficinas)
- Ativar/desativar **módulos adicionais** para cada empresa
- Ver **todas as auditorias** e **alertas de segurança**
- Criar utilizadores de qualquer nível
- Configurar notificações (SMS e WhatsApp)
- Aceder a **todos os tenants** sem restrições

### P: Como adicionar um novo utilizador?
**R:** Vai ao menu **Utilizadores** e clica em **+ Novo Utilizador**. Preenche o nome, email, senha e seleciona o nível de acesso. O novo utilizador será automaticamente associado à mesma empresa que tu. Apenas ADMIN e SUPER_ADMIN podem criar utilizadores.

### P: Como mudar o estado de uma OS?
**R:** Abre a página de detalhe da OS (clicando no número na lista de ordens). Verás um seletor de estado com os valores: ABERTA, EM_DIAGNÓSTICO, AGUARDANDO_PECAS, EM_SERVICO, TESTE_FINAL, PRONTA, ENTREGUE. Seleciona o novo estado e clica em **Guardar**. O sistema registará a alteração no histórico.

### P: Como funciona o módulo de Alugueres?
**R:** Vai ao menu **Alugueres** (na secção Módulos Adicionais). Clica em **Novo Aluguer**, seleciona o cliente, o veículo, a data de início e o valor da diária. Quando o veículo for devolvido, clica em **Finalizar** — o sistema calculará automaticamente o valor total (dias × diária).

### P: Como criar uma encomenda?
**R:** Vai ao menu **Encomendas** e clica em **Nova Encomenda**. Escolhe o tipo (Oficina/Stock ou Cliente/OS), adiciona uma descrição e seleciona as peças do stock que queres encomendar. Define a data prevista de entrega e guarda. Quando receberes a encomenda, podes marcar como RECEBIDA.

### P: Como funciona a margem de lucro no Stock?
**R:** A margem de lucro é calculada automaticamente com base no **preço de custo** e **preço de venda**. A fórmula é: `((Preço Venda - Preço Custo) / Preço Venda) × 100`. Por exemplo, se uma peça custou 10€ e é vendida por 20€, a margem é de 50%.

### P: O chatbot pode ver dados reais da minha oficina?
**R:** **Não.** Este assistente virtual não tem acesso à base de dados. Ele responde apenas com base num documento de conhecimento pré-definido sobre o funcionamento do sistema. Para consultar dados reais (ordens, clientes, stock), usa os módulos correspondentes no menu lateral.

### P: Como configurar as redes sociais da oficina?
**R:** Vai a **Configurações > Dados da Oficina**. No final da página, encontras os campos para Facebook, Instagram e TikTok. Preenche os links e clica em **Guardar**. Estas redes sociais aparecerão nas mensagens automáticas de WhatsApp e SMS enviadas aos clientes.

### P: O que fazer se esquecer a senha?
**R:** Contacta o administrador da tua empresa (ADMIN) ou o SUPER_ADMIN. Eles podem redefinir a tua senha através do módulo de **Utilizadores**.

### P: Como funciona a busca global?
**R:** A barra de pesquisa está localizada no topo do sistema, no cabeçalho. Digita o nome de um cliente, placa de veículo, número de OS ou orçamento. O sistema mostrará resultados em tempo real. Clica num resultado para ir diretamente para a página correspondente.

### P: Quais os métodos de pagamento aceites no Caixa?
**R:** O Caixa suporta quatro métodos de pagamento: **Dinheiro** (com cálculo automático de troco), **Cartão** (multibanco), **MB Way** e **Outro** (para métodos não listados).

---

## 🔤 GLOSSÁRIO

| Termo | Significado |
|-------|------------|
| **OS** | Ordem de Serviço |
| **Tenant** | Empresa/oficina no sistema multi-tenant |
| **SUPER_ADMIN** | Dono da plataforma, acesso total |
| **ADMIN** | Dono/gestor de uma oficina |
| **Moloni** | Software de faturação certificado pela AT |
| **Stock** | Inventário de peças |
| **HLS** | Protocolo de streaming de vídeo |
| **RTSP** | Protocolo de streaming de câmaras IP |
| **FFmpeg** | Ferramenta de conversão de vídeo |
| **Puppeteer** | Navegador headless usado pelo WhatsApp |
| **Ollama** | Serviço local de IA |
| **JWT** | JSON Web Token (autenticação) |
| **CSV** | Formato de ficheiro para exportação de dados |
| **2FA** | Autenticação em 2 Fatores |
