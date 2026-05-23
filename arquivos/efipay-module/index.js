const fs   = require('fs')
const path = require('path')
const EfiPay  = require('sdk-node-apis-efi')
const QRCode  = require('qrcode')

const { infoLog, successLog, errorLog } = require('../../arquivos/funcoes/logger.js')
const { client_id_efi, client_secret_efi } = require('../../configs/config_Efipay.json')

const CERTIFICATE_PATH = path.join('configs', 'producao_efy.p12')
const QRCODES_DIR      = path.join(__dirname, '../../qrcodes')
const PIX_EXPIRACAO    = 900

const EFI_OPTIONS = {
    sandbox:       false,
    client_id:     client_id_efi,
    client_secret: client_secret_efi,
    certificate:   CERTIFICATE_PATH,
    cert_base64:   false,
    scopes: [
        'pix.write',
        'pix.read',
        'cob.write',
        'cob.read',
        'pix.send',
        'gn.balance.read', // ← necessário para consultar saldo
    ],
}

const STATUS_MAP = {
    CONCLUIDA: 'approved',
    ATIVA:     'pending',
}

function limparQRCodes() {
    if (!fs.existsSync(QRCODES_DIR)) {
        infoLog('Pasta de QR Codes não encontrada — nada a limpar.')
        return
    }

    const pngFiles = fs.readdirSync(QRCODES_DIR).filter(f => f.endsWith('.png'))

    if (pngFiles.length === 0) {
        infoLog('Nenhum QR Code para limpar.')
        return
    }

    for (const file of pngFiles) {
        fs.unlinkSync(path.join(QRCODES_DIR, file))
        successLog(`QR Code removido: ${file}`)
    }

    successLog(`${pngFiles.length} QR Code(s) removido(s) com sucesso.`)
}

async function salvarQRCode(txid, pixCopiaECola) {
    if (!fs.existsSync(QRCODES_DIR)) {
        fs.mkdirSync(QRCODES_DIR, { recursive: true })
    }

    const filePath = path.join(QRCODES_DIR, `${txid}.png`)

    await QRCode.toFile(filePath, pixCopiaECola, {
        color: { dark: '#000000', light: '#FFFFFF' },
        width: 300,
    })

    successLog(`QR Code salvo em: ${filePath}`)
    return filePath
}

class EfiPayPayment {
    constructor(pixKey) {
        if (!fs.existsSync(CERTIFICATE_PATH)) {
            limparQRCodes()
            throw new Error(`Certificado não encontrado: ${CERTIFICATE_PATH}`)
        }

        this.pixKey = pixKey
        this.efi    = new EfiPay(EFI_OPTIONS)

        successLog('SDK EfiPay inicializado com sucesso.')
    }

    // ─────────────────────────────────────────────────────────────
    // SALDO
    // ─────────────────────────────────────────────────────────────

