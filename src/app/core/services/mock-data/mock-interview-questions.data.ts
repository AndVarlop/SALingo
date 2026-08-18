import { InterviewPosition, InterviewQuestion } from '../../models';

const CS = [InterviewPosition.CustomerService, InterviewPosition.CallCenterAgent];
const ALL: InterviewPosition[] = [];

export const MOCK_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ------------------------------------------------------------ About You ---
  {
    id: 'iq-tell-me-about-yourself',
    category: 'about-you',
    positions: ALL,
    question: 'Tell me about yourself.',
    whatInterviewerWants:
      'No quiere tu biografía completa. Quiere un resumen corto y profesional: quién eres, qué haces, y por qué encajas en el puesto.',
    structure: ['Who you are', 'Your experience or background', 'Your skills', "Why you're interested in the position"],
    exampleAnswer:
      "Hi, my name is Andres. I recently finished my studies and I've been working on my English for the past year. I'm a friendly and patient person, and I really enjoy helping people solve problems. I'm interested in this position because I want to start a career in customer service.",
    spanishExplanation:
      'La respuesta es corta (4 frases), va directo a lo importante y termina conectando con el puesto. No memorices esto — cambia los datos por los tuyos.',
    usefulVocabulary: ['background', 'patient', 'career', 'position'],
  },
  {
    id: 'iq-your-experience',
    category: 'about-you',
    positions: ALL,
    question: 'Tell me about your experience.',
    whatInterviewerWants:
      'Quiere saber si tienes experiencia relevante, o si no la tienes, qué otras habilidades puedes ofrecer.',
    structure: ['Where you worked (or studied)', 'What you did there', 'A skill you developed', 'How it applies to this job'],
    exampleAnswer:
      "I worked in a retail store for one year. I helped customers find products and answered their questions. I also learned how to stay calm when customers were upset. I think this experience will help me in a customer service role.",
    spanishExplanation:
      'Si tienes experiencia, cuenta brevemente qué hiciste y qué aprendiste. Si no tienes experiencia laboral, ve a la sección "I have no experience" para aprender cómo responder.',
    usefulVocabulary: ['retail', 'customer', 'stay calm', 'role'],
  },
  {
    id: 'iq-strengths',
    category: 'about-you',
    positions: ALL,
    question: 'What are your strengths?',
    whatInterviewerWants: 'Quiere saber 1-2 cualidades reales tuyas, con un ejemplo corto que las demuestre.',
    structure: ['Name one or two strengths', 'Give a short example', 'Connect it to the job'],
    exampleAnswer:
      "One of my strengths is patience. For example, when I worked with customers, I always listened carefully before answering. I think this is important for customer service.",
    spanishExplanation:
      'No des una lista de 5 cualidades. Elige una o dos, y da un ejemplo corto y real.',
    usefulVocabulary: ['strength', 'patience', 'listen carefully'],
  },
  {
    id: 'iq-weaknesses',
    category: 'about-you',
    positions: ALL,
    question: 'What are your weaknesses?',
    whatInterviewerWants:
      'Quiere ver que eres honesto y que estás trabajando para mejorar — no busca una debilidad "perfecta" disfrazada.',
    structure: ['Name a real weakness', 'Explain what you are doing to improve it'],
    exampleAnswer:
      "Sometimes I feel nervous speaking English on the phone. To improve, I've been practicing every day and I'm getting more confident.",
    spanishExplanation:
      'Es normal tener debilidades. Lo importante es mostrar que estás trabajando para mejorar, no que eres perfecto.',
    usefulVocabulary: ['weakness', 'nervous', 'confident', 'improve'],
  },
  {
    id: 'iq-why-hire-you',
    category: 'about-you',
    positions: ALL,
    question: 'Why should we hire you?',
    whatInterviewerWants: 'Quiere que conectes tus habilidades directamente con lo que la empresa necesita.',
    structure: ['A skill or quality you have', 'Why it matters for this job', 'Your motivation'],
    exampleAnswer:
      "I'm a good listener and I stay calm under pressure. I think these skills are important for helping customers, and I'm very motivated to learn and do a good job.",
    spanishExplanation: 'Enfócate en 1-2 cosas concretas que ofreces, no en una lista larga.',
    usefulVocabulary: ['motivated', 'under pressure', 'listener'],
  },
  {
    id: 'iq-why-this-company',
    category: 'about-you',
    positions: ALL,
    question: 'Why do you want to work with us?',
    whatInterviewerWants: 'Quiere ver que investigaste algo sobre la empresa y que tu interés es genuino.',
    structure: ['Something you know or like about the company', 'What you hope to learn or contribute'],
    exampleAnswer:
      "I heard this company has a good training program and takes care of its employees. I'm looking for a place where I can grow and improve my English at the same time.",
    spanishExplanation:
      'Antes de la entrevista, busca algo sobre la empresa (su reputación, sus valores). Aunque sea algo simple, muestra interés real.',
    usefulVocabulary: ['training', 'grow', 'employees'],
  },
  {
    id: 'iq-five-years',
    category: 'about-you',
    positions: ALL,
    question: 'Where do you see yourself in five years?',
    whatInterviewerWants: 'Quiere ver que tienes metas y que esta empresa puede ser parte de tu camino, no solo un paso temporal.',
    structure: ['A realistic goal', 'How this job helps you get there'],
    exampleAnswer:
      "In five years, I'd like to have more experience in customer service and maybe a leadership role. I think starting here will help me build a strong foundation.",
    spanishExplanation: 'No necesitas un plan perfecto. Solo muestra que tienes dirección y que este trabajo tiene sentido para ti.',
    usefulVocabulary: ['goal', 'leadership', 'foundation'],
  },

  // -------------------------------------------------------------- Call Center ---
  {
    id: 'iq-why-call-center',
    category: 'call-center',
    positions: CS,
    question: 'Why do you want to work in a call center?',
    whatInterviewerWants: 'Quiere ver una razón honesta y positiva, no solo "necesito un trabajo".',
    structure: ['A real reason', 'What you enjoy about helping people'],
    exampleAnswer:
      "I enjoy talking to people and solving problems. I also like that call center jobs let me improve my English every day while helping customers.",
    spanishExplanation: 'Puedes mencionar el idioma, el gusto por ayudar a otros, o el ambiente dinámico. Sé honesto.',
    usefulVocabulary: ['solve problems', 'improve', 'dynamic'],
  },
  {
    id: 'iq-good-customer-service',
    category: 'call-center',
    positions: CS,
    question: 'What does good customer service mean to you?',
    whatInterviewerWants: 'Quiere ver que entiendes que el servicio va más allá de "ser amable" — incluye resolver problemas de verdad.',
    structure: ['Your definition', 'A short example'],
    exampleAnswer:
      "For me, good customer service means listening carefully, being polite, and actually solving the customer's problem — not just being nice.",
    spanishExplanation: 'Menciona escuchar, ser amable, y resolver el problema real. Eso demuestra que entiendes el trabajo.',
    usefulVocabulary: ['polite', 'actually solving', 'listening carefully'],
  },
  {
    id: 'iq-angry-customer',
    category: 'call-center',
    positions: CS,
    question: 'How would you handle an angry customer?',
    whatInterviewerWants: 'Quiere ver que puedes mantener la calma y seguir un proceso, no que te pongas a la defensiva.',
    structure: ['Stay calm', 'Listen and acknowledge their frustration', 'Offer a solution or next step'],
    exampleAnswer:
      "I would stay calm and let the customer explain the problem. I would say something like 'I understand this is frustrating' and then look for a solution.",
    spanishExplanation: 'La clave es: calma, reconocer la frustración del cliente, y buscar una solución — no discutir.',
    usefulVocabulary: ['frustrating', 'acknowledge', 'solution'],
  },
  {
    id: 'iq-deal-with-stress',
    category: 'call-center',
    positions: CS,
    question: 'How do you deal with stress?',
    whatInterviewerWants: 'Quiere saber si tienes alguna estrategia real, no solo "no me estreso".',
    structure: ['A real strategy you use', 'A short example if possible'],
    exampleAnswer:
      "When I feel stressed, I take a deep breath and focus on one task at a time. It helps me stay organized and calm.",
    spanishExplanation: 'Todos sentimos estrés a veces. Muestra que tienes una forma sana de manejarlo.',
    usefulVocabulary: ['deep breath', 'focus', 'organized'],
  },
  {
    id: 'iq-dont-know-answer',
    category: 'call-center',
    positions: CS,
    question: "What would you do if you didn't know the answer to a customer's question?",
    whatInterviewerWants: 'Quiere ver que eres honesto y sabes buscar ayuda, en lugar de inventar una respuesta.',
    structure: ['Be honest with the customer', 'Say you will find out', 'Follow up or ask a supervisor'],
    exampleAnswer:
      "I would tell the customer I'm not sure, but I will find out for them. Then I would check with a supervisor or look it up before giving them an answer.",
    spanishExplanation: 'Nunca inventes una respuesta. Es mejor decir "voy a averiguarlo" y cumplir.',
    usefulVocabulary: ['find out', 'supervisor', 'look it up'],
  },
  {
    id: 'iq-customer-yelling',
    category: 'call-center',
    positions: CS,
    question: 'How would you handle a customer who is yelling at you?',
    whatInterviewerWants: 'Quiere ver control emocional y profesionalismo bajo presión.',
    structure: ['Stay calm and professional', 'Let them express their frustration', 'Redirect to a solution'],
    exampleAnswer:
      "I would stay calm and let them speak without interrupting. Once they finish, I would calmly explain how I can help solve the issue.",
    spanishExplanation: 'No te tomes los gritos como algo personal. Mantén la calma y guía la conversación hacia una solución.',
    usefulVocabulary: ['interrupting', 'calmly', 'issue'],
  },
  {
    id: 'iq-cannot-provide',
    category: 'call-center',
    positions: CS,
    question: 'What would you do if a customer asked for something you cannot provide?',
    whatInterviewerWants: 'Quiere ver que puedes decir "no" de forma profesional y ofrecer alternativas.',
    structure: ['Explain clearly and politely', 'Offer an alternative if possible'],
    exampleAnswer:
      "I would explain politely that I'm not able to do that, and then let them know what other options are available.",
    spanishExplanation: 'En vez de decir "no puedo", usa frases como "let me see what options are available for you".',
    usefulVocabulary: ['options', 'available', 'politely'],
  },
  {
    id: 'iq-prioritize-tasks',
    category: 'call-center',
    positions: ALL,
    question: 'How do you prioritize your tasks?',
    whatInterviewerWants: 'Quiere ver que tienes una forma organizada de manejar varias cosas a la vez.',
    structure: ['A simple method you use', 'An example'],
    exampleAnswer:
      "I usually make a short list and handle the most urgent tasks first. For example, if a customer is waiting, I answer them before doing other work.",
    spanishExplanation: 'No necesitas un sistema complicado — solo muestra que tienes un método simple y lo usas.',
    usefulVocabulary: ['urgent', 'method', 'handle'],
  },
  {
    id: 'iq-comfortable-pressure',
    category: 'call-center',
    positions: ALL,
    question: 'Are you comfortable working under pressure?',
    whatInterviewerWants: 'Quiere una respuesta honesta con un ejemplo, no solo un "sí".',
    structure: ['A direct answer', 'A short example that supports it'],
    exampleAnswer:
      "Yes, I am. In my last job, we had busy days with a lot of customers, and I learned to stay focused and keep helping people one at a time.",
    spanishExplanation: 'Responde "sí" o "estoy aprendiendo a estarlo" y da un ejemplo corto — no solo la palabra sola.',
    usefulVocabulary: ['busy', 'stay focused', 'one at a time'],
  },
  {
    id: 'iq-difficult-customer-general',
    category: 'call-center',
    positions: CS,
    question: 'How would you handle a difficult customer?',
    whatInterviewerWants: 'Similar a "angry customer", pero más general — quiere ver tu proceso mental completo.',
    structure: ['Listen without interrupting', 'Show empathy', 'Offer a clear next step'],
    exampleAnswer:
      "First, I would listen carefully without interrupting. Then I would show that I understand their frustration, and offer a clear solution or next step.",
    spanishExplanation: 'Este patrón (escuchar → mostrar empatía → dar solución) funciona para casi cualquier pregunta sobre clientes difíciles.',
    usefulVocabulary: ['empathy', 'next step', 'clear'],
  },

  // -------------------------------------------------------------- Behavioral ---
  {
    id: 'iq-star-solved-problem',
    category: 'behavioral',
    positions: ALL,
    question: 'Tell me about a time you solved a problem.',
    whatInterviewerWants: 'Quiere un ejemplo real usando el método STAR: Situación, Tarea, Acción, Resultado.',
    structure: ['Situation: set the scene', 'Task: what needed to happen', 'Action: what you did', 'Result: the outcome'],
    exampleAnswer:
      "At my last job, a customer's order was missing an item (Situation). I needed to fix it quickly (Task). I checked the system, found the error, and sent the missing item that day (Action). The customer was happy and thanked me (Result).",
    spanishExplanation: 'Usa el método STAR: cuenta la situación, qué tenías que hacer, qué hiciste, y cómo terminó.',
    usefulVocabulary: ['situation', 'outcome', 'missing item'],
  },
  {
    id: 'iq-star-under-pressure',
    category: 'behavioral',
    positions: ALL,
    question: 'Tell me about a time you worked under pressure.',
    whatInterviewerWants: 'Quiere ver cómo manejas el estrés en una situación real, con resultado positivo.',
    structure: ['Situation', 'Task', 'Action', 'Result'],
    exampleAnswer:
      "During a busy holiday season, we had many customers waiting (Situation). I needed to help them quickly without making mistakes (Task). I stayed focused and worked through my list one by one (Action). We finished the day with no major complaints (Result).",
    spanishExplanation: 'Elige un ejemplo simple de tu vida (trabajo, escuela, voluntariado) y organízalo con STAR.',
    usefulVocabulary: ['holiday season', 'complaints', 'focused'],
  },
  {
    id: 'iq-star-difficult-person',
    category: 'behavioral',
    positions: ALL,
    question: 'Tell me about a time you dealt with a difficult person.',
    whatInterviewerWants: 'Quiere ver madurez emocional y buenas habilidades de comunicación.',
    structure: ['Situation', 'Task', 'Action', 'Result'],
    exampleAnswer:
      "A classmate disagreed with me about a group project (Situation). We needed to find a solution together (Task). I listened to their point of view and we found a compromise (Action). We finished the project successfully (Result).",
    spanishExplanation: 'No tiene que ser un ejemplo laboral — puede ser de la escuela o la vida diaria.',
    usefulVocabulary: ['disagreed', 'compromise', 'point of view'],
  },
  {
    id: 'iq-star-mistake',
    category: 'behavioral',
    positions: ALL,
    question: 'Tell me about a mistake you made.',
    whatInterviewerWants: 'Quiere ver honestidad y que aprendes de tus errores — no busca perfección.',
    structure: ['Situation', 'What went wrong', 'What you learned', 'How you improved'],
    exampleAnswer:
      "I once sent an email with the wrong information. I noticed it quickly and sent a correction right away. Since then, I always double-check before sending anything important.",
    spanishExplanation: 'Elige un error pequeño y real, y enfócate en lo que aprendiste — eso es lo que el entrevistador quiere escuchar.',
    usefulVocabulary: ['correction', 'double-check', 'learned'],
  },
  {
    id: 'iq-star-teamwork',
    category: 'behavioral',
    positions: ALL,
    question: 'Tell me about a time you worked as part of a team.',
    whatInterviewerWants: 'Quiere ver que puedes colaborar y comunicarte bien con otros.',
    structure: ['Situation', 'Your role in the team', 'Action', 'Result'],
    exampleAnswer:
      "In school, my team had to finish a project in one week (Situation). My role was to organize our tasks (Task). I made a simple plan and checked in with everyone daily (Action). We finished on time and got a good grade (Result).",
    spanishExplanation: 'Menciona tu rol específico dentro del equipo, no solo que "trabajaron juntos".',
    usefulVocabulary: ['role', 'organize', 'check in'],
  },
  {
    id: 'iq-star-disagree-policy',
    category: 'behavioral',
    positions: CS,
    question: 'What would you do if you disagreed with a company policy while talking to a customer?',
    whatInterviewerWants: 'Quiere ver que puedes ser profesional incluso cuando no estás de acuerdo con las reglas.',
    structure: ['Follow the policy professionally', 'Explain it clearly to the customer', 'Escalate if needed'],
    exampleAnswer:
      "Even if I disagreed, I would still follow the company policy and explain it clearly to the customer. If they were very unhappy, I would offer to escalate it to a supervisor.",
    spanishExplanation: 'Los entrevistadores buscan que respetes las políticas de la empresa aunque no estés 100% de acuerdo — eso es profesionalismo.',
    usefulVocabulary: ['policy', 'escalate', 'professional'],
  },

  // ---------------------------------------------------- B2 / Advanced ---
  {
    id: 'iq-b2-conflicting-priorities',
    category: 'behavioral',
    positions: CS,
    question: 'How would you handle conflicting priorities during a busy shift?',
    whatInterviewerWants:
      'Quiere ver que puedes organizar tu trabajo bajo presión sin dejar caer nada importante, y que sabes explicar tu razonamiento con claridad.',
    structure: ['Acknowledge the pressure', 'Explain your prioritization criteria', 'Give a concrete example', 'Result'],
    exampleAnswer:
      "During busy periods, I prioritize based on urgency and impact — a customer with a billing error affecting their account comes before a general question, for example (criteria). Last month, I had two calls waiting during a system outage; I handled the account-locked customer first because they couldn't work at all, then followed up with the other (example). Both were resolved within the hour (result).",
    spanishExplanation:
      'No digas simplemente "hago todo rápido" — explica el CRITERIO que usas para decidir qué va primero, y da un ejemplo real.',
    usefulVocabulary: ['prioritize', 'urgency', 'impact', 'follow up'],
  },
  {
    id: 'iq-b2-disagree-manager',
    category: 'behavioral',
    positions: CS,
    question: 'Tell me about a time you disagreed with your manager.',
    whatInterviewerWants:
      'Quiere ver que puedes expresar un desacuerdo de forma profesional y diplomática, no que evites el conflicto ni que seas confrontativo.',
    structure: ['Situation', 'How you raised the disagreement respectfully', 'The outcome', 'What you learned'],
    exampleAnswer:
      "My manager wanted to close a ticket I felt wasn't fully resolved (situation). I asked for a moment to explain my concern and shared the customer's follow-up message as evidence (action). We agreed to keep it open for one more day, and the customer confirmed it was fixed (result). I learned that raising concerns calmly, with evidence, works better than just going along with it.",
    spanishExplanation:
      'La clave es mostrar que planteaste el desacuerdo con respeto y evidencia, no que "tenías razón y tu jefe estaba equivocado".',
    usefulVocabulary: ['raise a concern', 'evidence', 'respectfully'],
  },
  {
    id: 'iq-b2-improve-retention',
    category: 'behavioral',
    positions: CS,
    question: 'How would you improve customer retention in this role?',
    whatInterviewerWants:
      'Quiere ver pensamiento propositivo, no solo reactivo — que puedas pensar más allá de resolver el ticket de hoy.',
    structure: ['A specific idea', 'Why it would help', 'How you would measure success'],
    exampleAnswer:
      "One thing that helps retention is following up after a resolved complaint, not just closing the ticket — a quick check-in a few days later shows the customer we actually care about the outcome, not just closing the case. I'd track it by comparing repeat-complaint rates before and after.",
    spanishExplanation:
      'Da UNA idea concreta y explica por qué funcionaría, en vez de una lista genérica de "buen servicio, ser amable, etc."',
    usefulVocabulary: ['retention', 'follow-up', 'measure success'],
  },
  {
    id: 'iq-c1-failure-learned',
    category: 'behavioral',
    positions: CS,
    question: 'Describe a situation where you failed, and what you learned from it.',
    whatInterviewerWants:
      'Quiere ver honestidad genuina y capacidad de reflexión — NO buscan un "fallo falso" disfrazado de fortaleza (como "trabajo demasiado").',
    structure: ['A real, specific failure', 'What went wrong and why', 'What you changed afterward', 'The lasting lesson'],
    exampleAnswer:
      "Early on, I promised a customer a callback time without checking with the technical team first, and we missed it (failure). I hadn't confirmed availability before committing to a specific time (what went wrong). Since then, I always confirm internally before giving a customer a specific commitment (what changed). It taught me that a vague but reliable promise is better than a precise but broken one.",
    spanishExplanation:
      'Evita fallos "falsos" como "soy demasiado perfeccionista". Cuenta un error real, específico, y qué cambiaste de verdad después.',
    usefulVocabulary: ['commit to', 'confirm', 'reliable'],
  },
  {
    id: 'iq-c1-policy-exception-demand',
    category: 'behavioral',
    positions: CS,
    question: 'What would you do if a customer demanded something against company policy?',
    whatInterviewerWants:
      'Quiere ver que puedes mantener un límite profesional sin ser rígido ni ceder por presión — un equilibrio difícil.',
    structure: ['Acknowledge their request genuinely', 'Explain the limit clearly, without being defensive', 'Offer a real alternative within your authority', 'Escalate if truly necessary'],
    exampleAnswer:
      "I'd start by genuinely acknowledging why they're asking — it's usually a real frustration, not just stubbornness. Then I'd explain clearly why the specific request isn't possible, without sounding defensive. I'd offer whatever alternative is actually within my authority, like a goodwill credit. If they still weren't satisfied and it was a reasonable case, I'd offer to escalate to a supervisor rather than just repeating 'no'.",
    spanishExplanation:
      'La respuesta ideal no es "sigo la política sin más" ni "hago una excepción para que se calme" — es mantener el límite Y ofrecer una alternativa real.',
    usefulVocabulary: ['acknowledge', 'authority', 'escalate', 'goodwill'],
  },
];
