-- =============================================================================
-- SALingo — B2/C1/C2 vocabulary content.
-- Additive migration: run this in the Supabase SQL Editor, after vocabulary.sql.
-- Safe to re-run (ON CONFLICT DO NOTHING).
--
-- Per the B2→C2 expansion brief: not just word→translation. B2 focuses on
-- phrasal verbs, collocations and workplace idioms; C1 on precise synonyms
-- and register-aware verbs; C2 on nuanced, idiomatic vocabulary a highly
-- competent speaker would actually use — not obscure words picked only to
-- look hard.
-- =============================================================================

insert into public.vocabulary_words (id, language, term, translation, pronunciation, example, category, level)
values
  -- --------------------------------------------------------------- B2 ---
  ('en-vocab-b2-follow-up', 'en', 'Follow up (on)', 'Dar seguimiento (a)', '/ˈfɒl.oʊ ʌp/', "I'll follow up on your request tomorrow.", 'Work', 'B2'),
  ('en-vocab-b2-get-the-hang-of', 'en', 'Get the hang of', 'Agarrarle el truco a', '/ɡet ðə hæŋ ʌv/', "It took a week, but I finally got the hang of the new system.", 'Education', 'B2'),
  ('en-vocab-b2-bring-up', 'en', 'Bring up', 'Mencionar / sacar un tema', '/brɪŋ ʌp/', "She brought up the delivery issue during the call.", 'Daily Life', 'B2'),
  ('en-vocab-b2-come-across-as', 'en', 'Come across as', 'Dar la impresión de ser', '/kʌm əˈkrɒs æz/', "He came across as very professional on the phone.", 'Work', 'B2'),
  ('en-vocab-b2-trade-off', 'en', 'Trade-off', 'Compensación / disyuntiva', '/ˈtreɪd ɒf/', "There's always a trade-off between speed and accuracy.", 'Business', 'B2'),
  ('en-vocab-b2-bottom-line', 'en', 'Bottom line', 'Punto clave / resultado final', '/ˈbɒt.əm laɪn/', "The bottom line is that customers want a fast resolution.", 'Business', 'B2'),
  ('en-vocab-b2-rule-of-thumb', 'en', 'Rule of thumb', 'Regla general', '/ruːl ʌv θʌm/', "As a rule of thumb, respond within 24 hours.", 'Daily Life', 'B2'),
  ('en-vocab-b2-touch-base', 'en', 'Touch base', 'Ponerse en contacto brevemente', '/tʌtʃ beɪs/', "Let's touch base again on Friday.", 'Work', 'B2'),
  ('en-vocab-b2-outsource', 'en', 'Outsource', 'Subcontratar', '/ˈaʊt.sɔːrs/', "The company outsourced its customer support last year.", 'Business', 'B2'),
  ('en-vocab-b2-overwhelmed', 'en', 'Overwhelmed', 'Abrumado/a', '/ˌoʊ.vɚˈwelmd/', "I felt overwhelmed by the number of tickets.", 'Health', 'B2'),
  ('en-vocab-b2-burnout', 'en', 'Burnout', 'Agotamiento laboral', '/ˈbɝːn.aʊt/', "Taking regular breaks helps prevent burnout.", 'Health', 'B2'),
  ('en-vocab-b2-networking', 'en', 'Networking', 'Establecer contactos profesionales', '/ˈnet.wɝː.kɪŋ/', "She built her career through networking.", 'Business', 'B2'),
  ('en-vocab-b2-feedback-loop', 'en', 'Feedback loop', 'Ciclo de retroalimentación', '/ˈfiːd.bæk luːp/', "We set up a feedback loop with our top clients.", 'Technology', 'B2'),
  ('en-vocab-b2-streamline', 'en', 'Streamline', 'Optimizar / simplificar', '/ˈstriːm.laɪn/', "We streamlined the refund process.", 'Business', 'B2'),
  ('en-vocab-b2-prioritize', 'en', 'Prioritize', 'Priorizar', '/praɪˈɔːr.ə.taɪz/', "You need to prioritize the urgent tickets first.", 'Work', 'B2'),
  ('en-vocab-b2-accommodation', 'en', 'Accommodation', 'Alojamiento', '/əˌkɒm.əˈdeɪ.ʃən/', "The company covers accommodation for business trips.", 'Travel', 'B2'),
  ('en-vocab-b2-itinerary', 'en', 'Itinerary', 'Itinerario', '/aɪˈtɪn.ə.rer.i/', "Here is the itinerary for your trip.", 'Travel', 'B2'),
  ('en-vocab-b2-sustainable', 'en', 'Sustainable', 'Sostenible', '/səˈsteɪ.nə.bəl/', "We're moving toward more sustainable packaging.", 'Nature', 'B2'),

  -- --------------------------------------------------------------- C1 ---
  ('en-vocab-c1-assert', 'en', 'Assert', 'Afirmar (con convicción)', '/əˈsɝːt/', "She asserted that the delay was not their fault.", 'Education', 'C1'),
  ('en-vocab-c1-undermine', 'en', 'Undermine', 'Socavar / debilitar', '/ˌʌn.dɚˈmaɪn/', "Constant interruptions undermine the team's focus.", 'Work', 'C1'),
  ('en-vocab-c1-leverage', 'en', 'Leverage', 'Aprovechar / capitalizar', '/ˈlev.ɚ.ɪdʒ/', "We can leverage customer data to improve service.", 'Business', 'C1'),
  ('en-vocab-c1-discrepancy', 'en', 'Discrepancy', 'Discrepancia', '/dɪˈskrep.ən.si/', "There's a discrepancy between the invoice and the order.", 'Business', 'C1'),
  ('en-vocab-c1-compelling', 'en', 'Compelling', 'Convincente', '/kəmˈpel.ɪŋ/', "He made a compelling case for the refund.", 'Education', 'C1'),
  ('en-vocab-c1-ambiguous', 'en', 'Ambiguous', 'Ambiguo', '/æmˈbɪɡ.ju.əs/', "The instructions were ambiguous, so we asked for clarification.", 'Education', 'C1'),
  ('en-vocab-c1-reconcile', 'en', 'Reconcile', 'Conciliar / resolver una diferencia', '/ˈrek.ən.saɪl/', "We need to reconcile these two accounts.", 'Work', 'C1'),
  ('en-vocab-c1-mitigate', 'en', 'Mitigate', 'Mitigar / reducir', '/ˈmɪt.ə.ɡeɪt/', "We updated the process to mitigate future errors.", 'Business', 'C1'),
  ('en-vocab-c1-scrutinize', 'en', 'Scrutinize', 'Examinar minuciosamente', '/ˈskruː.tə.naɪz/', "The report was scrutinized before it was published.", 'Work', 'C1'),
  ('en-vocab-c1-candid', 'en', 'Candid', 'Franco / sincero', '/ˈkæn.dɪd/', "Thank you for being so candid with your feedback.", 'Daily Life', 'C1'),
  ('en-vocab-c1-nuanced', 'en', 'Nuanced', 'Matizado', '/ˈnuː.ɑːnst/', "Her answer was more nuanced than a simple yes or no.", 'Education', 'C1'),
  ('en-vocab-c1-advocate-for', 'en', 'Advocate for', 'Abogar por', '/ˈæd.və.keɪt fɔːr/', "She advocates for clearer refund policies.", 'Work', 'C1'),
  ('en-vocab-c1-contingency-plan', 'en', 'Contingency plan', 'Plan de contingencia', '/kənˈtɪn.dʒən.si plæn/', "We always have a contingency plan for outages.", 'Business', 'C1'),
  ('en-vocab-c1-resilience', 'en', 'Resilience', 'Resiliencia', '/rɪˈzɪl.jəns/', "Handling difficult calls builds resilience.", 'Health', 'C1'),
  ('en-vocab-c1-discretion', 'en', 'Discretion', 'Discreción / criterio', '/dɪˈskreʃ.ən/', "Use your discretion when offering a discount.", 'Work', 'C1'),

  -- --------------------------------------------------------------- C2 ---
  ('en-vocab-c2-circumvent', 'en', 'Circumvent', 'Eludir / sortear', '/ˌsɝː.kəmˈvent/', "They found a way to circumvent the policy without breaking it.", 'Business', 'C2'),
  ('en-vocab-c2-vindicate', 'en', 'Vindicate', 'Reivindicar / dar la razón a', '/ˈvɪn.də.keɪt/', "The results ultimately vindicated her original decision.", 'Daily Life', 'C2'),
  ('en-vocab-c2-ubiquitous', 'en', 'Ubiquitous', 'Omnipresente', '/juːˈbɪk.wə.təs/', "Chatbots have become ubiquitous in customer service.", 'Technology', 'C2'),
  ('en-vocab-c2-pragmatic', 'en', 'Pragmatic', 'Pragmático', '/præɡˈmæt.ɪk/', "We took a pragmatic approach rather than an ideal one.", 'Work', 'C2'),
  ('en-vocab-c2-tacit', 'en', 'Tacit', 'Tácito / implícito', '/ˈtæs.ɪt/', "There was a tacit agreement not to discuss it further.", 'Business', 'C2'),
  ('en-vocab-c2-disparity', 'en', 'Disparity', 'Disparidad', '/dɪˈspær.ə.ti/', "There's a disparity between what was promised and delivered.", 'Daily Life', 'C2'),
  ('en-vocab-c2-astute', 'en', 'Astute', 'Astuto / perspicaz', '/əˈstuːt/', "That was an astute observation about the client's real concern.", 'Work', 'C2'),
  ('en-vocab-c2-equivocate', 'en', 'Equivocate', 'Ser evasivo / no comprometerse', '/ɪˈkwɪv.ə.keɪt/', "Stop equivocating and give me a straight answer.", 'Daily Life', 'C2'),
  ('en-vocab-c2-palpable', 'en', 'Palpable', 'Palpable / evidente', '/ˈpæl.pə.bəl/', "The tension in the call was palpable.", 'Daily Life', 'C2'),
  ('en-vocab-c2-anecdotal', 'en', 'Anecdotal', 'Anecdótico', '/ˌæn.ɪkˈdoʊ.t̬əl/', "The evidence so far is only anecdotal.", 'Education', 'C2'),
  ('en-vocab-c2-untenable', 'en', 'Untenable', 'Insostenible', '/ʌnˈten.ə.bəl/', "That position became untenable after the audit.", 'Business', 'C2'),
  ('en-vocab-c2-cognizant-of', 'en', 'Cognizant of', 'Consciente de', '/ˈkɑːɡ.nə.zənt ʌv/', "Please be cognizant of the time difference when you call.", 'Work', 'C2')
on conflict (id) do nothing;
