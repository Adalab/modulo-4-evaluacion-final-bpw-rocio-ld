CREATE DATABASE library;
USE library;
CREATE TABLE books (
id int auto_increment primary key,
name varchar(50) not null,
author varchar (50) not null,
category varchar (30),
publication date
);
ALTER TABLE books 
ADD description varchar(255) NOT NULL,
ALTER TABLE books MODIFY available varchar(5);
select * from books;
ALTER TABLE books MODIFY publication SMALLINT not null;




