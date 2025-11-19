import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import Link from 'next/link'
import { FiArrowLeft, FiBarChart, FiDownload } from 'react-icons/fi'

// Tabela de peso baseada na estrutura oficial de Jiu-Jitsu Infantil
const weightTable = [
  // Mirim (4-5 anos)
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Galão', minWeight: 'Até', maxWeight: '17,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Super Galão', minWeight: '17,1', maxWeight: '19,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Pluma', minWeight: '19,1', maxWeight: '21,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Pena', minWeight: '21,1', maxWeight: '23,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Leve', minWeight: '23,1', maxWeight: '25,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Médio', minWeight: '25,1', maxWeight: '27,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Meio Pesado', minWeight: '27,1', maxWeight: '29,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '4-5 anos', category: 'Pesado', minWeight: '29,1', maxWeight: 'Acima', gender: 'M/F' },
  
  // Pré-Mirim (6-7 anos)
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Galão', minWeight: 'Até', maxWeight: '20,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Super Galão', minWeight: '20,1', maxWeight: '22,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Pluma', minWeight: '22,1', maxWeight: '24,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Pena', minWeight: '24,1', maxWeight: '26,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Leve', minWeight: '26,1', maxWeight: '28,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Médio', minWeight: '28,1', maxWeight: '30,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Meio Pesado', minWeight: '30,1', maxWeight: '32,0 kg', gender: 'M/F' },
  { ageGroup: 'PRÉ-MIRIM', ageRange: '6-7 anos', category: 'Pesado', minWeight: '32,1', maxWeight: 'Acima', gender: 'M/F' },
  
  // Mirim (8-9 anos)
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Galão', minWeight: 'Até', maxWeight: '24,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Super Galão', minWeight: '24,1', maxWeight: '26,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Pluma', minWeight: '26,1', maxWeight: '28,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Pena', minWeight: '28,1', maxWeight: '30,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Leve', minWeight: '30,1', maxWeight: '32,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Médio', minWeight: '32,1', maxWeight: '34,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Meio Pesado', minWeight: '34,1', maxWeight: '36,0 kg', gender: 'M/F' },
  { ageGroup: 'MIRIM', ageRange: '8-9 anos', category: 'Pesado', minWeight: '36,1', maxWeight: 'Acima', gender: 'M/F' },
  
  // Infantil (10-11 anos)
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Galão', minWeight: 'Até', maxWeight: '28,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Super Galão', minWeight: '28,1', maxWeight: '30,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Pluma', minWeight: '30,1', maxWeight: '32,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Pena', minWeight: '32,1', maxWeight: '34,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Leve', minWeight: '34,1', maxWeight: '36,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Médio', minWeight: '36,1', maxWeight: '38,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Meio Pesado', minWeight: '38,1', maxWeight: '40,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '10-11 anos', category: 'Pesado', minWeight: '40,1', maxWeight: 'Acima', gender: 'M/F' },
  
  // Infantil (12-13 anos)
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Galão', minWeight: 'Até', maxWeight: '32,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Super Galão', minWeight: '32,1', maxWeight: '34,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Pluma', minWeight: '34,1', maxWeight: '36,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Pena', minWeight: '36,1', maxWeight: '38,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Leve', minWeight: '38,1', maxWeight: '40,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Médio', minWeight: '40,1', maxWeight: '42,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Meio Pesado', minWeight: '42,1', maxWeight: '44,0 kg', gender: 'M/F' },
  { ageGroup: 'INFANTIL', ageRange: '12-13 anos', category: 'Pesado', minWeight: '44,1', maxWeight: 'Acima', gender: 'M/F' },
]

export default function WeightTablePage({ params }: { params: { id: string } }) {
  // Agrupar por faixa etária
  const groupedTable = weightTable.reduce((acc, row) => {
    const key = `${row.ageGroup}-${row.ageRange}`
    if (!acc[key]) {
      acc[key] = {
        ageGroup: row.ageGroup,
        ageRange: row.ageRange,
        categories: [],
      }
    }
    acc[key].categories.push(row)
    return acc
  }, {} as Record<string, { ageGroup: string; ageRange: string; categories: typeof weightTable }>)

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/eventos/${params.id}`}
              className="text-gray-600 hover:text-primary-orange flex items-center space-x-2 transition mb-4"
            >
              <FiArrowLeft />
              <span>voltar para o evento</span>
            </Link>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center space-x-3">
                <FiBarChart className="text-primary-red" />
                <span>TABELA DE PESO</span>
              </h1>
              <a
                href="/tabela-peso.pdf"
                download
                className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center space-x-2"
              >
                <FiDownload />
                <span>BAIXAR PDF</span>
              </a>
            </div>
          </div>

          {/* Tabela de Peso */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <p className="text-gray-600">
                Consulte a tabela de peso para verificar em qual categoria você se enquadra.
              </p>
            </div>

            <div className="overflow-x-auto">
              {Object.values(groupedTable).map((group, groupIndex) => (
                <div key={groupIndex} className={groupIndex > 0 ? 'border-t' : ''}>
                  <div className="bg-primary-dark text-white px-6 py-3">
                    <h3 className="text-lg font-bold">
                      {group.ageGroup} - {group.ageRange}
                    </h3>
                  </div>
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
                            {row.gender}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Informações Adicionais */}
            <div className="bg-gray-50 p-6 border-t">
              <h3 className="font-bold text-gray-800 mb-2">Importante:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                <li>A pesagem será realizada no dia do evento</li>
                <li>O atleta deve estar dentro da faixa de peso da categoria escolhida</li>
                <li>Em caso de não estar dentro da faixa, o atleta poderá ser reclassificado</li>
                <li>A idade é calculada com base no ano de nascimento</li>
                <li>Para mais detalhes, consulte a tabela oficial em PDF</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

