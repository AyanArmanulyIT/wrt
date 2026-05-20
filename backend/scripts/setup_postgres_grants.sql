-- === Шаг 2: выполнить, подключившись к базе wrt_db ===

GRANT ALL ON SCHEMA public TO wrt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wrt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wrt_user;
