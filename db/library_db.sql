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
ADD description varchar(255) NOT NULL;
ALTER TABLE users_db MODIFY password varchar(255);
select * from books;
ALTER TABLE books MODIFY publication SMALLINT not null;
SELECT * FROM books where available='yes';

CREATE TABLE users_db (
id int auto_increment primary key,
email varchar(255) not null unique,
name varchar (50) not null,
password varchar (30)
);
INSERT INTO users_db (email, name, password)
VALUES 
('rocio@gmail.com', 'Rocio Lopez', 'abcdef123'),
('sara@hotmail.com', 'Sara Ruz', '147258abc'),
('francisco@hotmail.com', 'francisco Moreno', '958456dec'),
('jesus@gmail.com', 'jesus Gómez', '963852def');

select * from books_users;
select * from users_db;

ALTER TABLE users_db MODIFY password varchar(255);
DELETE FROM users_db WHERE id=4;

INSERT INTO books_users (books_id, users_id, loan_date, return_date) 
values (7,5, '2024-10-02' , '2024-10-05');

select * from books_users where users_id= 6;











