// Envolve o conteúdo de uma rota interna. Usado em template.tsx, que remonta a cada navegação,
// reiniciando o fade curto. A navbar e o rodapé ficam fora (layout), portanto não piscam.
export default function PageEnter({ children }: { children: React.ReactNode }) {
  return <div className="mc-content-enter">{children}</div>
}
