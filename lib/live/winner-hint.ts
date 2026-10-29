export type ScoreboardSides = {
  scoreA: number
  scoreB: number
  advantagesA: number
  advantagesB: number
  penaltiesA: number
  penaltiesB: number
}

/** Sugestão visual apenas. Finish exige winner_side explícito no domínio. */
export function projectScoreWinnerHint(board: ScoreboardSides): 'a' | 'b' | 'tie' {
  if (board.scoreA !== board.scoreB) return board.scoreA > board.scoreB ? 'a' : 'b'
  if (board.advantagesA !== board.advantagesB) return board.advantagesA > board.advantagesB ? 'a' : 'b'
  if (board.penaltiesA !== board.penaltiesB) return board.penaltiesA < board.penaltiesB ? 'a' : 'b'
  return 'tie'
}
