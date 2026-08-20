import { ProgrammaticUnit, CoursePlanSectionData } from "../types/syllabus";
import { generateSyllabusSchedule } from "../utils/scheduleGenerator";

export const rawProeducadorUnits: ProgrammaticUnit[] = [
  {
    id: "uc-fusi",
    unitTitle: "Fundamentos da Usinagem",
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
    unitTitle: "Leitura e Interpretação de Desenho Técnico",
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
    unitTitle: "Controle Dimensional",
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
    unitTitle: "Matemática Aplicada",
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
    unitTitle: "Ciências dos Materiais",
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
    unitTitle: "Processos de Usinagem Convencional",
    acronym: "PRUSC",
    semester: "2º SEMESTRE",
    module: "Módulo Específico",
    workload: "160h",
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
    unitTitle: "Metrologia Industrial",
    acronym: "MINDU",
    semester: "2º SEMESTRE",
    module: "Módulo Específico",
    workload: "80h",
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

export const defaultCoursePlanData: CoursePlanSectionData = {
  introducao: {
    justificativa:
      "O Curso de Aprendizagem Industrial de Mecânico de Usinagem Convencional atende diretamente às demandas legais e industriais do Sistema Indústria no Estado de São Paulo, em consonância com a Lei Federal nº 10.097/2000 (Lei da Aprendizagem) e o Decreto Federal nº 9.579/2018. A formação capacita aprendizes para atuarem em processos produtivos de usinagem com segurança, precisão e respeito aos preceitos ESG.",
    estudoDemanda:
      "A ocupação Mecânico de Usinagem Convencional corresponde ao CBO 7212-15 (Operador de máquinas-ferramentas convencionais), inserida na família ocupacional Preparadores e Operadores de Máquinas-Ferramenta Convencionais.\n\nSegundo dados da RAIS, o Estado de São Paulo concentra 99.567 vínculos trabalhistas formais nessa família ocupacional, o que representa expressivos 51,51% de todos os postos de trabalho da categoria no Brasil.\n\nPrincipais setores empregadores no Estado:\n• Cadeia Automobilística: 39% dos vínculos;\n• Fabricação de Máquinas e Equipamentos: 17%;\n• Fabricação de Produtos de Metal: 16%;\n• Borracha, Plásticos, Metalurgia e Manutenção: 28%.\n\nDistribuição Geográfica em SP:\n• Grande São Paulo: 41,9%\n• Região Administrativa de Campinas: 32,9%\n• Sorocaba: 8,7%\n• São José dos Campos: 4,7%\n• Demais regiões do interior (Ribeirão Preto, Bauru, Araraquara): 11,8%.",
    objetivos:
      "Desenvolver competências relativas a usinar peças em máquinas de manufatura convencional da indústria metalmecânica de acordo com os conceitos de ESG, especificações, procedimentos, e normas técnicas, ambientais, de qualidade e de saúde e segurança no trabalho.",
    legislacao:
      "Curso elaborado de acordo com a Resolução CNE/CP nº 2/24, Resolução CNE/CP nº 1/21, Lei Federal nº 9.394/96 (LDB), Decreto Federal nº 5.154/04, Lei Federal nº 12.513/2011, Portaria MTE nº 3.872/2023 e Catálogo Nacional de Programas de Aprendizagem Profissional (CONAP).",
  },
  perfilProfissional: {
    cbo: "7212-15 Operador de máquinas-ferramenta convencionais",
    area: "Metalmecânica",
    segmento: "Fabricação Mecânica",
    nivel: "Formação Inicial e Continuada (Nível de Qualificação 2)",
    competenciaGeral:
      "Usinar peças em máquinas de manufatura convencional da indústria metalmecânica de acordo com os conceitos de ESG, especificações, procedimentos, e normas técnicas, ambientais, de qualidade e de saúde e segurança no trabalho.",
    funcoes: [
      {
        titulo: "Função 1: Usinar peças em máquinas de manufatura convencional da indústria metalmecânica",
        subfuncoes: [
          {
            codigo: "1.1",
            nome: "Operar torno convencional",
            padroesDesempenho: [
              "1.1.1. Definindo os parâmetros e os processos de usinagem em tornos convencionais de acordo com as especificações técnicas.",
              "1.1.2. Torneando peças de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.1.3. Controlando a qualidade das peças usinadas em máquinas convencionais, visualmente e por meio de instrumentos de acordo com as especificações técnicas.",
              "1.1.4. Aplicando os procedimentos de refrigeração nos processos de usinagem.",
            ],
          },
          {
            codigo: "1.2",
            nome: "Operar retíficas convencionais",
            padroesDesempenho: [
              "1.2.1. Definindo os parâmetros e os processos de usinagem em retíficas convencionais, de acordo com as especificações técnicas.",
              "1.2.2. Realizando o balanceamento do rebolo de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.2.3. Retificando peças cilíndricas de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.2.4. Retificando peças prismáticas de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.2.5. Controlando a qualidade das peças usinadas em máquinas convencionais, visualmente e por meio de instrumentos de acordo com as especificações técnicas.",
              "1.2.6. Aplicando os procedimentos de refrigeração nos processos de usinagem.",
            ],
          },
          {
            codigo: "1.3",
            nome: "Operar fresadora convencional",
            padroesDesempenho: [
              "1.3.1. Definindo os parâmetros e os processos de usinagem em fresadoras convencionais de acordo com as especificações técnicas.",
              "1.3.2. Fresando peças de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.3.3. Controlando a qualidade das peças usinadas em máquinas convencionais, visualmente e por meio de instrumentos de acordo com as especificações técnicas.",
              "1.3.4. Aplicando os procedimentos de refrigeração nos processos de usinagem.",
            ],
          },
          {
            codigo: "1.4",
            nome: "Ajustar peças e conjuntos",
            padroesDesempenho: [
              "1.4.1. Furando peças por meio de furadeiras de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.4.2. Roscando peças manualmente em bancada de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.4.3. Serrando peças por meio de máquinas convencionais de acordo com as especificações, normas técnicas e de saúde e segurança no trabalho.",
              "1.4.4. Realizando operações de ajustagem em peças e montagem de conjuntos por meio de ferramentas manuais de acordo com as especificações e normas técnicas e de saúde e segurança no trabalho.",
              "1.4.5. Controlando a qualidade das peças usinadas em máquinas convencionais, visualmente e por meio de instrumentos de acordo com as especificações técnicas.",
            ],
          },
          {
            codigo: "1.5",
            nome: "Controlar a qualidade do produto",
            padroesDesempenho: [
              "1.5.1. Medindo peças por meio de instrumentos da ordem direta (paquímetro, micrômetro, goniômetro, rugosímetro, calibrador linear height).",
              "1.5.2. Medindo peças por meio de instrumentos da ordem indireta (comparador de diâmetro interno, calibrador passa/não-passa, blocos-padrão, régua e mesa de seno).",
              "1.5.3. Medindo a dureza de materiais de acordo com o desenho e as normas.",
              "1.5.4. Medindo perfil de peças por meio de imagens projetadas de acordo com desenho (projetor de perfil diascópico e episcópico).",
              "1.5.5. Medindo tridimensionalmente peças de acordo com o desenho e modelo (MMC manual e CNC).",
              "1.5.6. Medindo peças digitalmente por meio de sistemas de medição por visão óptica de acordo com o modelo.",
              "1.5.7. Medindo peças com braço de medição portátil 3D de acordo com o desenho.",
              "1.5.8. Testando a funcionalidade de peças e conjuntos de acordo com o projeto.",
            ],
          },
        ],
      },
    ],
    meios: {
      maquinasEquipamentos: [
        "Máquinas operatrizes convencionais (Tornos universais, Fresadoras universais e ferramenteiras, Retíficas cilíndricas e planas tangenciais)",
        "Furadeiras de bancada, de coluna e radiais",
        "Serras de fita horizontal e vertical",
        "Máquinas de eletroerosão a fio e penetração, Centros de Usinagem CNC multieixos",
        "Sistemas pneumáticos, hidráulicos, eletropneumáticos e eletro-hidráulicos",
        "Máquina de medir por coordenadas (MMC), Braço tridimensional portátil, Projetores de perfil e Rugosímetros",
        "Sistemas de fixação rápida Zero Point, mesas magnéticas, mesas de seno e morsas de alta precisão",
        "Aparelho divisor universal e mesas giratórias graduadas",
      ],
      instrumentos: [
        "Paquímetros universais, analógicos, digitais e para dentes de engrenagens",
        "Micrômetros externos, internos, de profundidade e para medição de roscas",
        "Goniômetros e transferidores de ângulo de precisão",
        "Relógios comparadores e apalpadores milesimais e centesimais",
        "Blocos-padrão classe 0 e 1, calibres tampão e anel passa/não-passa, calibres de folga e de raio",
        "Calibrador traçador de altura (Linear Height)",
        "Durômetros industriais (Rockwell, Brinell, Vickers)",
      ],
      ferramentas: [
        "Ferramentas manuais de ajustagem: limas bastardas e murças, machos, cossinetes, desandadores, raspadores, punções e riscadores",
        "Ferramentas de corte em aço rápido (HSS) e metal duro (Insertos intercambiáveis ISO)",
        "Cabeçotes faceadores, fresas de topo cilíndricas e esféricas, alargadores mecânicos",
        "Rebolos abrasivos convencionais (óxido de alumínio e carbeto de silício) e dressadores diamantados",
      ],
      softwares: [
        "Softwares CAD/CAM/CAE para modelagem e manufatura mecânica",
        "Softwares dedicados à medição tridimensional e controle dimensional computadorizado",
        "Aplicativos para controle produtivo, folhas de processo digitais e IA aplicada à manutenção e manufatura",
      ],
    },
    condicoesTrabalho: {
      ambientes: [
        "Oficinas mecânicas industriais, laboratórios de metrologia dimensional, ferramentarias e células de usinagem.",
        "Trabalho em rodízio de turnos com supervisão ocasional, postura em pé e exposição a ruído e vibrações controladas.",
      ],
      equipamentosSeguranca: [
        "EPI (NR-06): Óculos de segurança com proteção lateral, calçado com biqueira de proteção, protetor auricular tipo concha ou plug, jaleco/avental e luvas apropriadas em operações permitidas.",
        "EPC (NR-09 e NR-12): Coifas de proteção em placas giratórias e rebolos, barreiras físicas intertravadas em máquinas operatrizes, paradas de emergência, sinalização de segurança e sistemas de exaustão e contenção de fluidos de corte.",
      ],
      riscos: [
        "Físicos: Ruído contínuo, vibração e projeção de partículas/cavacos incandescentes.",
        "Mecânicos: Prensagem, esmagamento, cortes por lâminas/ferramentas e aprisionamento em eixos giratórios.",
        "Químicos: Contato e inalação de vapores de fluidos de corte sintéticos, semissintéticos e óleos integrais (NR-20 e NR-15).",
        "Ergonômicos: Movimentos repetitivos, postura ortostática prolongada e manuseio de matérias-primas pesadas.",
      ],
      areasAtuacao: [
        "Indústria automobilística, autopeças, aeronáutica, metalúrgica, máquinas e implementos agrícolas, petróleo e gás, naval, ferramentarias e oficinas de usinagem de precisão.",
      ],
    },
    evolucaoQualificacao: [
      "Indústria 5.0: Digitalização de processos de usinagem com foco em sustentabilidade e integração humana.",
      "Inteligência Artificial (IA): Otimização preditiva de corte, monitoramento de desgaste de insertos e manutenção inteligente.",
      "Gêmeos Digitais (Digital Twins) e Manufatura Híbrida (Usinagem subtrativa integrada à manufatura aditiva 3D metálica).",
      "Internet Industrial das Coisas (IIoT) e sensores inteligentes para controle de vibração e temperatura em tempo real.",
      "Tecnologias Limpas (Clean Tech) com reciclagem de cavacos e minimização de efluentes refrigerantes.",
    ],
    competenciasSocioemocionais: [
      "Trabalho em equipe: Cooperação ativa, comunicação assertiva e cumprimento de metas compartilhadas.",
      "Pensamento analítico: Atenção rigorosa a detalhes micrométricos, raciocínio lógico e visão sistêmica dos processos de manufatura.",
      "Resiliência emocional: Tolerância à frustração, flexibilidade diante de desafios mecânicos e busca contínua de melhoria técnica.",
      "Autonomia e Autogestão: Planejamento minucioso do posto de trabalho, zelo com equipamentos e senso de responsabilidade profissional.",
      "Criatividade e Inovação: Resolução ágil de problemas complexos de usinagem e otimização de parâmetros de corte.",
      "Inteligência Emocional: Postura ética, empatia e autocontrole nas relações interpessoais fabris.",
    ],
  },
  requisitosAcesso: {
    escolaridade:
      "Ter concluído o Ensino Fundamental. No caso de pessoas com deficiência (PcD), conforme legislação específica, o requisito considera as habilidades e competências para profissionalização.",
    idade:
      "Idade mínima de 14 anos completos e idade máxima que permita a conclusão do curso antes de completar 24 anos. Não se aplica idade máxima a pessoas com deficiência.",
    processoSeletivo:
      "Aprovação em Processo Seletivo Oficial do SENAI-SP com prova classificatória ou contrato de aprendizagem firmado com empresa contribuinte do Sistema Indústria.",
    observacoesConap:
      "Conforme o Catálogo Nacional de Programas de Aprendizagem Profissional (CONAP), programas realizados por menores de 18 anos são conduzidos em ambientes laboratoriais e oficinas protegidas do SENAI-SP, elidindo riscos de insalubridade e periculosidade através de parecer técnico circunstanciado.",
    condicoesAcessibilidade:
      "Garantia de acessibilidade arquitetônica, pedagógica e atitudinal (Lei nº 13.146/2015 e Decreto nº 3.298/2009), com adequações nos postos de trabalho das máquinas operatrizes e suporte psicossocial aos estudantes.",
  },
  desenvolvimentoMetodologico: {
    itinerarioFormativo: [
      {
        modulo: "Módulo Básico (1º Termo)",
        cargaHoraria: "160 horas",
        unidades: [
          { nome: "Leitura e Interpretação de Desenho Técnico (LIDT)", cargaHoraria: "40 horas" },
          { nome: "Ciências dos Materiais (CIEMA)", cargaHoraria: "40 horas" },
          { nome: "Controle Dimensional (CRD)", cargaHoraria: "40 horas" },
          { nome: "Matemática Aplicada (MAP)", cargaHoraria: "40 horas" },
        ],
      },
      {
        modulo: "Módulo Introdutório (1º Termo)",
        cargaHoraria: "240 horas",
        unidades: [
          { nome: "Fundamentos da Usinagem (FUSI) — Torneamento, Fresamento, Ajustagem e Furação", cargaHoraria: "240 horas" },
        ],
      },
      {
        modulo: "Módulo Específico (2º Termo)",
        cargaHoraria: "400 horas",
        unidades: [
          { nome: "Processos de Usinagem Convencional (PRUSC) — Tornos, Fresadoras, Retíficas e Montagem", cargaHoraria: "160 horas" },
          { nome: "Metrologia Industrial (MINDU) — Medição 3D, Projetor de Perfil e Rugosimetria", cargaHoraria: "80 horas" },
          { nome: "Desenvolvimento Profissional e Comunicação (Transversal)", cargaHoraria: "80 horas" },
          { nome: "Letramento Digital (Transversal)", cargaHoraria: "80 horas" },
        ],
      },
    ],
    metodologiaTexto:
      "O curso é desenvolvido com base na Metodologia SENAI de Educação Profissional (MSEP), fundamentada na resolução de Situações de Aprendizagem (S.A.) desafiadoras e no desenvolvimento integral de competências técnicas e socioemocionais.\n\nDiretrizes pedagógicas em oficina:\n• Apoio integral da Série Metódica Ocupacional (SMO);\n• Elaboração prévia da folha de processo/plano de trabalho (estimativa de 2h por tarefa);\n• Demonstração prática detalhada pelo docente (média de 20 min por operação);\n• Prática supervisionada individual e em equipe com tempos analíticos de usinagem;\n• Encerramento diário com 20 min dedicados à limpeza, conservação e organização 5S da oficina e máquinas.",
    praticaProfissionalEmpresa:
      "Cursos de Aprendizagem Industrial presenciais com fase escolar de 800 horas no SENAI prescindem de PPE obrigatória para amparar o contrato de aprendizagem (art. 65 do Decreto Federal nº 9.579/2018), configurando-se em ambiente simulado e protegido. Quando a empresa ofertar PPE suplementar, esta deve ser registrada em 'Guia de Aprendizagem' articulado pedagogicamente com o plano escolar do SENAI.",
    instalacoesEquipamentos:
      "Oficinas mecânicas homologadas pelo Sistema de Gestão de Serviços Educacionais e Tecnológicos (SGSET) do SENAI-SP, dotadas de tornos mecânicos universais, fresadoras ferramenteiras, retíficas planas e cilíndricas, serra fita, bancadas de ajustagem completas, laboratório de metrologia climatizado a 20ºC com MMC 3D e projetores ópticos, além de laboratório de informática com computadores individuais e biblioteca técnica.",
    perfilDocentes:
      "Profissionais com formação técnica ou superior na área metalmecânica/mecânica, preferencialmente licenciados com especialização na Metodologia SENAI de Educação Profissional ou instrutores qualificados de prática profissional de acordo com as diretrizes do SENAI-SP.",
    criteriosAvaliacao:
      "Avaliação formativa e contínua baseada em competências e padrões de desempenho do Comitê Técnico Setorial. Os instrumentos incluem fichas de autoinspeção, dossiês técnicos de Situações de Aprendizagem, relatórios dimensionais de peças usinadas e rubricas avaliativas de competências socioemocionais e de segurança (NR-12).",
  },
  persona: {
    nome: "Gabriel Santos — O Jovem Aprendiz da Indústria Mecânica",
    idade: "17 anos",
    escolaridade: "Cursando o 2º ano do Ensino Médio, integrado ao Curso de Aprendizagem Industrial SENAI",
    perfil:
      "Jovem focado, curioso e altamente motivado pelo universo da mecânica de precisão e da tecnologia industrial. Valoriza a prática em oficina e tem grande facilidade para raciocínio lógico-espacial e leitura de desenhos técnicos.",
    motivacoes: [
      "Conquistar autonomia financeira e uma oportunidade efetiva de trabalho como operador ou preparador de máquinas em uma grande indústria da região.",
      "Obter a certificação oficial do SENAI-SP, reconhecida nacionalmente por sua excelência técnica.",
      "Compreender a fundo como transformar blocos brutos de aço e alumínio em peças complexas com tolerâncias micrométricas.",
      "Construir uma trilha sólida de carreira que avance para o Curso Técnico em Mecânica ou Mecatrônica e, futuramente, para a Engenharia Mecânica.",
    ],
    desafios: [
      "Desenvolver paciência e tolerância à frustração quando uma peça não atinge as dimensões de tolerância H7/g6 de primeira tentativa.",
      "Internalizar o hábito rigoroso do uso contínuo de todos os EPIs e cumprimento estrito dos procedimentos da NR-12 em máquinas rotativas.",
      "Conciliar a rotina intensa de estudos escolares do Ensino Médio com as 4 horas diárias de oficina e prática no SENAI.",
    ],
    rotina:
      "Chega pontualmente às 07h30, realiza o diálogo de segurança (DDS), veste todos os EPIs, prepara os instrumentos de metrologia calibrados (paquímetro e micrômetro), estuda o desenho técnico e a folha de processos, calcula rotações (RPM) e velocidades de corte, opera torno ou fresadora com foco total e realiza a autoinspeção dimensional antes de entregar a peça ao professor.",
    habilidadesTecnicas: [
      "Operação de tornos convencionais e fresadoras universais",
      "Leitura e interpretação de desenhos mecânicos em 1º diedro e tolerâncias geométricas ISO",
      "Controle dimensional de precisão com paquímetros, micrômetros milesimais e relógios comparadores",
      "Ajustagem mecânica manual (limagem plana e angular, traçagem com graminho e roscamento manual)",
      "Aplicação de normas de segurança NR-12, NR-06 e conceitos ESG de descarte correto de cavacos e óleos",
    ],
    habilidadesSocioemocionais: [
      "Atenção minuciosa aos detalhes e tolerância dimensional",
      "Trabalho em equipe e respeito aos colegas na divisão dos postos de trabalho",
      "Autonomia e responsabilidade na preservação de máquinas e ferramentas",
      "Resiliência e capacidade analítica na solução de problemas de usinagem",
    ],
    trilhaFutura: [
      "Aprendiz Industrial em Mecânico de Usinagem Convencional (800h)",
      "Mecânico / Preparador de Máquinas Operatrizes Convencionais e CNC",
      "Técnico em Fabricação Mecânica / Técnico em Mecatrônica",
      "Graduação em Engenharia de Produção / Engenharia Mecânica",
    ],
  },
};

