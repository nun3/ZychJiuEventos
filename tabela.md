graph TD
    A[Início: Atleta Masculino] --> B{Modalidade: No-Gi?};
    B -->|Sim| C{Faixa Etária: Adulto/Master?};
    C -->|Sim| D[Peso do Atleta em kg];
    D --> E{D <= 55.5?};
    E -->|Sim| F[Categoria: Galo];
    E -->|Não| G{D <= 61.5?};
    G -->|Sim| H[Categoria: Pluma];
    G -->|Não| I{D <= 67.5?};
    I -->|Sim| J[Categoria: Pena];
    I -->|Não| K{D <= 73.5?};
    K -->|Sim| L[Categoria: Leve];
    K -->|Não| M{D <= 79.5?};
    M -->|Sim| N[Categoria: Médio];
    M -->|Não| O{D <= 85.5?};
    O -->|Sim| P[Categoria: Meio-Pesado];
    O -->|Não| Q{D <= 91.5?};
    Q -->|Sim| R[Categoria: Pesado];
    Q -->|Não| S{D <= 97.5?};
    S -->|Sim| T[Categoria: Super-Pesado];
    S -->|Não| U[Categoria: Pesadíssimo (Acima de 97.5 kg)];




    