    /**
     * Consulta o saldo disponível na conta Efí (GET /v2/gn/saldo/).
     * Requer o scope `gn.balance.read` ativado na aplicação.
     *
     * @param {boolean} [exibirBloqueios=false] - Se true, retorna também
     *   valores bloqueados por MED ou ação judicial.
     * @returns {Promise<{ saldo: string, bloqueios?: object }|null>}
     *
     * @example
     * const resultado = await pagamento.getBalance()
     * // { saldo: "1250.00" }
     *
     * const resultado = await pagamento.getBalance(true)
     * // { saldo: "1250.00", bloqueios: { judicial: "0.00", med: "0.00", total: "0.00" } }
     */
    async getBalance(exibirBloqueios = false) {
        infoLog('Consultando saldo da conta Efí...')

        try {
            // O SDK mapeia GET /v2/gn/saldo/ para pixGetAccountBalance
            const params = exibirBloqueios ? { bloqueios: true } : {}
            const response = await this.efi.pixGetAccountBalance(params)

            const saldoFormatado = parseFloat(response.saldo).toLocaleString('pt-BR', {
                style:    'currency',
                currency: 'BRL',
            })

            successLog(`Saldo disponível: ${saldoFormatado}`)
            return response // { saldo: "100.00" } ou { saldo: "100.00", bloqueios: {...} }
        } catch (error) {
            errorLog('Falha ao consultar saldo:', error)
            return null
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CRIAR COBRANÇA PIX
    // ─────────────────────────────────────────────────────────────

    /**
     * Cria uma cobrança PIX imediata (POST /v2/cob) e gera o QR Code.
     *
     * @param {number|string} value                     - Valor da cobrança (ex: "123.45")
     * @param {string}        [descricao]               - Texto exibido ao pagador em solicitacaoPagador
     * @param {Array}         [itens]                   - infoAdicionais: array de { nome, valor }
     * @param {{ cpf?: string, cnpj?: string, nome: string }} [devedor] - Dados do devedor (opcional)
     * @returns {Promise<object|null>}
     */
    async createPixPayment(value, descricao = 'Pagamento PIX', itens = [], devedor = null) {
        infoLog('Criando cobrança PIX imediata...')

        const chargeBody = {
            calendario:         { expiracao: PIX_EXPIRACAO },
            ...(devedor && { devedor }),
            valor:              { original: parseFloat(value).toFixed(2) },
            chave:              this.pixKey,
            solicitacaoPagador: descricao,
            ...(itens.length > 0 && { infoAdicionais: itens }),
        }

        try {
            const charge = await this.efi.pixCreateImmediateCharge({}, chargeBody)

            if (!charge?.txid) {
                throw new Error('Resposta da API não contém txid.')
            }

            successLog('Cobrança PIX criada.', { txid: charge.txid })

            await this.efi.pixGenerateQRCode({ id: charge.loc.id })
            successLog('QR Code gerado pela API.')

            const filePath = await salvarQRCode(charge.txid, charge.pixCopiaECola)

            return {
                txid:             charge.txid,
                id:               charge.txid,
                status:           charge.status,
                calendario:       charge.calendario,
                loc:              charge.loc,
                qr_code:          charge.pixCopiaECola,
                pix_copia_e_cola: charge.pixCopiaECola,
                valor:            charge.valor.original,
                file_path:        filePath,
            }
        } catch (error) {
            errorLog('Falha ao criar cobrança PIX:', error)
            return null
        }
    }

    // ─────────────────────────────────────────────────────────────
    // ENVIAR PIX
    // ─────────────────────────────────────────────────────────────

    /**
     * Envia um PIX para uma chave de destino (PUT /v3/gn/pix/:idEnvio).
     *
     * ⚠️  Requisitos obrigatórios:
     *   - Scope `pix.send` ativo na aplicação.
     *   - A chave pagadora (payerKey) precisa ter um webhook associado.
     *   - Conta Efí Empresas para alterar os limites de envio.
     *
     * ℹ️  Idempotência: em caso de falha de comunicação (timeout / 5xx),
     *    reenvie com o MESMO idEnvio. Se a transação já foi processada,
     *    o valor não será debitado novamente. Só gere um novo idEnvio
     *    após confirmar via webhook ou GET /v2/gn/pix/enviados/id-envio/:idEnvio
     *    que a transação anterior NÃO foi concluída.
     *
     * @param {number|string} value         - Valor a enviar (ex: "12.34")
     * @param {string}        targetKey     - Chave PIX do favorecido
     * @param {string}        payerKey      - Chave PIX do pagador (obrigatória na v3)
     * @param {string}        [infoPagador] - Descrição/observação da transferência
     * @param {string}        [idEnvio]     - ID idempotente (gerado automaticamente se omitido)
     * @returns {Promise<{
     *   idEnvio: string,
     *   e2eId: string,
     *   valor: string,
     *   horario: object,
     *   status: string
     * }|null>}
     *
     * @example
     * const resultado = await pagamento.sendPix('50.00', 'chave@destino.com', 'minha_chave_pix')
     */
    async sendPix(value, targetKey, payerKey, infoPagador = '', idEnvio = null) {
        infoLog('Iniciando envio de PIX...')

        // Gera idEnvio único se não foi fornecido
        const envioId = idEnvio ?? Date.now().toString()

        const body = {
            valor:   parseFloat(value).toFixed(2),
            pagador: {
                chave: payerKey,
                ...(infoPagador && { infoPagador }),
            },
            favorecido: {
                chave: targetKey,
            },
        }

        try {
            const response = await this.efi.pixSend({ idEnvio: envioId }, body)

            successLog('PIX enviado — aguardando confirmação via webhook.', {
                idEnvio: envioId,
                status:  response?.status,
            })

            return {
                ...response,
                idEnvio: envioId, // expõe o id para reenvio em caso de falha
            }
        } catch (error) {
            errorLog('Falha ao enviar PIX:', error)

            // Retorna o idEnvio mesmo em erro, para que o chamador possa reenviar
            return { status: 'error', message: error.message, idEnvio: envioId }
        }
    }

    /**
     * Consulta o status de um PIX enviado pelo idEnvio
     * (GET /v2/gn/pix/enviados/id-envio/:idEnvio).
     * Útil para verificar se um envio anterior foi processado antes de reenviar.
     *
     * @param {string} idEnvio
     * @returns {Promise<object|null>}
     */
    async checkSentPix(idEnvio) {
        infoLog(`Verificando PIX enviado — idEnvio: ${idEnvio}`)

        try {
            const response = await this.efi.pixSendDetail({ idEnvio })
            successLog(`Status do PIX enviado: ${response?.status}`)
            return response
        } catch (error) {
            errorLog('Falha ao consultar PIX enviado:', error)
            return null
        }
    }

    // ─────────────────────────────────────────────────────────────
    // VERIFICAR COBRANÇA
    // ─────────────────────────────────────────────────────────────

    /**
     * Consulta o status de uma cobrança PIX pelo txid (GET /v2/cob/:txid).
     * Retorna status normalizado: 'approved' (CONCLUIDA), 'pending' (ATIVA) ou o valor bruto da API.
     *
     * @param {string} txid
     * @returns {Promise<{ status: string, raw: string }|{ status: 'error', message: string }>}
     */
    async checkPayment(txid) {
        infoLog(`Verificando pagamento PIX — TXID: ${txid}`)

        try {
            const response = await this.efi.pixDetailCharge({ txid })
            const status   = STATUS_MAP[response.status] ?? response.status

            successLog(`Status do pagamento: ${status}`)
            return { status, raw: response.status }
        } catch (error) {
            errorLog('Falha ao verificar pagamento PIX:', error)
            return { status: 'error', message: error.message }
        }
    }
}

module.exports = { EfiPayPayment, limparQRCodes }
