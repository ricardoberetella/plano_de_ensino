import { ProgrammaticUnit } from "../types/syllabus";
import { generateSyllabusSchedule } from "../utils/scheduleGenerator";

export const rawProeducadorUnits: ProgrammaticUnit[] = [
  {
    id: "uc-fusi",
    unitTitle: "Fundamentos da Usinagem e Ajustagem Mecânica",
    acronym: "FUSI",
    semester: "1º SEMESTRE",
    module: "Módulo Introdutório",
    workload: "240h",
    objective:
      "Executar operações fundamentais de usinagem e ajustagem mecânica em bancada e máquinas operatrizes, respeitando procedimentos técnicos, de segurança e ambientais.",
    basicCapacities: [
      "Demonstrar atenção a detalhes e rigor dimensional nas operações manuais.",
      "Aplicar princípios de conservação e limpeza das ferramentas de corte e máquinas.",
      "Trabalhar em equipe cooperativa e zelar pelo patrimônio da oficina.",
    ],
    technicalCapacities: [
      "Operar furadeiras de coluna e bancada aplicando parâmetros corretos de corte.",
      "Realizar operações de ajustagem manual (traçagem, corte com serra, limagem e furação).",
      "Efetuar abertura de roscas manuais com machos e cossinetes segundo normas técnicas.",
      "Afiar ferramentas manuais de corte e brocas helicoidais.",
      "Cumprir rigorosamente as normas de segurança NR-12, NR-15 e NR-06 no ambiente fabril.",
    ],
    socioemotionalCapacities: [
      "Demonstrar responsabilidade individual e coletiva com a segurança.",
      "Manter a organização, zelo e limpeza do posto de trabalho (5S).",
      "Comunicar anomalias ou falhas de forma proativa e clara.",
    ],
    topics: [
      "Segurança no trabalho em oficinas mecânicas e NR-12",
      "Ferramentas manuais de ajustagem e técnicas de limagem",
      "Traçagem de peças e instrumentos de riscar/marcar",
      "Operações de corte manual com serra e cinzelamento",
      "Furadeiras de bancada, coluna e ferramentas de furar (brocas helicoidais)",
      "Cálculo de parâmetros de corte para furação (RPM e avanço)",
      "Roscas triangulares métricas e polegadas: machos e cossinetes",
      "Noções de refrigeração e fluidos de corte na usinagem",
      "Normas de descarte ecológico de cavacos e resíduos fabris",
    ],
    situationProblem: {
      title: "Situação de Aprendizagem: Fabricação do Conjunto de Grampo Paralelo",
      contextualization:
        "Uma linha de montagem industrial solicitou à ferramentaria a fabricação urgente de um lote de grampos paralelos de precisão para fixação de componentes em bancadas.",
      challenge: [
        "Interpretar o desenho técnico do grampo paralelo e levantar a folha de processo.",
        "Executar a traçagem, corte, limagem e esquadrejamento das réguas em aço ABNT 1020.",
        "Realizar a furação escalonada, escareamento e abertura de roscas M8 com machos manuais.",
        "Efetuar o ajuste de faces e montagem do conjunto garantindo paralelismo e funcionamento suave.",
      ],
      expectedResults: [
        "Conjunto montado com esquadro e planicidade conforme tolerâncias especificadas.",
        "Dossiê técnico com folha de processo preenchida e relatório de inspeção dimensional.",
      ],
    },
    rubrics: [
      {
        capacity: "Esquadrejamento e Planicidade Manual",
        nsa: "Faces fora de esquadro (>0.2mm) e rebarbas visíveis.",
        apo: "Atingiu esquadro com tolerância aceitável sob auxílio docente.",
        par: "Esquadro e planicidade dentro de 0.05mm com mínima orientação.",
        aut: "Esquadro perfeito (<0.02mm) com acabamento superficial impecável e total autonomia.",
      },
      {
        capacity: "Operação Segura de Furadeira e Roscamento",
        nsa: "Descumpriu EPIs ou quebrou ferramentas por avanço inadequado.",
        apo: "Operou com segurança mediante supervisão e lembretes constantes.",
        par: "Operou de forma segura com pequenas dúvidas nos cálculos de RPM.",
        aut: "Cálculo perfeito de RPM, uso rigoroso de EPIs e roscamento sem erros.",
      },
    ],
    lessonPlan: [],
  },
  {
    id: "uc-lidt",
    unitTitle: "Leitura e Interpretação de Desenho Técnico Mecânico",
    acronym: "LIDT",
    semester: "1º SEMESTRE",
    module: "Módulo Básico",
    workload: "40h",
    objective:
      "Interpretar desenhos técnicos mecânicos, croquis e representações normalizadas em conformidade com as normas técnicas vigentes (ABNT).",
    basicCapacities: [
      "Demonstrar percepção espacial e raciocínio lógico tridimensional.",
      "Manter rigor e fidelidade na leitura das normas técnicas da ABNT.",
    ],
    technicalCapacities: [
      "Interpretar projeções ortogonais no 1º diedro de peças prismáticas e cilíndricas.",
      "Identificar e aplicar regras de cotagem funcional, tolerâncias dimensionais e geométricas.",
      "Interpretar representações de cortes totais, parciais, seções e rupturas.",
      "Compreender a simbologia de acabamento superficial (rugosidade Ra) e tratamentos térmicos.",
    ],
    socioemotionalCapacities: [
      "Trabalhar com precisão, atenção concentrada e postura ética.",
      "Compartilhar interpretações técnicas de forma colaborativa.",
    ],
    topics: [
      "Introdução ao Desenho Técnico e Normas ABNT (NBR 8402, 10067)",
      "Projeções ortogonais no 1º diedro: vistas ortográficas principais",
      "Vistas essenciais, cortes totais, parciais e seções",
      "Cotagem funcional e simbologias técnicas normalizadas",
      "Tolerâncias dimensionais (ISO 286 / NBR 6158)",
      "Tolerâncias geométricas de forma, orientação e posição (GD&T)",
      "Indicação de acabamento superficial e simbologia de rugosidade Ra",
      "Interpretação de desenhos de conjuntos mecânicos e listas de peças",
    ],
    situationProblem: {
      title: "Situação de Aprendizagem: Dossiê Técnico de Fabricação de Eixo Escalonado",
      contextualization:
        "O setor de engenharia de uma montadora automotiva necessita validar e aprovar o desenho técnico de um novo eixo escalonado com tolerâncias H7/g6 antes do envio para a oficina.",
      challenge: [
        "Identificar todas as vistas ortográficas e detalhes de corte do componente.",
        "Interpretar os campos de tolerâncias dimensionais e requisitos de rugosidade Ra.",
        "Redigir o parecer técnico com a sequência operacional recomendada para usinagem.",
      ],
      expectedResults: [
        "Formulário de interpretação técnica preenchido sem inconformidades.",
        "Croqui cotado com indicação correta de acabamentos e referências de medição.",
      ],
    },
    rubrics: [
      {
        capacity: "Leitura de Cotas e Tolerâncias ISO",
        nsa: "Erros graves na conversão de tolerâncias e confusão de afastamentos.",
        apo: "Necessitou de intervenção para calcular limites máximo e mínimo.",
        par: "Calculou afastamentos corretamente com pequenos desvios de notação.",
        aut: "Interpretação exata de tolerâncias ISO e GD&T sem qualquer hesitação.",
      },
    ],
    lessonPlan: [],
  },
  {
    id: "uc-crd",
    unitTitle: "Controle Dimensional e Metrologia Básica",
    acronym: "CRD",
    semester: "1º SEMESTRE",
    module: "Módulo Básico",
    workload: "40h",
    objective:
      "Medir grandezas dimensionais e geométricas utilizando instrumentos convencionais de medição e controle de qualidade.",
    basicCapacities: [
      "Demonstrar precisão e rigor na execução das medições.",
      "Zelar pela conservação e calibração dos instrumentos de precisão.",
    ],
    technicalCapacities: [
      "Medir peças com paquímetro universal em milímetros e polegadas fracionárias/milesimais.",
      "Medir com micrômetros externos com resolução de 0,01mm e 0,001mm.",
      "Utilizar goniômetro para medições e traçagens angulares de precisão.",
      "Operar relógio comparador e apalpador para medições indiretas e centragem.",
      "Preencher folhas de inspeção e relatórios de conformidade dimensional.",
    ],
    socioemotionalCapacities: [
      "Postura ética e confiabilidade no registro dos resultados metrológicos.",
      "Cuidado e responsabilidade no manuseio de instrumentos sensíveis.",
    ],
    topics: [
      "Conceitos de metrologia: exatidão, precisão, repetibilidade e rastreabilidade",
      "Régua graduada e escala de precisão em milímetros e polegadas",
      "Paquímetro universal: princípio do nônio (0,05mm, 0,02mm e 1/128\")",
      "Micrômetro externo de precisão (resolução 0,01mm e 0,001mm)",
      "Goniômetro e medição angular direta",
      "Relógio comparador e apalpador: técnicas de centragem e alinhamento",
      "Blocos-padrão e calibração de instrumentos de oficina",
      "Elaboração de relatórios de inspeção dimensional e controle de qualidade",
    ],
    situationProblem: {
      title: "Situação de Aprendizagem: Inspeção de Qualidade e Laudo Metrológico de Lote",
      contextualization:
        "O departamento de garantia da qualidade recebeu um lote piloto de 10 buchas usinadas e exige inspeção metrológica rigorosa com emissão de laudo de liberação.",
      challenge: [
        "Selecionar os instrumentos adequados para cada característica geométrica.",
        "Realizar as medições com paquímetro e micrômetro garantindo repetibilidade.",
        "Calcular desvios, verificar conformidade com as tolerâncias de projeto e emitir laudo.",
      ],
      expectedResults: [
        "Laudo de inspeção dimensional completo com análise de aprovação/rejeição.",
        "Instrumentos devidamente limpos, lubrificados e guardados conforme protocolo.",
      ],
    },
    rubrics: [
      {
        capacity: "Leitura no Micrômetro Externo",
        nsa: "Erros de leitura de tambor e aplicação de pressão excessiva na catraca.",
        apo: "Leitura correta com auxílio na interpolação centesimal.",
        par: "Leitura precisa com ligeira demora no ajuste do instrumento.",
        aut: "Leitura imediata, aplicação perfeita da catraca e precisão absoluta.",
      },
    ],
    lessonPlan: [],
  },
  {
    id: "uc-map",
    unitTitle: "Matemática Aplicada aos Processos de Usinagem",
    acronym: "MAP",
    semester: "1º SEMESTRE",
    module: "Módulo Básico",
    workload: "40h",
    objective:
      "Aplicar conceitos matemáticos, trigonométricos e de cálculo técnico na resolução de problemas práticos de processos de usinagem.",
    basicCapacities: [
      "Demonstrar raciocínio quantitativo e capacidade analítica.",
      "Verificar e validar a coerência dos resultados calculados com a realidade da oficina.",
    ],
    technicalCapacities: [
      "Calcular conversões de unidades entre o sistema métrico e o sistema inglês.",
      "Aplicar trigonometria do triângulo retângulo para cálculo de cones e chanfros.",
      "Calcular parâmetros de corte: RPM (n), velocidade de corte (Vc) e tempo de usinagem.",
      "Calcular trens de engrenagens e relações de transmissão para recartilhas e roscas.",
    ],
    socioemotionalCapacities: [
      "Persistência na resolução de problemas complexos de engenharia.",
      "Comunicação clara de soluções e justificativas matemáticas.",
    ],
    topics: [
      "Operações aritméticas fundamentais e frações aplicadas",
      "Conversão de unidades (Sistema Métrico Decimal e Sistema Inglês)",
      "Regra de três simples e cálculo de proporções de ligas e fluidos",
      "Geometria plana e espacial aplicada: áreas, perímetros e volumes",
      "Trigonometria do triângulo retângulo aplicada ao torneamento e fresamento",
      "Cálculo de inclinação de carros superiores e desvio para torneamento cônico",
      "Cálculo de engrenamento e relações de transmissão (trens de engrenagens)",
      "Cálculos de parâmetros de corte: RPM (n), velocidade de corte (Vc) e avanço (f)",
    ],
    situationProblem: {
      title: "Situação de Aprendizagem: Otimização de Parâmetros de Corte e Usinagem Cônica",
      contextualization:
        "Para reduzir o tempo de ciclo na produção de um eixo cônico em aço SAE 1045, o operador deve recalcular o ângulo do carro superior e os parâmetros de corte ideais.",
      challenge: [
        "Calcular o semi-ângulo do cone através das relações trigonométricas.",
        "Determinar a rotação ideal (RPM) considerando a velocidade de corte recomendada pelo fabricante.",
        "Calcular o tempo teórico de usinagem e o volume de cavaco removido.",
      ],
      expectedResults: [
        "Memorial de cálculo técnico aprovado e pronto para aplicação em máquina.",
        "Tabela de parâmetros operacionais entregue ao encarregado da oficina.",
      ],
    },
    rubrics: [
      {
        capacity: "Cálculo de Trigonometria para Cones",
        nsa: "Fórmula incorreta ou erro no uso de funções trigonométricas.",
        apo: "Aplicou a fórmula correta sob orientação e conferência dos passos.",
        par: "Calculou o ângulo com precisão com pequena demora na conversão decimal.",
        aut: "Cálculo instantâneo, preciso e com verificação geométrica completa.",
      },
    ],
    lessonPlan: [],
  },
  {
    id: "uc-ciema",
    unitTitle: "Ciências dos Materiais Aplicada à Fabricação Mecânica",
    acronym: "CIEMA",
    semester: "1º SEMESTRE",
    module: "Módulo Básico",
    workload: "40h",
    objective:
      "Reconhecer a estrutura, propriedades e aplicações dos materiais metálicos e não-metálicos, bem como os efeitos dos tratamentos térmicos na usinabilidade.",
    basicCapacities: [
      "Identificar materiais industriais segundo padrões normativos e características físicas.",
      "Analisar a correlação entre estrutura do material e comportamento em usinagem.",
    ],
    technicalCapacities: [
      "Classificar aços-carbono, aços-liga e ferros fundidos conforme sistemas SAE/ABNT.",
      "Compreender a influência do teor de carbono e elementos de liga na dureza e usinabilidade.",
      "Identificar os parâmetros e aplicações de tratamentos térmicos (têmpera, revenimento, recozimento).",
      "Interpretar ensaios de dureza (Rockwell e Brinell) e ensaio de tração.",
    ],
    socioemotionalCapacities: [
      "Consciência sustentável na destinação e reciclagem de materiais metálicos.",
      "Rigor técnico na seleção de matérias-primas industriais.",
    ],
    topics: [
      "Classificação dos materiais de engenharia (metais, polímeros, cerâmicas e compósitos)",
      "Estrutura cristalina e propriedades mecânicas dos metais (dureza, tenacidade, resistência)",
      "Aços-carbono e aços-liga: sistema de classificação ABNT/SAE (1020, 1045, 4140, 4340)",
      "Ferros fundidos cinzento, nodular e branco e suas aplicações industriais",
      "Metais e ligas não-ferrosas (alumínio, latão, bronze, cobre)",
      "Tratamentos térmicos dos aços: têmpera, revenimento, recozimento e normalização",
      "Tratamentos termoquímicos: cementação e nitretação",
      "Ensaios mecânicos industriais: dureza Rockwell, Brinell, tração e impacto Charpy",
    ],
    situationProblem: {
      title: "Situação de Aprendizagem: Seleção de Aço e Tratamento Térmico para Pino de Alta Carga",
      contextualization:
        "Um dispositivo mecânico sofreu ruptura prematura em campo por fadiga mecânica. A equipe técnica deve propor o material correto e o tratamento térmico adequado.",
      challenge: [
        "Investigar o tipo de esforço mecânico atuante no componente.",
        "Selecionar o aço mais indicado (comparando SAE 1020, 1045 e 4140).",
        "Especificar o ciclo de tratamento térmico (têmpera e revenimento) para alcançar dureza HRC 45.",
      ],
      expectedResults: [
        "Relatório técnico justificando a escolha do aço e tratamento térmico.",
        "Plano de controle para ensaio de dureza pós-usinagem.",
      ],
    },
    rubrics: [
      {
        capacity: "Seleção e Justificativa de Materiais",
        nsa: "Indicação incoerente do material sem considerar propriedades mecânicas.",
        apo: "Selecionou o material correto mediante direcionamento nos catálogos.",
        par: "Justificou a escolha técnica com boa argumentação e pequenos detalhes pendentes.",
        aut: "Domínio pleno das normas SAE/ABNT e justificativa técnica impecável.",
      },
    ],
    lessonPlan: [],
  },
  {
    id: "uc-proc",
    unitTitle: "Processos de Usinagem Convencional (Torneamento e Fresamento)",
    acronym: "PRUSC",
    semester: "2º SEMESTRE",
    module: "Módulo Específico",
    workload: "280h",
    objective:
      "Operar tornos mecânicos universais, fresadoras universais e retificadoras para fabricação de peças mecânicas de precisão dentro das tolerâncias especificadas.",
    basicCapacities: [
      "Demonstrar autonomia técnica e concentração durante a usinagem em máquinas.",
      "Zelar pela integridade física, conservação das máquinas e das ferramentas de corte.",
    ],
    technicalCapacities: [
      "Preparar e operar torno mecânico para torneamento externo, interno, faceamento e sangramento.",
      "Executar torneamento cônico por inclinação de carro superior e com auxílio de goniômetro.",
      "Abrir roscas triangulares métricas e whitworth no torno universal com ferramenta de perfil simples.",
      "Preparar e operar fresadora universal para esquadrejamento de blocos e canais em T.",
      "Utilizar aparelho divisor universal para fresamento de perfis prismáticos e engrenagens.",
      "Operar retificadoras convencionais (plana e cilíndrica) realizando balanceamento de rebolos.",
    ],
    socioemotionalCapacities: [
      "Agir com resiliência e foco na resolução de não-conformidades de usinagem.",
      "Manter postura proativa e comunicação eficiente na oficina mecânica.",
    ],
    topics: [
      "Cinemática e estrutura do torno mecânico universal",
      "Ferramentas de torneamento: metal duro (insertos intercambiáveis) e aço rápido (bits)",
      "Operações de faceamento, torneamento cilíndrico externo e interno",
      "Torneamento cônico por inclinação do carro superior e desalinhamento de cabeçote",
      "Abertura de canais, recartilhamento e sangramento de peças",
      "Rosqueamento no torno com ferramenta de perfil simples (métrica e whitworth)",
      "Fresadora universal: cabeçotes, eixos porta-fresas e ferramentas rotativas",
      "Operações de fresamento tangencial, frontal e esquadrejamento de blocos",
      "Fresamento de rasgos de chaveta, canais em T e perfis angulares",
      "Uso do aparelho divisor universal: divisão direta e indireta para engrenagens",
      "Retificação plana e cilíndrica: balanceamento, fixação magnética e dressamento de rebolos",
    ],
    situationProblem: {
      title: "Situação de Aprendizagem: Fabricação de Conjunto Fuso-Porca e Eixo com Rasgo de Chaveta",
      contextualization:
        "A equipe de manutenção industrial solicitou a fabricação sob medida de um conjunto fuso trapezoidal com porca em bronze e eixo com rasgo de chaveta para uma prensa hidráulica.",
      challenge: [
        "Elaborar a folha de processo detalhada discriminando operações de torno e fresadora.",
        "Usinar o fuso garantindo tolerâncias de batimento e acabamento de rosca.",
        "Fresamento do rasgo de chaveta no eixo cilíndrico com fresa de topo de 8mm.",
        "Realizar a montagem do conjunto e verificação de folga com relógio apalpador.",
      ],
      expectedResults: [
        "Peças usinadas conforme especificações de desenho técnico e tolerâncias dimensionais.",
        "Conjunto funcionando com curso livre e sem travamento mecânico.",
      ],
    },
    rubrics: [
      {
        capacity: "Usinagem de Roscas e Canais no Torno",
        nsa: "Passo de rosca incorreto ou colisão de ferramenta na saída de canal.",
        apo: "Rosqueou com acompanhamento constante no engate do relógio de rosca.",
        par: "Rosqueou com autonomia e bom acabamento superficial.",
        aut: "Rosqueamento impecável, encaixe perfeito no calibrador e zero retrabalho.",
      },
      {
        capacity: "Fresamento e Alinhamento em Fresadora",
        nsa: "Profundidade de canal fora do desenho e rebarbas acentuadas.",
        apo: "Esquadrejou o bloco sob orientação nos sentidos de corte concordante/discordante.",
        par: "Fresou dentro das tolerâncias com bom aproveitamento de tempo.",
        aut: "Alinhamento perfeito com relógio comparador e acabamento espelhado.",
      },
    ],
    lessonPlan: [],
  },
  {
    id: "uc-metr",
    unitTitle: "Metrologia Industrial e Controle Geométrico Aplicado",
    acronym: "MINDU",
    semester: "2º SEMESTRE",
    module: "Módulo Específico",
    workload: "120h",
    objective:
      "Inspecionar e controlar peças e conjuntos usinados complexos através de técnicas avançadas de metrologia dimensional, geométrica e rugosimetria.",
    basicCapacities: [
      "Demonstrar pensamento crítico e exatidão nas análises metrológicas.",
      "Zelar pelos padrões de calibração e ambiente controlado do laboratório.",
    ],
    technicalCapacities: [
      "Medir conicidades e ângulos de precisão com barra de seno e blocos-padrão.",
      "Controlar roscas e perfis complexos pelo método dos três arames e projetor de perfil.",
      "Medir dentes e passo de engrenagens cilíndricas com paquímetro de dentes e roletes.",
      "Avaliar rugosidade superficial (Ra, Rz) em rugosímetro digital calibrado.",
      "Inspecionar tolerâncias geométricas de forma (circularidade, cilindricidade) e batimento.",
      "Aplicar conceitos de controle estatístico de processo (CEP).",
    ],
    socioemotionalCapacities: [
      "Comportamento ético na certificação da qualidade de produtos.",
      "Habilidade em relatar não-conformidades de forma construtiva e técnica.",
    ],
    topics: [
      "Tolerâncias geométricas e controle dimensional aplicado a peças usinadas",
      "Medição de conicidades e ângulos com barras de seno e blocos-padrão",
      "Controle de roscas: método dos três arames, calibradores passa/não-passa e projetor de perfil",
      "Medição e controle de engrenagens: paquímetro de dentes e medição sobre roletes",
      "Rugosimetria industrial: parâmetros Ra, Rz, Rmax e cut-off",
      "Controle de forma e posição: circularidade, cilindricidade, batimento radial e axial",
      "Introdução a braços tridimensionais e máquinas de medir por coordenadas (CMM)",
      "Controle estatístico de processo (CEP) e cartas de controle X-barra e R",
    ],
    situationProblem: {
      title: "Situação de Aprendizagem: Laudo de Qualidade e Homologação de Engrenagem Helicoidal",
      contextualization:
        "Um lote de engrenagens usinadas para redutores industriais precisa de laudo metrológico completo antes de ser liberado para tratamento térmico.",
      challenge: [
        "Efetuar a medição sobre dentes e passo base com instrumentos dedicados.",
        "Medir o batimento radial e concentricidade do furo central com relógio apalpador.",
        "Medir a rugosidade dos flancos dos dentes e emitir o certificado de conformidade.",
      ],
      expectedResults: [
        "Relatório técnico de inspeção metrológica completo com curvas e parâmetros medidos.",
        "Parecer conclusivo de liberação do lote para o cliente final.",
      ],
    },
    rubrics: [
      {
        capacity: "Medição de Rugosidade e Parâmetros Ra",
        nsa: "Configuração incorreta do cut-off ou posicionamento inadequado do apalpador.",
        apo: "Operou o rugosímetro mediante confirmação prévia dos parâmetros pelo docente.",
        par: "Executou a medição com autonomia registrando valores coerentes.",
        aut: "Calibração prévia, medição rigorosa e interpretação gráfica avançada do perfil.",
      },
    ],
    lessonPlan: [],
  },
];

const { updatedUnits } = generateSyllabusSchedule(rawProeducadorUnits);
export const proeducadorUnits = updatedUnits;
