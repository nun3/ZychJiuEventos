export const COACHMARKS = {
  checagem: 'Depois de travar a checagem, alterações deixam de ser permitidas.',
  chaves: 'A geração cria uma sugestão em rascunho. Publique só quando o casamento estiver certo.',
  programacao: 'Áreas e números só congelam depois que você publicar a programação.',
  resultados: 'A pesagem é por subchave. O resultado continua vindo das lutas já operadas.',
  financeiro: 'A baixa é manual e auditada. Este fechamento não emite cobrança.',
} as const

export type CoachmarkId = keyof typeof COACHMARKS
