'use client'

import { useState } from 'react'
import { FiDownload, FiChevronDown, FiChevronUp, FiSearch, FiCheckCircle } from 'react-icons/fi'

// Interface para linha da tabela
interface WeightTableRow {
  ageGroup: string
  ageRange: string
  category: string
  minWeight: string
  maxWeight: string
  gender: 'M/F' | 'M' | 'F'
}

// Tabela de peso GI (com kimono) - Baseada na tabela oficial
const weightTableGI: WeightTableRow[] = [
  // Pré-Mirim (4-5 anos)
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Galo', minWeight: 'Até', maxWeight: '14,7 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Pluma', minWeight: '14,8', maxWeight: '17,9 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Pena', minWeight: '18,0', maxWeight: '20,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Leve', minWeight: '20,1', maxWeight: '24,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Médio', minWeight: '24,1', maxWeight: '26,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Meio-Pesado', minWeight: '26,1', maxWeight: '29,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Pesado', minWeight: '29,1', maxWeight: '32,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Super-Pesado', minWeight: '32,1', maxWeight: '35,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '4-5 anos', category: 'Pesadissimo', minWeight: '35,1', maxWeight: 'Acima', gender: 'M/F' },
  
  // Mirim A (6-7 anos)
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Galo', minWeight: 'Até', maxWeight: '21,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Pluma', minWeight: '21,1', maxWeight: '24,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Pena', minWeight: '24,1', maxWeight: '27,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Leve', minWeight: '27,1', maxWeight: '30,2 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Médio', minWeight: '30,3', maxWeight: '33,2 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Meio-Pesado', minWeight: '33,3', maxWeight: '36,2 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Pesado', minWeight: '36,3', maxWeight: '39,3 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Super-Pesado', minWeight: '39,4', maxWeight: '42,3 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM A', ageRange: '6-7 anos', category: 'Pesadissimo', minWeight: '42,4', maxWeight: 'Acima', gender: 'M/F' },
  
  // Mirim B (8-9 anos)
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Galo', minWeight: 'Até', maxWeight: '24,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Pluma', minWeight: '24,1', maxWeight: '27,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Pena', minWeight: '27,1', maxWeight: '30,2 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Leve', minWeight: '30,3', maxWeight: '33,2 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Médio', minWeight: '33,3', maxWeight: '36,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Meio-Pesado', minWeight: '36,1', maxWeight: '39,2 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Pesado', minWeight: '39,3', maxWeight: '42,3 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Super-Pesado', minWeight: '42,4', maxWeight: '45,3 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM B', ageRange: '8-9 anos', category: 'Pesadissimo', minWeight: '45,4', maxWeight: 'Acima', gender: 'M/F' },
  
  // Infantil A (10-11 anos)
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Galo', minWeight: 'Até', maxWeight: '30,2 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Pluma', minWeight: '30,3', maxWeight: '33,2 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Pena', minWeight: '33,3', maxWeight: '36,2 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Leve', minWeight: '36,3', maxWeight: '39,3 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Médio', minWeight: '39,4', maxWeight: '42,3 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Meio-Pesado', minWeight: '42,4', maxWeight: '45,3 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Pesado', minWeight: '45,4', maxWeight: '48,3 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Super-Pesado', minWeight: '48,4', maxWeight: '51,5 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL A', ageRange: '10-11 anos', category: 'Pesadissimo', minWeight: '51,6', maxWeight: 'Acima', gender: 'M/F' },
  
  // Infantil B (12-13 anos)
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Galo', minWeight: 'Até', maxWeight: '36,2 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Pluma', minWeight: '36,3', maxWeight: '40,3 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Pena', minWeight: '40,4', maxWeight: '44,4 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Leve', minWeight: '44,5', maxWeight: '48,3 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Médio', minWeight: '48,4', maxWeight: '52,8 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Meio-Pesado', minWeight: '52,9', maxWeight: '56,5 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Pesado', minWeight: '56,6', maxWeight: '60,5 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Super-Pesado', minWeight: '60,6', maxWeight: '65,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL B', ageRange: '12-13 anos', category: 'Pesadissimo', minWeight: '65,1', maxWeight: 'Acima', gender: 'M/F' },
  
  // Infanto-Juvenil Masculino (14-15 anos)
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Galo', minWeight: 'Até', maxWeight: '44,3 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pluma', minWeight: '44,4', maxWeight: '48,3 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pena', minWeight: '48,4', maxWeight: '52,5 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Leve', minWeight: '52,6', maxWeight: '56,5 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Médio', minWeight: '56,6', maxWeight: '60,5 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Meio-Pesado', minWeight: '60,6', maxWeight: '65,0 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pesado', minWeight: '65,1', maxWeight: '69,0 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Super-Pesado', minWeight: '69,1', maxWeight: '73,0 kg', gender: 'M' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pesadissimo', minWeight: '73,1', maxWeight: 'Acima', gender: 'M' },
  
  // Infanto-Juvenil Feminino (14-15 anos)
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Galo', minWeight: 'Até', maxWeight: '40,3 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pluma', minWeight: '40,4', maxWeight: '44,3 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pena', minWeight: '44,4', maxWeight: '48,3 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Leve', minWeight: '48,4', maxWeight: '52,5 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Médio', minWeight: '52,6', maxWeight: '56,3 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Meio-Pesado', minWeight: '56,4', maxWeight: '60,5 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pesado', minWeight: '60,6', maxWeight: '65,0 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Super-Pesado', minWeight: '65,1', maxWeight: '69,0 kg', gender: 'F' },
  { ageGroup: 'INFANTO-JUVENIL', ageRange: '14-15 anos', category: 'Pesadissimo', minWeight: '69,1', maxWeight: 'Acima', gender: 'F' },
  
  // Juvenil Masculino (16-17 anos)
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Galo', minWeight: 'Até', maxWeight: '53,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pluma', minWeight: '53,6', maxWeight: '58,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pena', minWeight: '58,6', maxWeight: '64,0 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Leve', minWeight: '64,1', maxWeight: '69,0 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Médio', minWeight: '69,1', maxWeight: '74,0 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Meio-Pesado', minWeight: '74,1', maxWeight: '79,3 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesado', minWeight: '79,4', maxWeight: '84,3 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Super-Pesado', minWeight: '84,4', maxWeight: '89,3 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesadissimo', minWeight: '89,4', maxWeight: 'Acima', gender: 'M' },
  
  // Juvenil Feminino (16-17 anos)
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Galo', minWeight: 'Até', maxWeight: '44,3 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pluma', minWeight: '44,4', maxWeight: '48,3 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pena', minWeight: '48,4', maxWeight: '52,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Leve', minWeight: '52,6', maxWeight: '56,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Médio', minWeight: '56,6', maxWeight: '60,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Meio-Pesado', minWeight: '60,6', maxWeight: '65,0 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesado', minWeight: '65,1', maxWeight: '69,0 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Super-Pesado', minWeight: '69,1', maxWeight: '73,0 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesadissimo', minWeight: '73,1', maxWeight: 'Acima', gender: 'F' },
  
  // Adulto e Master Masculino
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Galo', minWeight: 'Até', maxWeight: '57,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pluma', minWeight: '57,6', maxWeight: '64,0 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pena', minWeight: '64,1', maxWeight: '70,0 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Leve', minWeight: '70,1', maxWeight: '76,0 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Médio', minWeight: '76,1', maxWeight: '82,3 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Meio-Pesado', minWeight: '82,4', maxWeight: '88,3 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesado', minWeight: '88,4', maxWeight: '94,3 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Super-Pesado', minWeight: '94,4', maxWeight: '100,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesadissimo', minWeight: '100,6', maxWeight: 'Acima', gender: 'M' },
  
  // Adulto e Master Feminino
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Galo', minWeight: 'Até', maxWeight: '48,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pluma', minWeight: '48,6', maxWeight: '53,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pena', minWeight: '53,6', maxWeight: '58,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Leve', minWeight: '58,6', maxWeight: '64,0 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Médio', minWeight: '64,1', maxWeight: '69,0 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Meio-Pesado', minWeight: '69,1', maxWeight: '74,0 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesado', minWeight: '74,1', maxWeight: '79,3 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Super-Pesado', minWeight: '79,4', maxWeight: '84,3 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesadissimo', minWeight: '84,4', maxWeight: 'Acima', gender: 'F' },
]

