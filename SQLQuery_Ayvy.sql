create database 

USE ayvy;

create table Clientes (
Id INT PRIMARY KEY,
Nome VARCHAR,
Idade INT,
CPF INT,
Telefone VARCHAR(16)
);

SELECT * FROM CLIENTES;

create table Lojistas (
Id INT PRIMARY KEY,
Nome_Lojista VARCHAR,
Idade INT,
CPF INT,
CNPJ INT,
Telefone VARCHAR(16)
);


create table Endereço (
Id INT PRIMARY KEY,
Bairro VARCHAR,
Logradouro VARCHAR,
CEP INT,
Cidade VARCHAR,
UF VARCHAR(2)
);

create table Produto (
Id INT PRIMARY KEY,
Nome_Produo VARCHAR,
Preço DECIMAL (10, 2),
Categoria VARCHAR,
);

create table Pedidos (
Id INT PRIMARY KEY,
Data_pedido DATETIME,
Valor DECIMAL (10, 2),
Andamento VARCHAR NOT NULL,
);

create table Pagamento (
Id INT PRIMARY KEY,
Valor DECIMAL (10,2),
Status_Pagamento VARCHAR NOT NULL,
Tipo_Pagamento VARCHAR NOT NULL,
Data_Pagamento DateTime,
);

Select * from Lojistas;
