import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deflateSync } from 'node:zlib'
import { pdfHasActiveContentDeep } from '../../lib/finance/pdf-active-content'
import {
  formatPixKey,
  isPixKeyType,
  isValidCnpj,
  isValidCpf,
  maskPixKey,
  normalizePixKey,
  normalizeRecipientName,
} from '../../lib/finance/pix-key'
import {
  PAYMENT_RECEIPT_MAX_BYTES,
  buildReceiptStoragePath,
  canSubmitReceipt,
  detectReceiptMimeType,
  normalizeRejectionReason,
  requiresDirectPixInstructions,
  resolvePayerPaymentStage,
  validateReceiptFile,
} from '../../lib/finance/payment-receipt'

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13])
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46])
const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF')

function file(bytes: Uint8Array, name: string, declaredType: string) {
  return { bytes, name, declaredType, size: bytes.length }
}

test('CPF e CNPJ exigem dígitos verificadores válidos', () => {
  assert.equal(isValidCpf('52998224725'), true)
  assert.equal(isValidCpf('52998224724'), false)
  assert.equal(isValidCpf('11111111111'), false)
  assert.equal(isValidCnpj('11222333000181'), true)
  assert.equal(isValidCnpj('11222333000182'), false)
  assert.equal(isValidCnpj('00000000000000'), false)
})

test('normalização de chave PIX produz o formato canônico aceito pelo banco', () => {
  assert.deepEqual(normalizePixKey('cpf', '529.982.247-25'), { ok: true, value: '52998224725' })
  assert.deepEqual(normalizePixKey('cnpj', '11.222.333/0001-81'), { ok: true, value: '11222333000181' })
  assert.deepEqual(normalizePixKey('email', '  Financeiro@MeuCamp.com.br '), {
    ok: true,
    value: 'financeiro@meucamp.com.br',
  })
  assert.deepEqual(normalizePixKey('telefone', '(41) 99999-0000'), { ok: true, value: '+5541999990000' })
  assert.deepEqual(normalizePixKey('telefone', '+55 41 99999-0000'), { ok: true, value: '+5541999990000' })
  assert.deepEqual(normalizePixKey('aleatoria', '123E4567-E89B-12D3-A456-426614174000'), {
    ok: true,
    value: '123e4567-e89b-12d3-a456-426614174000',
  })
})

test('chave PIX inválida é recusada sem ecoar o valor', () => {
  for (const [type, raw] of [
    ['cpf', '123'],
    ['email', 'sem-arroba'],
    ['email', '<script>@x.com'],
    ['telefone', '4133334444'],
    ['aleatoria', 'nao-e-uuid'],
    ['cpf', ''],
  ] as const) {
    const result = normalizePixKey(type, raw)
    assert.equal(result.ok, false)
    if (!result.ok && raw) assert.equal(result.message.includes(raw), false)
  }
  assert.equal(isPixKeyType('cpf'), true)
  assert.equal(isPixKeyType('boleto'), false)
})

test('favorecido rejeita caracteres de controle e tamanhos fora do limite', () => {
  assert.deepEqual(normalizeRecipientName('  Academia   Patojitsu  '), { ok: true, value: 'Academia Patojitsu' })
  assert.equal(normalizeRecipientName('AB').ok, false)
  assert.equal(normalizeRecipientName('Nome\u0000oculto').ok, false)
  assert.equal(normalizeRecipientName('x'.repeat(121)).ok, false)
})

test('formatação e máscara da chave', () => {
  assert.equal(formatPixKey('cpf', '52998224725'), '529.982.247-25')
  assert.equal(formatPixKey('telefone', '+5541999990000'), '+55 (41) 99999-0000')
  assert.equal(maskPixKey('52998224725'), '•••4725')
})

test('tipo do comprovante vem do conteúdo, não do nome', () => {
  assert.equal(detectReceiptMimeType(PNG), 'image/png')
  assert.equal(detectReceiptMimeType(JPEG), 'image/jpeg')
  assert.equal(detectReceiptMimeType(PDF), 'application/pdf')
  assert.equal(detectReceiptMimeType(new TextEncoder().encode('<html><script>')), null)
})

test('comprovantes válidos em JPG, PNG e PDF são aceitos', () => {
  assert.deepEqual(validateReceiptFile(file(PNG, 'comprovante.png', 'image/png')), {
    ok: true,
    mimeType: 'image/png',
    extension: 'png',
  })
  assert.deepEqual(validateReceiptFile(file(JPEG, 'foto.jpeg', 'image/jpeg')), {
    ok: true,
    mimeType: 'image/jpeg',
    extension: 'jpg',
  })
  assert.deepEqual(validateReceiptFile(file(PDF, 'pix.pdf', 'application/pdf')), {
    ok: true,
    mimeType: 'application/pdf',
    extension: 'pdf',
  })
  assert.equal(validateReceiptFile(file(PNG, 'sem-extensao', 'application/octet-stream')).ok, true)
})