// Tabela de peso NO-GI (sem kimono) - Baseada na tabela oficial
const weightTableNOGI: WeightTableRow[] = [
  // Juvenil Masculino (16-17 anos)
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Galo', minWeight: 'Até', maxWeight: '51,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pluma', minWeight: '51,6', maxWeight: '56,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pena', minWeight: '56,6', maxWeight: '61,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Leve', minWeight: '61,6', maxWeight: '66,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Médio', minWeight: '66,6', maxWeight: '71,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Meio-Pesado', minWeight: '71,6', maxWeight: '76,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesado', minWeight: '76,6', maxWeight: '81,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Super-Pesado', minWeight: '81,6', maxWeight: '86,5 kg', gender: 'M' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesadissimo', minWeight: '86,6', maxWeight: 'Acima', gender: 'M' },
  
  // Juvenil Feminino (16-17 anos)
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Galo', minWeight: 'Até', maxWeight: '42,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pluma', minWeight: '42,6', maxWeight: '46,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pena', minWeight: '46,6', maxWeight: '50,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Leve', minWeight: '50,6', maxWeight: '54,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Médio', minWeight: '54,6', maxWeight: '58,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Meio-Pesado', minWeight: '58,6', maxWeight: '62,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesado', minWeight: '62,6', maxWeight: '66,5 kg', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Super-Pesado', minWeight: '66,6', maxWeight: 'Acima', gender: 'F' },
  { ageGroup: 'JUVENIL', ageRange: '16-17 anos', category: 'Pesadissimo', minWeight: 'Acima', maxWeight: 'Acima', gender: 'F' },
  
  // Adulto e Master Masculino
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Galo', minWeight: 'Até', maxWeight: '55,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pluma', minWeight: '55,6', maxWeight: '61,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pena', minWeight: '61,6', maxWeight: '67,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Leve', minWeight: '67,6', maxWeight: '73,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Médio', minWeight: '73,6', maxWeight: '79,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Meio-Pesado', minWeight: '79,6', maxWeight: '85,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesado', minWeight: '85,6', maxWeight: '91,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Super-Pesado', minWeight: '91,6', maxWeight: '97,5 kg', gender: 'M' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesadissimo', minWeight: '97,6', maxWeight: 'Acima', gender: 'M' },
  
  // Adulto e Master Feminino
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Galo', minWeight: 'Até', maxWeight: '46,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pluma', minWeight: '46,6', maxWeight: '51,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pena', minWeight: '51,6', maxWeight: '56,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Leve', minWeight: '56,6', maxWeight: '61,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Médio', minWeight: '61,6', maxWeight: '66,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Meio-Pesado', minWeight: '66,6', maxWeight: '71,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesado', minWeight: '71,6', maxWeight: '76,5 kg', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Super-Pesado', minWeight: '76,6', maxWeight: 'Acima', gender: 'F' },
  { ageGroup: 'ADULTO/MASTER', ageRange: '18+ anos', category: 'Pesadissimo', minWeight: 'Acima', maxWeight: 'Acima', gender: 'F' },
]

