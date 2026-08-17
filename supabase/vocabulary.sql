-- =============================================================================
-- Lingo App — Vocabulary content + per-user favorites (Phase 4).
-- Additive migration: run this AFTER schema.sql, in the SQL Editor.
-- Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- vocabulary_words: shared content, not per-user. Mirrors VocabularyWord minus
-- the per-user fields (masteryPercent, isFavorite), which come from
-- review_items / user_word_favorites instead.
-- -----------------------------------------------------------------------------
create table if not exists public.vocabulary_words (
  id text primary key,
  language text not null default 'en',
  term text not null,
  translation text not null,
  pronunciation text not null,
  example text not null,
  category text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'))
);

create index if not exists vocabulary_words_language_idx on public.vocabulary_words (language);
create index if not exists vocabulary_words_category_idx on public.vocabulary_words (category);

alter table public.vocabulary_words enable row level security;

drop policy if exists "vocabulary_words_read_all" on public.vocabulary_words;
create policy "vocabulary_words_read_all" on public.vocabulary_words
  for select using (true);

-- No insert/update/delete policy: content is managed from the SQL editor,
-- never written by the client.

-- -----------------------------------------------------------------------------
-- user_word_favorites: which words a user has starred. Decoupled from
-- review_items so favoriting doesn't require having studied the word yet.
-- -----------------------------------------------------------------------------
create table if not exists public.user_word_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id text not null references public.vocabulary_words (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

alter table public.user_word_favorites enable row level security;

drop policy if exists "user_word_favorites_owner" on public.user_word_favorites;
create policy "user_word_favorites_owner" on public.user_word_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Seed data: ~50 English words across all 10 categories, A1–B1.
-- -----------------------------------------------------------------------------
insert into public.vocabulary_words (id, language, term, translation, pronunciation, example, category, level)
values
  -- Food
  ('en-vocab-apple', 'en', 'Apple', 'Manzana', '/ˈæp.əl/', 'I eat an apple every morning.', 'Food', 'A1'),
  ('en-vocab-bread', 'en', 'Bread', 'Pan', '/bred/', 'She bought fresh bread today.', 'Food', 'A1'),
  ('en-vocab-recipe', 'en', 'Recipe', 'Receta', '/ˈres.ə.pi/', 'This recipe needs three eggs.', 'Food', 'A2'),
  ('en-vocab-flavor', 'en', 'Flavor', 'Sabor', '/ˈfleɪ.vɚ/', 'I love the flavor of fresh basil.', 'Food', 'B1'),
  ('en-vocab-leftovers', 'en', 'Leftovers', 'Sobras', '/ˈleftˌoʊvərz/', 'We had leftovers for dinner.', 'Food', 'B1'),

  -- Travel
  ('en-vocab-airport', 'en', 'Airport', 'Aeropuerto', '/ˈeɚˌpɔːrt/', 'The airport is very busy today.', 'Travel', 'A1'),
  ('en-vocab-luggage', 'en', 'Luggage', 'Equipaje', '/ˈlʌɡ.ɪdʒ/', 'I lost my luggage at the airport.', 'Travel', 'A2'),
  ('en-vocab-itinerary', 'en', 'Itinerary', 'Itinerario', '/aɪˈtɪn.ə.rer.i/', 'Our itinerary includes three cities.', 'Travel', 'B1'),
  ('en-vocab-passport', 'en', 'Passport', 'Pasaporte', '/ˈpæs.pɔːrt/', 'Don''t forget your passport.', 'Travel', 'A1'),
  ('en-vocab-layover', 'en', 'Layover', 'Escala', '/ˈleɪˌoʊ.vɚ/', 'We have a two-hour layover in Madrid.', 'Travel', 'B1'),

  -- Work
  ('en-vocab-deadline', 'en', 'Deadline', 'Fecha límite', '/ˈded.laɪn/', 'The deadline is next Friday.', 'Work', 'A2'),
  ('en-vocab-meeting', 'en', 'Meeting', 'Reunión', '/ˈmiː.tɪŋ/', 'We have a meeting at 10 AM.', 'Work', 'A1'),
  ('en-vocab-promotion', 'en', 'Promotion', 'Ascenso', '/prəˈmoʊ.ʃən/', 'She got a promotion last month.', 'Work', 'B1'),
  ('en-vocab-colleague', 'en', 'Colleague', 'Colega', '/ˈkɑː.liːɡ/', 'My colleague helped me with the report.', 'Work', 'A2'),
  ('en-vocab-workload', 'en', 'Workload', 'Carga de trabajo', '/ˈwɜːrk.loʊd/', 'My workload increased this week.', 'Work', 'B1'),

  -- Technology
  ('en-vocab-improve', 'en', 'Improve', 'Mejorar', '/ɪmˈpruːv/', 'I want to improve my English.', 'Education', 'A2'),
  ('en-vocab-device', 'en', 'Device', 'Dispositivo', '/dɪˈvaɪs/', 'This device needs to be charged.', 'Technology', 'A2'),
  ('en-vocab-software', 'en', 'Software', 'Software', '/ˈsɔːf.wer/', 'We updated the software yesterday.', 'Technology', 'A1'),
  ('en-vocab-upload', 'en', 'Upload', 'Subir (archivo)', '/ʌpˈloʊd/', 'Please upload the file to the server.', 'Technology', 'A2'),
  ('en-vocab-glitch', 'en', 'Glitch', 'Fallo técnico', '/ɡlɪtʃ/', 'There was a glitch in the app.', 'Technology', 'B1'),

  -- Family
  ('en-vocab-sibling', 'en', 'Sibling', 'Hermano/a', '/ˈsɪb.lɪŋ/', 'I have two siblings.', 'Family', 'A2'),
  ('en-vocab-grandparent', 'en', 'Grandparent', 'Abuelo/a', '/ˈɡrænd.per.ənt/', 'My grandparents live nearby.', 'Family', 'A1'),
  ('en-vocab-relative', 'en', 'Relative', 'Pariente', '/ˈrel.ə.tɪv/', 'We invited all our relatives.', 'Family', 'A2'),
  ('en-vocab-household', 'en', 'Household', 'Hogar', '/ˈhaʊs.hoʊld/', 'Every household needs a budget.', 'Family', 'B1'),
  ('en-vocab-upbringing', 'en', 'Upbringing', 'Crianza', '/ˈʌpˌbrɪŋ.ɪŋ/', 'She had a strict upbringing.', 'Family', 'B1'),

  -- Daily Life
  ('en-vocab-routine', 'en', 'Routine', 'Rutina', '/ruːˈtiːn/', 'My morning routine is simple.', 'Daily Life', 'A2'),
  ('en-vocab-errand', 'en', 'Errand', 'Diligencia', '/ˈer.ənd/', 'I have to run some errands today.', 'Daily Life', 'B1'),
  ('en-vocab-chore', 'en', 'Chore', 'Tarea doméstica', '/tʃɔːr/', 'Washing dishes is my least favorite chore.', 'Daily Life', 'A2'),
  ('en-vocab-alarm', 'en', 'Alarm clock', 'Despertador', '/əˈlɑːrm klɑːk/', 'My alarm clock didn''t go off.', 'Daily Life', 'A1'),
  ('en-vocab-commute', 'en', 'Commute', 'Trayecto al trabajo', '/kəˈmjuːt/', 'My commute takes 40 minutes.', 'Daily Life', 'B1'),

  -- Education
  ('en-vocab-lecture', 'en', 'Lecture', 'Clase magistral', '/ˈlek.tʃɚ/', 'The lecture was really interesting.', 'Education', 'A2'),
  ('en-vocab-assignment', 'en', 'Assignment', 'Tarea', '/əˈsaɪn.mənt/', 'I finished my assignment early.', 'Education', 'A2'),
  ('en-vocab-scholarship', 'en', 'Scholarship', 'Beca', '/ˈskɑː.lɚ.ʃɪp/', 'She won a full scholarship.', 'Education', 'B1'),
  ('en-vocab-curriculum', 'en', 'Curriculum', 'Currículo (académico)', '/kəˈrɪk.jə.ləm/', 'The curriculum changed this year.', 'Education', 'B1'),
  ('en-vocab-vocabulary', 'en', 'Vocabulary', 'Vocabulario', '/voʊˈkæb.jə.ler.i/', 'Reading helps you build vocabulary.', 'Education', 'A2'),

  -- Business
  ('en-vocab-revenue', 'en', 'Revenue', 'Ingresos', '/ˈrev.ə.nuː/', 'Revenue grew by 20% this year.', 'Business', 'B1'),
  ('en-vocab-invoice', 'en', 'Invoice', 'Factura', '/ˈɪn.vɔɪs/', 'Please send me the invoice.', 'Business', 'A2'),
  ('en-vocab-negotiate', 'en', 'Negotiate', 'Negociar', '/nɪˈɡoʊ.ʃi.eɪt/', 'We need to negotiate the price.', 'Business', 'B1'),
  ('en-vocab-startup', 'en', 'Startup', 'Empresa emergente', '/ˈstɑːrt.ʌp/', 'She works at a tech startup.', 'Business', 'A2'),
  ('en-vocab-stakeholder', 'en', 'Stakeholder', 'Parte interesada', '/ˈsteɪkˌhoʊl.dɚ/', 'All stakeholders approved the plan.', 'Business', 'B1'),

  -- Health
  ('en-vocab-symptom', 'en', 'Symptom', 'Síntoma', '/ˈsɪmp.təm/', 'What symptoms are you having?', 'Health', 'A2'),
  ('en-vocab-appointment', 'en', 'Appointment', 'Cita (médica)', '/əˈpɔɪnt.mənt/', 'I have a doctor''s appointment.', 'Health', 'A1'),
  ('en-vocab-prescription', 'en', 'Prescription', 'Receta médica', '/prɪˈskrɪp.ʃən/', 'The doctor gave me a prescription.', 'Health', 'B1'),
  ('en-vocab-exhausted', 'en', 'Exhausted', 'Agotado/a', '/ɪɡˈzɔː.stɪd/', 'I felt exhausted after the trip.', 'Health', 'A2'),
  ('en-vocab-recover', 'en', 'Recover', 'Recuperarse', '/rɪˈkʌv.ɚ/', 'It took a week to recover.', 'Health', 'A2'),

  -- Nature
  ('en-vocab-forest', 'en', 'Forest', 'Bosque', '/ˈfɔːr.ɪst/', 'We walked through the forest.', 'Nature', 'A1'),
  ('en-vocab-drought', 'en', 'Drought', 'Sequía', '/draʊt/', 'The region suffered a long drought.', 'Nature', 'B1'),
  ('en-vocab-wildlife', 'en', 'Wildlife', 'Vida silvestre', '/ˈwaɪld.laɪf/', 'The park protects local wildlife.', 'Nature', 'A2'),
  ('en-vocab-breeze', 'en', 'Breeze', 'Brisa', '/briːz/', 'A cool breeze came from the sea.', 'Nature', 'A2'),
  ('en-vocab-sustainable', 'en', 'Sustainable', 'Sostenible', '/səˈsteɪ.nə.bəl/', 'We need more sustainable energy.', 'Nature', 'B1')
on conflict (id) do nothing;
