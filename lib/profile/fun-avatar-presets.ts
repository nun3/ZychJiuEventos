export const FUN_AVATAR_PRESETS = [
  {
    id: 'animal-elefante-01',
    label: 'Elefante',
    description: 'Forte e protetor',
    src: '/images/avatars/animal-elefante-01.png',
  },
  {
    id: 'animal-leao-01',
    label: 'Leão',
    description: 'Líder e confiante',
    src: '/images/avatars/animal-leao-01.png',
  },
  {
    id: 'animal-tigre-01',
    label: 'Tigre',
    description: 'Ágil e intenso',
    src: '/images/avatars/animal-tigre-01.png',
  },
  {
    id: 'animal-lobo-01',
    label: 'Lobo',
    description: 'Estratégico e disciplinado',
    src: '/images/avatars/animal-lobo-01.png',
  },
  {
    id: 'animal-aguia-01',
    label: 'Águia',
    description: 'Precisa e vigilante',
    src: '/images/avatars/animal-aguia-01.png',
  },
] as const

export type FunAvatarPreset = (typeof FUN_AVATAR_PRESETS)[number]

export function isFunAvatarPresetUrl(value: string) {
  return FUN_AVATAR_PRESETS.some((preset) => preset.src === value)
}
