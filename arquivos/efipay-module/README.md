# 💸 EfiPay Payment Module

> Módulo de integração com a API Pix da **Efí Bank** — criação de cobranças, envio de PIX, consulta de saldo e geração de QR Codes, com foco em robustez e idempotência.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Funcionalidades](#funcionalidades)
  - [Consultar Saldo](#consultar-saldo)
  - [Criar Cobrança PIX](#criar-cobrança-pix)
  - [Enviar PIX](#enviar-pix)
  - [Verificar Cobrança](#verificar-cobrança)
  - [Verificar PIX Enviado](#verificar-pix-enviado)
  - [Limpar QR Codes](#limpar-qr-codes)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Scopes Necessários](#scopes-necessários)
- [Tratamento de Erros](#tratamento-de-erros)
- [Direitos Autorais](#direitos-autorais)

---

## Visão Geral

Este módulo encapsula a comunicação com a **API Pix da Efí Bank** através do SDK oficial [`sdk-node-apis-efi`](https://github.com/efipay/sdk-node-apis-efi). Ele oferece uma interface limpa e documentada para as operações mais comuns do ecossistema PIX em ambiente de produção.

**Funcionalidades principais:**

- ✅ Consulta de saldo da conta Efí
- ✅ Criação de cobranças PIX imediatas com QR Code
- ✅ Envio de PIX para chave de destino (com idempotência)
- ✅ Consulta de status de cobranças e envios
- ✅ Geração e limpeza automática de arquivos QR Code (`.png`)

---

## Pré-requisitos

- **Node.js** v16 ou superior
- **Conta Efí Bank** com API habilitada (preferencialmente Efí Empresas para envio de PIX)
- **Certificado `.p12`** gerado no painel da Efí (ambiente de produção)
- **Chave PIX** cadastrada na sua conta

---

## Instalação

```bash
npm install sdk-node-apis-efi qrcode
```

---

## Configuração

### 1. Certificado

Coloque o arquivo `.p12` de produção em:

```
configs/producao_efy.p12
```

### 2. Credenciais

Crie o arquivo `configs/config_Efipay.json`:

```json
{
  "client_id_efi": "SEU_CLIENT_ID",
  "client_secret_efi": "SEU_CLIENT_SECRET"
}
```

> ⚠️ **Nunca** versione este arquivo. Adicione-o ao `.gitignore`.

### 3. Scopes da Aplicação

No painel da Efí Bank, em **API → Aplicações**, ative os seguintes scopes:

| Scope | Finalidade |
|---|---|
| `pix.write` | Criar cobranças |
| `pix.read` | Consultar cobranças |
| `cob.write` | Gerenciar cobranças |
| `cob.read` | Leitura de cobranças |
| `pix.send` | Enviar PIX |
| `gn.balance.read` | Consultar saldo da conta |

---

## Funcionalidades

### Consultar Saldo

```js
const { EfiPayPayment } = require('./efiPayment')

const pagamento = new EfiPayPayment('sua_chave_pix')

// Saldo simples
const resultado = await pagamento.getBalance()
console.log(resultado.saldo) // "1250.00"

// Com valores bloqueados (MED / judicial)
const completo = await pagamento.getBalance(true)
console.log(completo)
// {
//   saldo: "1250.00",
//   bloqueios: { judicial: "0.00", med: "0.00", total: "0.00" }
// }
```

> Endpoint: `GET /v2/gn/saldo/` — scope `gn.balance.read`

---

### Criar Cobrança PIX

```js
const cobranca = await pagamento.createPixPayment(
    150.00,                           // valor
    'Pedido #1042',                   // descrição ao pagador
    [{ nome: 'Produto', valor: 'X' }], // infoAdicionais (opcional)
    { nome: 'João Silva', cpf: '000.000.000-00' } // devedor (opcional)
)

console.log(cobranca.txid)            // ID único da cobrança
console.log(cobranca.pix_copia_e_cola) // Código para o pagador colar
console.log(cobranca.file_path)       // Caminho do QR Code .png gerado
```

O QR Code é salvo automaticamente em `qrcodes/<txid>.png`.

> Endpoint: `POST /v2/cob` — expira em **900 segundos** (15 min)

---

### Enviar PIX

```js
const envio = await pagamento.sendPix(
    '50.00',             // valor
    'destino@email.com', // chave PIX do favorecido
    'minha_chave_pix',   // chave PIX do pagador
    'Pagamento referente ao pedido 99' // descrição (opcional)
)

console.log(envio.idEnvio) // guarde este ID para reenvio seguro
console.log(envio.status)  // "EM_PROCESSAMENTO"
```

**Reenvio idempotente** (em caso de timeout ou erro 5xx):

```js
// Use o MESMO idEnvio — a Efí garante que não haverá débito duplo
const reenvio = await pagamento.sendPix('50.00', 'destino@email.com', 'minha_chave', '', envio.idEnvio)
```

> ⚠️ A confirmação final do envio chega via **webhook**. Aguarde antes de reenviar com novo `idEnvio`.

> Endpoint: `PUT /v3/gn/pix/:idEnvio` — scope `pix.send`

---

### Verificar Cobrança

```js
const status = await pagamento.checkPayment('txid_da_cobranca')

console.log(status.status) // 'approved' | 'pending' | 'error'
console.log(status.raw)    // valor bruto: 'CONCLUIDA' | 'ATIVA'
```

| Valor da API | Status retornado |
|---|---|
| `CONCLUIDA` | `approved` |
| `ATIVA` | `pending` |
| Outros | valor bruto da API |

> Endpoint: `GET /v2/cob/:txid`

---

### Verificar PIX Enviado

Útil para checar se um envio anterior foi processado **antes** de gerar um novo `idEnvio`:

```js
const detalhe = await pagamento.checkSentPix(envio.idEnvio)
console.log(detalhe?.status) // ex: "REALIZADO" | "EM_PROCESSAMENTO"
```

> Endpoint: `GET /v2/gn/pix/enviados/id-envio/:idEnvio`

---

### Limpar QR Codes

Remove todos os arquivos `.png` da pasta `qrcodes/`:

```js
const { limparQRCodes } = require('./efiPayment')

limparQRCodes()
```

---

## Estrutura de Arquivos

```
projeto/
├── configs/
│   ├── producao_efy.p12        ← certificado Efí (não versionar)
│   └── config_Efipay.json      ← credenciais (não versionar)
├── qrcodes/                    ← QR Codes gerados (.png)
├── arquivos/
│   └── funcoes/
│       └── logger.js           ← funções de log (infoLog, successLog, errorLog)
└── efiPayment.js               ← este módulo
```

---

## Scopes Necessários

| Método | Scope |
|---|---|
| `getBalance()` | `gn.balance.read` |
| `createPixPayment()` | `cob.write`, `pix.write` |
| `sendPix()` | `pix.send` |
| `checkPayment()` | `cob.read`, `pix.read` |
| `checkSentPix()` | `pix.read` |

---

## Tratamento de Erros

Todos os métodos retornam `null` (ou `{ status: 'error', message, idEnvio }` no `sendPix`) em caso de falha, sem lançar exceções para o chamador. Os erros são logados via `errorLog`.

```js
const saldo = await pagamento.getBalance()

if (!saldo) {
    console.error('Não foi possível obter o saldo.')
    return
}
```

---

## Direitos Autorais

```
Copyright © 2026 Scraper. Todos os direitos reservados.

Este software e seu código-fonte são propriedade exclusiva de Eduardo.
É proibida a reprodução, distribuição, modificação ou uso comercial
deste código, no todo ou em parte, sem autorização prévia e por escrito
do autor Eduardo.

Este módulo utiliza a API oficial da Efí Bank.
Eu deixo todos os direitos a ela menos o do Scraper que eu fiz.
Efí Bank e EfiPay são marcas registradas de seus respectivos proprietários.
```

---

<div align="center">
  <sub>Desenvolvido por  Eduardo Dev | </> 🩵<strong>Scraper</strong> · Todos os direitos reservados © 2026</sub>
</div>
