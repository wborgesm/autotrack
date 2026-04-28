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
