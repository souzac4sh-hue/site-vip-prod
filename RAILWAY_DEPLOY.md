# 🚀 GUIA DE DEPLOY NO RAILWAY — ARQUITETURA SIMPLIFICADA (FULLSTACK EXPRESS + REACT)

Este guia contém as instruções exatas para colocar seu site no ar no **Railway** em menos de 3 minutos, com backend Node.js/Express e frontend React servidos em uma única aplicação compacta e de alta conversão.

---

## 1. ⚙️ Comandos de Execução no Railway

No painel de configurações do serviço no Railway (**Settings -> Service**):

* **Build Command:**
  ```bash
  npm run build
  ```
* **Start Command:**
  ```bash
  npm start
  ```

---

## 2. 🗄️ Persistência de Dados (Railway Volume)

Para garantir que as configurações do painel admin, métricas e histórico de pagamentos nunca se percam entre reinicializações do servidor:

1. No Railway, clique no seu projeto e vá em **+ New -> Volume**.
2. Defina o **Mount Path** do volume como:
   ```text
   /data
   ```
3. O projeto já está programado para ler `process.env.DATA_DIR` e salvar automaticamente em `/data/store.json` com fallback tolerante.

---

## 3. 🔑 Variáveis de Ambiente (Environment Variables)

Configure na aba **Variables** do Railway:

| Variável | Valor Recomendado | Descrição |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Ativa modo produção, CSP restrito e bloqueio do simulador PIX |
| `DATA_DIR` | `/data` | Caminho do volume persistente no Railway |
| `ADMIN_PASSWORD` | *(Sua Senha Forte)* | Senha do painel `/admin` (Ex: `SuaSenhaSegura2026!`) |
| `ADMIN_SESSION_SECRET` | *(64 Caracteres Hex)* | Chave de assinatura dos cookies da sessão administrativa |
| `NEXUSPAG_API_KEY` | *(Sua Chave NexusPag)* | Chave de API para gerar cobranças PIX reais |
| `NEXUSPAG_WEBHOOK_SECRET` | *(Segredo Webhook)* | Segredo HMAC para validar aprovação instantânea |
| `TURNSTILE_SECRET_KEY` | *(Chave Secreta Cloudflare)* | *(Opcional)* Chave secreta do anti-bot Turnstile |
| `VITE_TURNSTILE_SITE_KEY` | *(Chave do Site Cloudflare)* | *(Opcional)* Chave pública do Turnstile para o frontend |
| `PUBLIC_SITE_URL` | `https://seudominio.com` | URL final do seu site após apontar domínio |

> **Nota sobre a Porta:** O Railway define a variável `PORT` automaticamente. O Express escuta `process.env.PORT` dinamicamente sem necessidade de configuração manual.

---

## 4. 🌐 Configuração do Domínio

1. Na aba **Settings -> Custom Domain** do Railway:
2. Adicione seu domínio (ex: `seusite.com` ou `vip.seusite.com`).
3. No seu registrador de domínio (Cloudflare, GoDaddy, Namecheap, Registro.br):
   * Adicione o registro **CNAME** apontando para o endereço fornecido pelo Railway.
   * Ative o SSL/HTTPS (automático pelo Railway ou Cloudflare Full SSL).

---

## 5. 💳 Configuração do Webhook na NexusPag

No painel da NexusPag, cadastre a URL de webhook:

* **URL do Webhook:**
  ```text
  https://seusite.com/api/webhooks/nexuspag
  ```
* **Método:** `POST`
* **Assinatura HMAC:** Copie a chave secreta gerada na NexusPag e insira na variável `NEXUSPAG_WEBHOOK_SECRET` no Railway.

---

## 6. 🛡️ Resumo da Arquitetura e Segurança Ativa

* **Estrutura Unificada:** Uma única instância Node.js atende API REST + SPA React compilada + Webhook + Admin.
* **Preço Server-Side:** Valor fixado em R$ 9,90 no backend, impossibilitando adulteração de preço no checkout.
* **Admin HttpOnly & Timing-Safe:** Autenticação protegida contra ataques de tempo (`timingSafeEqual`) e sessões com cookies seguros.
* **Métricas Comerciais Diretas:** Visitas, cliques no WhatsApp, cliques nas prévias, PIX gerados e receita exibidos no painel `/admin`.
