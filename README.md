# 🔒 PRIVATE LIVE • Plataforma Privada de Streaming & Paywall com NexusPag (PIX)

Plataforma premium, moderna e pronta para produção destinada à venda de acesso individual a transmissões privadas e canais VIP de criadoras/modelos.

---

## 💎 Estrutura dos Produtos

1. **Produto A (`/`)**: Acesso individual à **Sala de Transmissão Privada** (ex: R$ 19,90) com player HLS 1080p, preview bloqueado, card de conversão e garantia de reembolso.
2. **Produto B (`/whatsapp`)**: Acesso VIP ao **WhatsApp da Criadora** por valor simbólico (ex: R$ 4,90), revertido integralmente em desconto no pack ou chamada privada, revelando o link seguro somente após a confirmação.

---

## 🛡️ Anti-Bot & Proteção de Entrada

* **Token de Sessão Inicial**: Emitido via cookie seguro `HttpOnly` no primeiro acesso.
* **Honeypot Invisível**: Campos ocultos para descarte silencioso de bots automatizados.
* **Rate Limiting**: Limite de requisições por IP e por sessão nos endpoints de checkout.
* **User-Agent Filtering**: Bloqueio de scrapers e ferramentas automáticas maliciosas sem interferir no SEO.
* **Ética Total**: Zero cloakers e zero mensagens fakes simulando espectadores.

---

## 📊 Analytics & Funil de Conversão Real

Métricas em tempo real coletadas no banco e exibidas na aba **Métricas & Funil** do `/admin`:
* **Visitantes Online Agora** (tempo real)
* **Visitas Hoje & Últimos 7 dias**
* **Taxa de Conversão Real (%)**
* **Funil Visual**: `Página Acessada` ➔ `Clique no CTA` ➔ `Checkout Iniciado` ➔ `Pagamento Aprovado` ➔ `Entrada na Live/WhatsApp`
* **Origem do Tráfego**: `instagram.com`, `tiktok.com`, `direto`, etc.
* **Divisão de Dispositivos**: Mobile vs Desktop

---

## ✏️ Textos Editáveis no Painel Admin (`/admin`)

Todos os textos da landing page podem ser editados sem mexer no código:
* Headlines, Subheadlines e Microcopy
* Textos do Card de Oferta
* Garantia de Reembolso
* Preços do Produto A e Produto B
* Status da Live e URL de Streaming

---

## 🚀 Como Executar

```bash
cd private-live-platform
npm install
npm run dev
```

* **Landing Produto A (Sala Privada)**: [http://localhost:3001](http://localhost:3001)
* **Landing Produto B (WhatsApp VIP)**: [http://localhost:3001/whatsapp](http://localhost:3001/whatsapp)
* **Sala Protegida**: [http://localhost:3001/live](http://localhost:3001/live)
* **Painel Administrativo**: [http://localhost:3001/admin](http://localhost:3001/admin) (Senha: `admin123456`)