test('arquivo disfarçado, vazio, grande ou com conteúdo ativo é recusado', () => {
  const html = new TextEncoder().encode('<svg onload=alert(1)>')
  assert.equal(validateReceiptFile(file(html, 'comprovante.png', 'image/png')).ok, false)
  assert.equal(validateReceiptFile(file(PNG, 'comprovante.pdf', 'image/png')).ok, false)
  assert.equal(validateReceiptFile(file(PNG, 'comprovante.png', 'application/pdf')).ok, false)
  assert.equal(validateReceiptFile(file(new Uint8Array(), 'vazio.png', 'image/png')).ok, false)
  assert.equal(
    validateReceiptFile({ ...file(PNG, 'a.png', 'image/png'), size: PAYMENT_RECEIPT_MAX_BYTES + 1 }).ok,
    false,
  )
  assert.equal(validateReceiptFile({ ...file(PNG, 'a.png', 'image/png'), size: PNG.length + 10 }).ok, false)
  const activePdf = new TextEncoder().encode('%PDF-1.7\n<< /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >>')
  assert.equal(validateReceiptFile(file(activePdf, 'pix.pdf', 'application/pdf')).ok, false)
  const svg = new TextEncoder().encode('<?xml version="1.0"?><svg/>')
  assert.equal(validateReceiptFile(file(svg, 'pix.svg', 'image/svg+xml')).ok, false)
})

function pdfWithStream(content: Buffer) {
  return new Uint8Array(Buffer.concat([
    Buffer.from('%PDF-1.7\n4 0 obj << /Filter /FlateDecode /Length ' + content.length + ' >>\nstream\n', 'latin1'),
    content,
    Buffer.from('\nendstream\nendobj\n%%EOF', 'latin1'),
  ]))
}

test('inspeção profunda encontra conteúdo ativo comprimido, ofuscado ou criptografado', () => {
  const benign = pdfWithStream(deflateSync(Buffer.from('BT /F1 12 Tf (PIX R$ 80,00) Tj ET /OpenAction [3 0 R /FitH null] /URI (https://banco.example)')))
  assert.equal(pdfHasActiveContentDeep(benign), false)
  assert.equal(pdfHasActiveContentDeep(PDF), false)
  const hiddenJs = pdfWithStream(deflateSync(Buffer.from('<< /Type /Action /S /JavaScript /JS (app.alert(1)) >>')))
  assert.equal(validateReceiptFile(file(hiddenJs, 'pix.pdf', 'application/pdf')).ok, true)
  assert.equal(pdfHasActiveContentDeep(hiddenJs), true)
  assert.equal(pdfHasActiveContentDeep(new TextEncoder().encode('%PDF-1.7\n<< /S /#4Aava#53cript >>')), true)
  assert.equal(pdfHasActiveContentDeep(new TextEncoder().encode('%PDF-1.7\ntrailer << /Encrypt 5 0 R >>')), true)
  const bomb = pdfWithStream(deflateSync(Buffer.alloc(17 * 1024 * 1024)))
  assert.equal(pdfHasActiveContentDeep(bomb), true)
})

test('caminho do comprovante é derivado de IDs, nunca do nome enviado', () => {
  assert.equal(
    buildReceiptStoragePath({
      organizationId: 'org',
      eventId: 'evt',
      paymentId: 'pay',
      receiptId: 'rcp',
      extension: 'pdf',
    }),
    'org/evt/pay/rcp.pdf',
  )
})

test('motivo de rejeição é obrigatório e limitado', () => {
  assert.equal(normalizeRejectionReason('ruim').ok, false)
  assert.equal(normalizeRejectionReason('x'.repeat(301)).ok, false)
  assert.deepEqual(normalizeRejectionReason('  Valor   diferente do total  '), {
    ok: true,
    value: 'Valor diferente do total',
  })
})

test('gate: evento pago no modelo PIX direto exige instruções; gratuito e modo Asaas não', () => {
  assert.equal(requiresDirectPixInstructions({ manualOnly: true, eventFee: 80 }), true)
  assert.equal(requiresDirectPixInstructions({ manualOnly: true, eventFee: '123.45' }), true)
  assert.equal(requiresDirectPixInstructions({ manualOnly: true, eventFee: 0 }), false)
  assert.equal(requiresDirectPixInstructions({ manualOnly: true, eventFee: null }), false)
  assert.equal(requiresDirectPixInstructions({ manualOnly: false, eventFee: 80 }), false)
})

test('etapas do pagador: aguardando, análise, rejeição com reenvio e aprovação', () => {
  assert.equal(resolvePayerPaymentStage('aguardando', null), 'aguardando_pagamento')
  assert.equal(resolvePayerPaymentStage('aguardando', 'em_analise'), 'em_analise')
  assert.equal(resolvePayerPaymentStage('aguardando', 'rejeitado'), 'rejeitado')
  assert.equal(resolvePayerPaymentStage('pago', 'aprovado'), 'aprovado')
  assert.equal(resolvePayerPaymentStage('cancelado', 'rejeitado'), 'encerrado')
  assert.equal(canSubmitReceipt('aguardando_pagamento'), true)
  assert.equal(canSubmitReceipt('rejeitado'), true)
  assert.equal(canSubmitReceipt('em_analise'), false)
  assert.equal(canSubmitReceipt('aprovado'), false)
})