interface WeightTableContentProps {
  eventId: string
}

export default function WeightTableContent({ eventId }: WeightTableContentProps) {
  // Estados para verificação de categoria
  const [checkAge, setCheckAge] = useState<string>('')
  const [checkWeight, setCheckWeight] = useState<string>('')
  const [checkGender, setCheckGender] = useState<'M' | 'F' | ''>('')
  const [withKimono, setWithKimono] = useState<boolean>(true)
  const [resultCategory, setResultCategory] = useState<string | null>(null)
  
  // Estado para controlar qual tabela está ativa (GI ou NO-GI)
  const [activeTable, setActiveTable] = useState<'GI' | 'NOGI'>('GI')

  // Selecionar tabela baseada na escolha
  const currentTable = activeTable === 'GI' ? weightTableGI : weightTableNOGI

  // Agrupar por faixa etária
  const groupedTable = currentTable.reduce((acc, row) => {
    const key = `${row.ageGroup}-${row.ageRange}-${row.gender}`
    if (!acc[key]) {
      acc[key] = {
        ageGroup: row.ageGroup,
        ageRange: row.ageRange,
        gender: row.gender,
        categories: [],
      }
    }
    acc[key].categories.push(row)
    return acc
  }, {} as Record<string, { ageGroup: string; ageRange: string; gender: 'M/F' | 'M' | 'F'; categories: WeightTableRow[] }>)

  // Estado para controlar quais grupos estão expandidos (primeiro expandido por padrão)
  const groupKeys = Object.keys(groupedTable)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set([groupKeys[0]]) // Primeiro grupo expandido por padrão
  )

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  // Função para encontrar a categoria baseada em idade, peso e gênero
  const findCategory = () => {
    if (!checkAge || !checkWeight) {
      setResultCategory(null)
      return
    }

    const age = parseInt(checkAge)
    const weight = parseFloat(checkWeight.replace(',', '.'))

    if (isNaN(age) || isNaN(weight)) {
      setResultCategory(null)
      return
    }

    // Usar a tabela correta baseada na escolha de kimono
    const tableToUse = withKimono ? weightTableGI : weightTableNOGI

    // Determinar o grupo etário baseado na idade
    let ageGroup = ''
    let ageRange = ''
    let genderFilter: 'M' | 'F' | 'M/F' = checkGender || 'M/F'

    if (age >= 4 && age <= 5) {
      ageGroup = 'PRÉ-MIRIM'
      ageRange = '4-5 anos'
      genderFilter = 'M/F'
    } else if (age >= 6 && age <= 7) {
      ageGroup = 'MIRIM A'
      ageRange = '6-7 anos'
      genderFilter = 'M/F'
    } else if (age >= 8 && age <= 9) {
      ageGroup = 'MIRIM B'
      ageRange = '8-9 anos'
      genderFilter = 'M/F'
    } else if (age >= 10 && age <= 11) {
      ageGroup = 'INFANTIL A'
      ageRange = '10-11 anos'
      genderFilter = 'M/F'
    } else if (age >= 12 && age <= 13) {
      ageGroup = 'INFANTIL B'
      ageRange = '12-13 anos'
      genderFilter = 'M/F'
    } else if (age >= 14 && age <= 15) {
      ageGroup = 'INFANTO-JUVENIL'
      ageRange = '14-15 anos'
      // Para 14-15 anos, precisa especificar gênero
      if (!checkGender) {
        setResultCategory('Para idades entre 14-15 anos, é necessário informar o gênero.')
        return
      }
      genderFilter = checkGender
    } else if (age >= 16 && age <= 17) {
      ageGroup = 'JUVENIL'
      ageRange = '16-17 anos'
      // Para 16-17 anos, precisa especificar gênero
      if (!checkGender) {
        setResultCategory('Para idades entre 16-17 anos, é necessário informar o gênero.')
        return
      }
      genderFilter = checkGender
    } else if (age >= 18) {
      ageGroup = 'ADULTO/MASTER'
      ageRange = '18+ anos'
      // Para adultos, precisa especificar gênero
      if (!checkGender) {
        setResultCategory('Para adultos (18+ anos), é necessário informar o gênero.')
        return
      }
      genderFilter = checkGender
    } else {
      setResultCategory('Idade fora da faixa permitida (4+ anos)')
      return
    }

    // Buscar categoria na tabela
    const categoryRow = tableToUse.find((row) => {
      if (row.ageGroup !== ageGroup || row.ageRange !== ageRange) return false
      
      // Verificar gênero
      if (row.gender !== 'M/F' && row.gender !== genderFilter) return false

      // Converter pesos para números
      let minWeightNum = 0
      let maxWeightNum = Infinity

      if (row.minWeight === 'Até') {
        minWeightNum = 0
      } else if (row.minWeight === 'Acima') {
        minWeightNum = Infinity
        maxWeightNum = Infinity
      } else {
        minWeightNum = parseFloat(row.minWeight.replace(',', '.'))
      }

      if (row.maxWeight === 'Acima') {
        maxWeightNum = Infinity
      } else {
        maxWeightNum = parseFloat(row.maxWeight.replace(',', '.').replace(' kg', ''))
      }

      // Verificar se o peso está dentro da faixa
      if (maxWeightNum === Infinity) {
        return weight >= minWeightNum
      }
      return weight >= minWeightNum && weight <= maxWeightNum
    })

    if (categoryRow) {
      setResultCategory(categoryRow.category)
    } else {
      setResultCategory('Categoria não encontrada. Verifique os dados informados.')
    }
  }

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    findCategory()
  }

  // Resetar grupos expandidos quando trocar de tabela
  const handleTableChange = (table: 'GI' | 'NOGI') => {
    setActiveTable(table)
    const newGrouped = table === 'GI' 
      ? weightTableGI.reduce((acc, row) => {
          const key = `${row.ageGroup}-${row.ageRange}-${row.gender}`
          if (!acc[key]) acc[key] = { ageGroup: row.ageGroup, ageRange: row.ageRange, gender: row.gender, categories: [] }
          acc[key].categories.push(row)
          return acc
        }, {} as Record<string, { ageGroup: string; ageRange: string; gender: 'M/F' | 'M' | 'F'; categories: WeightTableRow[] }>)
      : weightTableNOGI.reduce((acc, row) => {
          const key = `${row.ageGroup}-${row.ageRange}-${row.gender}`
          if (!acc[key]) acc[key] = { ageGroup: row.ageGroup, ageRange: row.ageRange, gender: row.gender, categories: [] }
          acc[key].categories.push(row)
          return acc
        }, {} as Record<string, { ageGroup: string; ageRange: string; gender: 'M/F' | 'M' | 'F'; categories: WeightTableRow[] }>)
    const newKeys = Object.keys(newGrouped)
    setExpandedGroups(new Set([newKeys[0]]))
  }

  // Função para obter label do grupo
  const getGroupLabel = (group: { ageGroup: string; ageRange: string; gender: 'M/F' | 'M' | 'F' }) => {
    if (group.gender === 'M') {
      return `${group.ageGroup} - ${group.ageRange} - Masculino`
    } else if (group.gender === 'F') {
      return `${group.ageGroup} - ${group.ageRange} - Feminino`
    }
    return `${group.ageGroup} - ${group.ageRange}`
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 uppercase">TABELA DE PESO</h2>
        <a
          href="/tabela-peso.pdf"
          download
          className="bg-primary-red hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition flex items-center space-x-2"
        >
          <FiDownload size={18} />
          <span>BAIXAR PDF</span>
        </a>
      </div>

      {/* Formulário de Verificação de Categoria */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold italic text-gray-800 mb-4 flex items-center gap-2">
          <FiSearch className="text-blue-600" />
          Verificar Minha Categoria
        </h3>
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Idade
              </label>
              <input
                type="number"
                min="4"
                value={checkAge}
                onChange={(e) => setCheckAge(e.target.value)}
                placeholder="Ex: 4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Peso (kg)
              </label>
              <input
                type="text"
                value={checkWeight}
                onChange={(e) => setCheckWeight(e.target.value.replace(/[^0-9,.]/g, ''))}
                placeholder="Ex: 18 ou 18,5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gênero
              </label>
              <select
                value={checkGender}
                onChange={(e) => setCheckGender(e.target.value as 'M' | 'F' | '')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Obrigatório para 14+ anos</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Com Kimono
              </label>
              <div className="flex items-center h-[48px]">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withKimono}
                    onChange={(e) => setWithKimono(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700 font-medium">
                    {withKimono ? 'Sim' : 'Não'}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition flex items-center justify-center gap-2"
          >
            <FiSearch size={18} />
            Verificar Categoria
          </button>
        </form>

        {/* Resultado */}
        {resultCategory && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            resultCategory.includes('não encontrada') || resultCategory.includes('fora da faixa') || resultCategory.includes('necessário')
              ? 'bg-red-50 border-red-300'
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center gap-2">
              <FiCheckCircle className={`text-lg ${
                resultCategory.includes('não encontrada') || resultCategory.includes('fora da faixa') || resultCategory.includes('necessário')
                  ? 'text-red-600'
                  : 'text-green-600'
              }`} />
              <p className={`font-bold text-lg ${
                resultCategory.includes('não encontrada') || resultCategory.includes('fora da faixa') || resultCategory.includes('necessário')
                  ? 'text-red-800'
                  : 'text-green-800'
              }`}>
                {resultCategory.includes('não encontrada') || resultCategory.includes('fora da faixa') || resultCategory.includes('necessário')
                  ? resultCategory
                  : `Sua categoria é: ${resultCategory}`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Abas para alternar entre GI e NO-GI */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => handleTableChange('GI')}
          className={`px-6 py-3 font-semibold transition ${
            activeTable === 'GI'
              ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          TABELA DE PESO GI (Com Kimono)
        </button>
        <button
          onClick={() => handleTableChange('NOGI')}
          className={`px-6 py-3 font-semibold transition ${
            activeTable === 'NOGI'
              ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          TABELA DE PESO NO-GI (Sem Kimono)
        </button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-gray-600">
          Consulte a tabela de peso para verificar em qual categoria você se enquadra. Clique no grupo de idade para expandir/recolher.
        </p>
      </div>

      {/* Tabela com acordeão */}
      <div className="space-y-2">
        {Object.entries(groupedTable).map(([key, group], groupIndex) => {
          const isExpanded = expandedGroups.has(key)
          return (
            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => toggleGroup(key)}
                className="w-full bg-primary-dark text-white px-6 py-4 flex items-center justify-between hover:bg-opacity-90 transition"
              >
                <h3 className="text-lg font-bold">
                  {getGroupLabel(group)}
                </h3>
                {isExpanded ? (
                  <FiChevronUp size={20} className="flex-shrink-0" />
                ) : (
                  <FiChevronDown size={20} className="flex-shrink-0" />
                )}
              </button>
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Categoria</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Peso Mínimo</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Peso Máximo</th>
                        <th className="px-6 py-3 text-left font-bold text-gray-700">Gênero</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {group.categories.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-gray-800 font-medium">
                            {row.category}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {row.minWeight}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {row.maxWeight}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {row.gender === 'M' ? 'Masculino' : row.gender === 'F' ? 'Feminino' : 'M/F'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold text-gray-800 mb-2">Importante:</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>A pesagem será realizada no dia do evento</li>
          <li>O atleta deve estar dentro da faixa de peso da categoria escolhida</li>
          <li>Em caso de não estar dentro da faixa, o atleta poderá ser reclassificado</li>
          <li>A idade é calculada com base no ano de nascimento</li>
          <li>Para GI: a pesagem é realizada com o kimono</li>
          <li>Para NO-GI: a pesagem é realizada sem o kimono</li>
          <li>Para idades a partir de 14 anos, é necessário informar o gênero</li>
          <li>Para mais detalhes, consulte a tabela oficial em PDF</li>
        </ul>
      </div>
    </div>
  )
}
