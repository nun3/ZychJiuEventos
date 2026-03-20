# 📐 PLANO DE NORMALIZAÇÃO TIPOGRAFICA - MEU CAMP

## 🎯 OBJETIVO
Normalizar completamente a tipografia do projeto, corrigindo os tamanhos excessivos causados pelo desenvolvimento em zoom 50%. Implementar uma escala tipográfica profissional, legível e equilibrada seguindo estritamente a abordagem **Mobile-First**.

---

## 1️⃣ DEFINIÇÃO DA ESCALA PADRÃO (MOBILE-FIRST)

### 📊 Escala Tipográfica Recomendada

| Elemento | Mobile (base) | Tablet (md:) | Desktop (lg:) | Desktop XL (xl:) | Tamanho Real (px) |
|----------|---------------|-------------|---------------|------------------|-------------------|
| **H1 - Hero Principal** | `text-3xl` | `text-4xl` | `text-5xl` | `text-6xl` | 30px → 48px → 60px → 72px |
| **H1 - Página Interna** | `text-2xl` | `text-3xl` | `text-4xl` | `text-5xl` | 24px → 30px → 36px → 48px |
| **H2 - Seções** | `text-xl` | `text-2xl` | `text-3xl` | `text-4xl` | 20px → 24px → 30px → 36px |
| **H3 - Subseções** | `text-lg` | `text-xl` | `text-2xl` | `text-3xl` | 18px → 20px → 24px → 30px |
| **H4 - Subtítulos** | `text-base` | `text-lg` | `text-xl` | `text-2xl` | 16px → 18px → 20px → 24px |
| **H5** | `text-sm` | `text-base` | `text-lg` | `text-xl` | 14px → 16px → 18px → 20px |
| **H6** | `text-xs` | `text-sm` | `text-base` | `text-lg` | 12px → 14px → 16px → 18px |
| **Corpo de Texto** | `text-sm` | `text-base` | `text-lg` | `text-lg` | 14px → 16px → 18px → 18px |
| **Texto Pequeno** | `text-xs` | `text-sm` | `text-sm` | `text-base` | 12px → 14px → 14px → 16px |
| **Labels/Forms** | `text-xs` | `text-sm` | `text-base` | `text-base` | 12px → 14px → 16px → 16px |
| **Botões** | `text-sm` | `text-base` | `text-base` | `text-lg` | 14px → 16px → 16px → 18px |
| **Links Navbar** | `text-sm` | `text-base` | `text-lg` | `text-xl` | 14px → 16px → 18px → 20px |

### 🎨 Regras de Aplicação

#### Para Títulos Principais (Hero):
```tsx
// ✅ CORRETO
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
  Título Principal
</h1>

// ❌ ERRADO (atual)
<h1 className="text-8xl font-bold">Título Principal</h1>
```

#### Para Títulos de Página Interna:
```tsx
// ✅ CORRETO
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  Título da Página
</h1>

// ❌ ERRADO (atual)
<h1 className="text-6xl font-bold">Título da Página</h1>
```

#### Para Corpo de Texto:
```tsx
// ✅ CORRETO
<p className="text-sm sm:text-base md:text-lg leading-relaxed">
  Texto do parágrafo...
</p>

// ❌ ERRADO (atual)
<p className="text-2xl leading-relaxed">Texto do parágrafo...</p>
```

#### Para Subtítulos (H2):
```tsx
// ✅ CORRETO
<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
  Subtítulo
</h2>

// ❌ ERRADO (atual)
<h2 className="text-5xl font-bold">Subtítulo</h2>
```

---

## 2️⃣ AJUSTE DE CONFIGURAÇÃO GLOBAL

### ✅ Verificação do `globals.css`

**Status:** ✅ **CORRETO** - Não há alteração do `font-size` base.

O arquivo `globals.css` está configurado corretamente:
- Não há `font-size` customizado no `html` ou `body`
- O padrão do navegador (16px = 1rem) está sendo respeitado
- A font-family está definida corretamente: `'Inter', sans-serif`

**Ação:** Nenhuma alteração necessária.

### ✅ Verificação do `tailwind.config.js`

**Status:** ✅ **CORRETO** - Configuração padrão do Tailwind.

O arquivo não possui customizações de `fontSize` que alterem a escala padrão.

**Ação:** Nenhuma alteração necessária.

### 📝 Recomendação Adicional (Opcional)

Se quiser garantir explicitamente o tamanho base, adicione ao `globals.css`:

```css
html {
  font-size: 16px; /* Garantir 1rem = 16px */
}

body {
  font-size: 1rem; /* Herdar do html */
}
```

**Nota:** Isso é redundante, mas pode ser útil para documentação.

---

## 3️⃣ MAPA DE SUBSTITUIÇÃO "SEARCH & REPLACE"

### 🔍 Classes Problemáticas Identificadas

