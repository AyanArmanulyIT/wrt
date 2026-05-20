-- === Шаг 1: выполнить в базе postgres (pgAdmin → Query Tool) ===
-- Пароль должен совпадать с DATABASE_PASSWORD в backend/.env (сейчас: 1234)

CREATE USER wrt_user WITH PASSWORD '1234';

CREATE DATABASE wrt_db OWNER wrt_user;

-- Если ошибка "already exists", выполните вместо CREATE:
-- ALTER USER wrt_user WITH PASSWORD '1234';
