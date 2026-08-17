import { CallCenterPhrase } from '../../models';

export const MOCK_INTERVIEW_PHRASES: CallCenterPhrase[] = [
  // ----------------------------------------------------------------- Greeting ---
  { id: 'ph-greet-1', category: 'Greeting', phrase: 'Thank you for calling. My name is [Name].', translation: 'Gracias por llamar. Mi nombre es [Nombre].' },
  { id: 'ph-greet-2', category: 'Greeting', phrase: 'How may I assist you today?', translation: '¿Cómo puedo ayudarle hoy?' },
  { id: 'ph-greet-3', category: 'Greeting', phrase: 'Good morning, thank you for contacting us.', translation: 'Buenos días, gracias por contactarnos.' },
  { id: 'ph-greet-4', category: 'Greeting', phrase: "It's a pleasure to speak with you today.", translation: 'Es un placer hablar con usted hoy.' },
  { id: 'ph-greet-5', category: 'Greeting', phrase: 'How can I make your day better?', translation: '¿Cómo puedo mejorar su día?' },

  // ------------------------------------------------------------- Verification ---
  { id: 'ph-verify-1', category: 'Verification', phrase: 'May I have your account number, please?', translation: '¿Me podría dar su número de cuenta, por favor?' },
  { id: 'ph-verify-2', category: 'Verification', phrase: 'Could you please verify your information?', translation: '¿Podría verificar su información, por favor?' },
  { id: 'ph-verify-3', category: 'Verification', phrase: 'Can you confirm your full name and date of birth?', translation: '¿Puede confirmar su nombre completo y fecha de nacimiento?' },
  { id: 'ph-verify-4', category: 'Verification', phrase: 'For security purposes, I need to verify a few details.', translation: 'Por seguridad, necesito verificar algunos datos.' },
  { id: 'ph-verify-5', category: 'Verification', phrase: 'Is this the phone number on file?', translation: '¿Este es el número de teléfono registrado?' },

  // ------------------------------------------------------------- Clarification ---
  { id: 'ph-clarify-1', category: 'Clarification', phrase: 'Could you please explain that again?', translation: '¿Podría explicar eso de nuevo, por favor?' },
  { id: 'ph-clarify-2', category: 'Clarification', phrase: 'Let me make sure I understood correctly.', translation: 'Déjeme asegurarme de haber entendido correctamente.' },
  { id: 'ph-clarify-3', category: 'Clarification', phrase: 'Just to clarify, are you saying that...?', translation: 'Solo para aclarar, ¿está diciendo que...?' },
  { id: 'ph-clarify-4', category: 'Clarification', phrase: 'Could you repeat that, please?', translation: '¿Podría repetir eso, por favor?' },
  { id: 'ph-clarify-5', category: 'Clarification', phrase: 'So, if I understand correctly, you would like...', translation: 'Entonces, si entiendo correctamente, a usted le gustaría...' },

  // --------------------------------------------------------------------- Hold ---
  { id: 'ph-hold-1', category: 'Hold', phrase: 'Would you mind holding for a moment while I check that for you?', translation: '¿Le importaría esperar un momento mientras verifico eso?' },
  { id: 'ph-hold-2', category: 'Hold', phrase: 'Thank you for your patience.', translation: 'Gracias por su paciencia.' },
  { id: 'ph-hold-3', category: 'Hold', phrase: 'I appreciate you holding.', translation: 'Agradezco que haya esperado.' },
  { id: 'ph-hold-4', category: 'Hold', phrase: 'This will only take a minute.', translation: 'Esto solo tomará un minuto.' },
  { id: 'ph-hold-5', category: 'Hold', phrase: 'Thanks for waiting — I found the information.', translation: 'Gracias por esperar — encontré la información.' },

  // ---------------------------------------------------------------- Transfer ---
  { id: 'ph-transfer-1', category: 'Transfer', phrase: "I'll transfer you to the appropriate department.", translation: 'Le transferiré al departamento correspondiente.' },
  { id: 'ph-transfer-2', category: 'Transfer', phrase: 'Please stay on the line while I connect you.', translation: 'Por favor, permanezca en la línea mientras le conecto.' },
  { id: 'ph-transfer-3', category: 'Transfer', phrase: 'I want to make sure you speak to the right person.', translation: 'Quiero asegurarme de que hable con la persona correcta.' },
  { id: 'ph-transfer-4', category: 'Transfer', phrase: 'Let me get someone who can help you further.', translation: 'Déjeme conseguir a alguien que pueda ayudarle más.' },
  { id: 'ph-transfer-5', category: 'Transfer', phrase: "I'm transferring your call now.", translation: 'Estoy transfiriendo su llamada ahora.' },

  // ---------------------------------------------------------------- Closing ---
  { id: 'ph-close-1', category: 'Closing', phrase: 'Is there anything else I can help you with?', translation: '¿Hay algo más en lo que pueda ayudarle?' },
  { id: 'ph-close-2', category: 'Closing', phrase: 'Thank you for contacting us.', translation: 'Gracias por contactarnos.' },
  { id: 'ph-close-3', category: 'Closing', phrase: 'Have a great rest of your day.', translation: 'Que tenga un excelente resto de su día.' },
  { id: 'ph-close-4', category: 'Closing', phrase: "We're happy to have resolved this for you.", translation: 'Nos alegra haber resuelto esto para usted.' },
  { id: 'ph-close-5', category: 'Closing', phrase: "Don't hesitate to reach out if you need anything else.", translation: 'No dude en contactarnos si necesita algo más.' },
];