| Classe Atual (PROBLEMÁTICA) | Substituição Mobile-First | Contexto de Uso |
|----------------------------|---------------------------|-----------------|
| `text-8xl` | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` | Hero titles |
| `text-7xl` | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` | Hero titles |
| `text-6xl` | `text-2xl sm:text-3xl md:text-4xl lg:text-5xl` | Page titles |
| `text-5xl` | `text-2xl sm:text-3xl md:text-4xl` | Section titles |
| `text-4xl` | `text-xl sm:text-2xl md:text-3xl` | Section titles |
| `text-3xl` | `text-lg sm:text-xl md:text-2xl` | Subsection titles |
| `text-2xl` | `text-sm sm:text-base md:text-lg` | Body text |
| `text-xl` | `text-sm sm:text-base` | Body text / Buttons |
| `text-lg` | `text-sm sm:text-base` | Body text / Buttons |
| `text-base` | `text-xs sm:text-sm` | Small text / Labels |

### 📋 Substituições Específicas por Contexto

#### Para Hero Section:
```bash
# Buscar e substituir:
text-8xl → text-3xl sm:text-4xl md:text-5xl lg:text-6xl
text-7xl → text-3xl sm:text-4xl md:text-5xl lg:text-6xl
text-6xl → text-3xl sm:text-4xl md:text-5xl lg:text-6xl
```

#### Para Títulos de Página:
```bash
# Buscar e substituir:
text-6xl → text-2xl sm:text-3xl md:text-4xl lg:text-5xl
text-5xl → text-2xl sm:text-3xl md:text-4xl
text-4xl → text-xl sm:text-2xl md:text-3xl
```

#### Para Corpo de Texto:
```bash
# Buscar e substituir:
text-2xl → text-sm sm:text-base md:text-lg
text-xl → text-sm sm:text-base
text-lg → text-sm sm:text-base
```

#### Para Subtítulos (H2, H3):
```bash
# H2:
text-5xl → text-xl sm:text-2xl md:text-3xl lg:text-4xl
text-4xl → text-xl sm:text-2xl md:text-3xl

# H3:
text-3xl → text-lg sm:text-xl md:text-2xl lg:text-3xl
```

#### Para Botões:
```bash
text-2xl → text-sm sm:text-base md:text-lg
text-xl → text-sm sm:text-base md:text-base
text-lg → text-sm sm:text-base
```

#### Para Labels e Forms:
```bash
text-xl → text-xs sm:text-sm md:text-base
text-lg → text-xs sm:text-sm md:text-base
text-base → text-xs sm:text-sm
```

---

## 4️⃣ EXEMPLO PRÁTICO DE CORREÇÃO

### 📄 Componente: `EventDetails.tsx`

#### ❌ ANTES (Código Problemático):

```tsx
{/* SOBRE O EVENTO */}
{activeInfoSubTab === 0 && (
  <div>
    <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 uppercase">
      SOBRE O EVENTO
    </h2>
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-8 mb-8">
      <p className="text-2xl leading-relaxed text-gray-700">
        É com imenso orgulho e entusiasmo que convidamos todos a participarem da 
        <strong className="uppercase">1ª COPA GRÊMIO INDUSTRIAL KIDS DE JIU-JITSU</strong>, 
        um evento totalmente voltado às categorias de base...
      </p>
      <p className="text-2xl leading-relaxed text-gray-700 mt-4">
        Mais do que uma competição, este será um dia de 
        <strong>celebração do futuro do nosso esporte</strong>...
      </p>
    </div>
  </div>
)}

{/* VALORES DAS INSCRIÇÕES */}
{activeInfoSubTab === 2 && (
  <div>
    <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 uppercase">
      VALORES DAS INSCRIÇÕES
    </h2>
    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      <div className="bg-white border-2 border-green-500 rounded-2xl p-8 text-center shadow-lg">
        <p className="text-5xl md:text-6xl font-black text-green-600 mb-2">
          R$ 70,00
        </p>
        <p className="text-2xl font-semibold italic text-gray-800">
          Apenas Categoria de Peso
        </p>
      </div>
    </div>
  </div>
)}
```

#### ✅ DEPOIS (Código Normalizado):

```tsx
{/* SOBRE O EVENTO */}
{activeInfoSubTab === 0 && (
  <div>
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 uppercase">
      SOBRE O EVENTO
    </h2>
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
      <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
        É com imenso orgulho e entusiasmo que convidamos todos a participarem da 
        <strong className="uppercase">1ª COPA GRÊMIO INDUSTRIAL KIDS DE JIU-JITSU</strong>, 
        um evento totalmente voltado às categorias de base...
      </p>
      <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mt-4">
        Mais do que uma competição, este será um dia de 
        <strong>celebração do futuro do nosso esporte</strong>...
      </p>
    </div>
  </div>
)}

{/* VALORES DAS INSCRIÇÕES */}
{activeInfoSubTab === 2 && (
  <div>
    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 uppercase">
      VALORES DAS INSCRIÇÕES
    </h2>
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
      <div className="bg-white border-2 border-green-500 rounded-2xl p-4 sm:p-6 md:p-8 text-center shadow-lg">
        <p className="text-3xl sm:text-4xl md:text-5xl font-black text-green-600 mb-2">
          R$ 70,00
        </p>
        <p className="text-sm sm:text-base md:text-lg font-semibold italic text-gray-800">
          Apenas Categoria de Peso
        </p>
      </div>
    </div>
  </div>
)}
```

