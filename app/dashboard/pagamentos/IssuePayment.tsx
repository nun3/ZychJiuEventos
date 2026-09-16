'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { issuePayment, type IssuePaymentState } from './actions'

const initialState: IssuePaymentState = { error: null, result: null }

function Submit() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} className="rounded-lg bg-primary-blue px-5 py-3 font-semibold text-white disabled:opacity-50">
    {pending ? 'Emitindo…' : 'Emitir cobrança'}
  </button>
}

export default function IssuePayment({ paymentId }: { paymentId: string }) {
  const [state, action] = useFormState(issuePayment, initialState)
  const issued = state.result?.kind === 'issued' ? state.result : null
  return <div className="mt-6 border-t border-slate-200 pt-6">
    {state.error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{state.error}</p>}
    {issued ? <div role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-900">
      <strong>Cobrança criada no Asaas Sandbox.</strong>
      {issued.pix && <><label htmlFor="pix-copy-paste" className="mt-2 block">PIX copia e cola:</label><textarea id="pix-copy-paste" readOnly value={issued.pix.copyPaste} className="mt-1 w-full rounded border bg-white p-2" rows={3} /></>}
      {issued.charge.boletoUrl && <p className="mt-2"><a className="underline" href={issued.charge.boletoUrl} target="_blank" rel="noreferrer">Abrir boleto</a></p>}
      {issued.instructionsPending && <p className="mt-2 text-sm">As instruções PIX ainda estão sendo consultadas. Atualize esta página depois.</p>}
    </div> : <form action={action}><input type="hidden" name="paymentId" value={paymentId} /><Submit /></form>}
  </div>
}
