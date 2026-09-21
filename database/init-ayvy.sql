/* Cria apenas a database ayvy (sem tabelas) */
IF DB_ID(N'ayvy') IS NULL
BEGIN
    CREATE DATABASE ayvy;
END;
GO

ALTER DATABASE ayvy SET MULTI_USER;
GO
