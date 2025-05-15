-- Sample notification data for all users
-- Using NULL for user_id makes notifications visible to all users

INSERT INTO notifications (user_id, type, content, read, created_at) VALUES
  -- Global notifications (visible to all users)
  (NULL, 'new_anime', 'Шинэ аниме нэмэгдлээ: Death Note аниме манай системд нэмэгдлээ', false, NOW()),
  (NULL, 'update', 'Таны дуртай аниме шинэчлэгдлээ: Attack on Titan-ны шинэ анги гарлаа', false, NOW() - INTERVAL '1 day'),
  (NULL, 'system', 'Шинэ сэтгэгдэл: Системийн шинэчлэлт хийгдлээ', false, NOW() - INTERVAL '2 days'),
  (NULL, 'system', 'Системийн мэдэгдэл: Манай систем засвартай байх тул түр хүлээнэ үү', false, NOW() - INTERVAL '3 days'),
  (NULL, 'system', 'Шинэ функц: Mood Matcher системд нэмэгдлээ', false, NOW() - INTERVAL '4 days'),
  (NULL, 'new_anime', 'Шинэ аниме нэмэгдлээ: Jujutsu Kaisen аниме манай системд нэмэгдлээ', false, NOW() - INTERVAL '5 days'),
  (NULL, 'update', 'Таны дуртай аниме шинэчлэгдлээ: Demon Slayer-ны шинэ анги гарлаа', false, NOW() - INTERVAL '6 days'),
  (NULL, 'mood_matcher', 'Mood Matcher: Шинэ санал болгосон аниме нэмэгдлээ', false, NOW() - INTERVAL '7 days');

-- Types of notifications:
-- new_anime: Шинэ аниме нэмэгдсэн үед
-- update: Аниме шинэчлэгдсэн үед
-- comment: Сэтгэгдэл, хариулт бичигдсэн үед
-- system: Системийн мэдэгдэл
-- mood_matcher: Mood Matcher-тэй холбоотой мэдэгдэл
