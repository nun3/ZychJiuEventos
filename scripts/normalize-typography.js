/**
 * Script auxiliar para normalização tipográfica
 * 
 * Este script ajuda a identificar e sugerir correções para classes
 * tipográficas problemáticas no projeto.
 * 
 * Uso: node scripts/normalize-typography.js
 */

const fs = require('fs');
const path = require('path');

// Mapa de substituições recomendadas
const replacements = {
  // Hero titles
  'text-8xl': 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
  'text-7xl': 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
  
  // Page titles
  'text-6xl': 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  'text-5xl': 'text-2xl sm:text-3xl md:text-4xl',
  
  // Section titles
  'text-4xl': 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  'text-3xl': 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
  
  // Body text (contextual - precisa revisão manual)
  'text-2xl': 'text-sm sm:text-base md:text-lg',
  'text-xl': 'text-sm sm:text-base',
  'text-lg': 'text-sm sm:text-base',
};

// Tamanhos problemáticos para buscar
const problematicSizes = [
  'text-8xl',
  'text-7xl',
  'text-6xl',
  'text-5xl',
  'text-4xl',
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
];

// Função para buscar arquivos recursivamente
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar node_modules e .next
      if (!['node_modules', '.next', '.git'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Função para analisar arquivo
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  problematicSizes.forEach(size => {
    const regex = new RegExp(size.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    
    if (matches) {
      issues.push({
        size,
        count: matches.length,
        lines: getLineNumbers(content, size),
      });
    }
  });
  
  return issues.length > 0 ? { file: filePath, issues } : null;
}

// Função para obter números de linha
function getLineNumbers(content, search) {
  const lines = content.split('\n');
  const lineNumbers = [];
  
  lines.forEach((line, index) => {
    if (line.includes(search)) {
      lineNumbers.push(index + 1);
    }
  });
  
  return lineNumbers;
}

// Função principal
function main() {
  console.log('🔍 Analisando tipografia do projeto...\n');
  
  const componentsDir = path.join(__dirname, '..', 'components');
  const appDir = path.join(__dirname, '..', 'app');
  
  const allFiles = [
    ...findFiles(componentsDir),
    ...findFiles(appDir),
  ];
  
  const results = [];
  
  allFiles.forEach(file => {
    const analysis = analyzeFile(file);
    if (analysis) {
      results.push(analysis);
    }
  });
  
  // Exibir resultados
  console.log(`📊 Encontrados ${results.length} arquivos com problemas tipográficos:\n`);
  
  results.forEach(result => {
    console.log(`📄 ${path.relative(process.cwd(), result.file)}`);
    result.issues.forEach(issue => {
      console.log(`   ⚠️  ${issue.size}: ${issue.count} ocorrência(s) nas linhas: ${issue.lines.join(', ')}`);
    });
    console.log('');
  });
  
  // Estatísticas
  const totalIssues = results.reduce((sum, result) => {
    return sum + result.issues.reduce((s, issue) => s + issue.count, 0);
  }, 0);
  
  console.log(`\n📈 Total de problemas encontrados: ${totalIssues}`);
  console.log('\n💡 Dica: Use o documento docs/NORMALIZACAO_TIPOGRAFICA.md para guiar as correções.\n');
}

// Executar
if (require.main === module) {
  main();
}

module.exports = { analyzeFile, findFiles, replacements };