### 📊 Comparação Visual

| Elemento | Antes | Depois | Redução |
|----------|-------|--------|---------|
| H2 (Seção) | `text-4xl md:text-5xl` (36px → 48px) | `text-xl sm:text-2xl md:text-3xl lg:text-4xl` (20px → 36px) | -33% |
| Corpo de Texto | `text-2xl` (24px) | `text-sm sm:text-base md:text-lg` (14px → 18px) | -42% |
| Preço (Destaque) | `text-5xl md:text-6xl` (48px → 60px) | `text-3xl sm:text-4xl md:text-5xl` (30px → 48px) | -37% |
| Label Preço | `text-2xl` (24px) | `text-sm sm:text-base md:text-lg` (14px → 18px) | -42% |

---

## 5️⃣ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Componentes Críticos (Prioridade Alta)
- [ ] `components/ModernHero.tsx` - Hero section
- [ ] `components/ModernNavbar.tsx` - Navegação
- [ ] `components/EventDetails.tsx` - Detalhes do evento
- [ ] `components/EventFilters.tsx` - Filtros
- [ ] `app/page.tsx` - Home page

### Fase 2: Componentes Secundários (Prioridade Média)
- [ ] `components/ModernEventGrid.tsx` - Grid de eventos
- [ ] `components/ModernEventCard.tsx` - Cards de evento
- [ ] `components/RegistrationWizard.tsx` - Wizard de inscrição
- [ ] `components/WeightTableContent.tsx` - Tabela de peso
- [ ] `components/FinancialContent.tsx` - Conteúdo financeiro

### Fase 3: Páginas Admin (Prioridade Baixa)
- [ ] `app/admin/**/*.tsx` - Todas as páginas admin
- [ ] `app/dashboard/**/*.tsx` - Todas as páginas dashboard

### Fase 4: Validação Final
- [ ] Testar em mobile (320px - 768px)
- [ ] Testar em tablet (768px - 1024px)
- [ ] Testar em desktop (1024px+)
- [ ] Verificar legibilidade em zoom 100%
- [ ] Validar hierarquia visual

---

## 6️⃣ REGRAS DE OURO

### ✅ FAZER:
1. **Sempre começar com o tamanho mobile** (sem prefixo)
2. **Usar breakpoints progressivos**: `sm:`, `md:`, `lg:`, `xl:`
3. **Manter hierarquia visual clara**: H1 > H2 > H3 > corpo
4. **Testar em zoom 100%** após cada alteração
5. **Usar `leading-relaxed` ou `leading-normal`** para corpo de texto

### ❌ NÃO FAZER:
1. **Não usar classes acima de `text-6xl`** (exceto casos muito específicos)
2. **Não pular breakpoints**: `text-sm lg:text-3xl` (pula md)
3. **Não usar tamanhos fixos** sem responsividade
4. **Não misturar escalas**: manter consistência
5. **Não esquecer de ajustar padding/margin** proporcionalmente

---

## 7️⃣ COMANDOS ÚTEIS PARA REFATORAÇÃO

### Buscar todas as ocorrências problemáticas:

```bash
# Buscar text-6xl ou maior
grep -r "text-[6-9]xl\|text-\[" components/ app/

# Buscar text-2xl em parágrafos (provavelmente corpo de texto)
grep -r "text-2xl" components/ app/ | grep -E "<p|className.*text-2xl"

# Buscar text-4xl ou maior em h2
grep -r "text-[4-9]xl" components/ app/ | grep -E "<h2"
```

### Substituições em massa (usar com cuidado):

```bash
# Substituir text-8xl em hero sections
find . -name "*.tsx" -type f -exec sed -i 's/text-8xl/text-3xl sm:text-4xl md:text-5xl lg:text-6xl/g' {} \;

# Substituir text-2xl em parágrafos (após revisão manual)
find . -name "*.tsx" -type f -exec sed -i 's/text-2xl/text-sm sm:text-base md:text-lg/g' {} \;
```

**⚠️ ATENÇÃO:** Sempre revisar manualmente após substituições automáticas!

---

## 📝 NOTAS FINAIS

1. **Prioridade**: Começar pelos componentes mais visíveis (Hero, Navbar, EventDetails)
2. **Testes**: Testar em diferentes dispositivos e navegadores
3. **Consistência**: Manter a mesma escala em todo o projeto
4. **Documentação**: Atualizar este documento conforme necessário

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0.0

