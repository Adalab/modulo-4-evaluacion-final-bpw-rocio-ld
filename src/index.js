const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require ("dotenv").config();

//crear servidor
const server= express();
server.use(cors());
server.use(express.json({limit:'50mb'}));

//definir el puerto de conexión
const port= process.env.PORT;
server.listen(port, ()=>{
    console.log(`Server listening at http://localhost:${port}`);
});






async function getConnectionDB() {
  const conex = await mysql.createConnection({
    host: 'localhost',
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
  await conex.connect();
  
  return conex;
}

//Insertar libros
 
server.get('/books/add', async (req, res) => {
 
  const {name,author,category,publication,description,available} = req.body;
  if(!name || !author || !category || !publication || !description || !available){
    res.status (400).json({
      success: false,
      message: "Campos obligatorios"
    });
  }else{
    const conex = await getConnectionDB();
    const sqlAdd= "INSERT INTO books (name, author, category,publication,description,available) values (?,?,?,?,?,?)";
    const [result]= await conex.query(sqlAdd,[name, author, category,publication,description,available]);
    conex.end();
    res.status (200).json({
      success: true,
      id: result.insertId,
    });
  }
 
});

//Solicitar información de todos los libros de la biblioteca

server.get("/books", async (req, res)=>{
  try{
  const conex= await getConnectionDB();
  const sqlSelect= "SELECT * FROM books";
  const [result]= await conex.query(sqlSelect);
  conex.end();
  res.status(200).json({
    info:{count: result.length},
    result: result,
  });
 }catch(error){
  res.status (500).json({
    success:false,
    message: "Error interno del servidor"
  });
 }
  });

  //Buscar receta por id

  server.get("/books/:id", async (req, res)=>{
    const id= req.params.id;
    const conex= await getConnectionDB();
    const sql= "SELECT * FROM books where id=?";
    const [result]= await conex.query(sql, [id]);
    conex.end();
    res.status(200).json({
      success:true,
      result:result[0],

    });
  });

  //Buscar libros que estan disponibles en la biblioteca

  server.get("/books/available", async (req, res)=>{
    try{
    const available= req.query.available;
    const conex= await getConnectionDB();
    const sql= "SELECT * FROM books where available=?";
    const [result]= await conex.query(sql,[available]);
    conex.end();
    res.status(200).json({
      success: true,
      result: result,
    })
  }catch(error){
    res.status (500).json({
      success:false,
      message: "Error en la búsqueda"
    });
  }
  });

  //Actulizar una entrada existente por id (modifique id=1 cambié la categoría)

  server.put("/books/:id", async (req,res)=>{
    const id= req.params.id;
    const {name, author, category,publication,description,available}= req.body;
    const conex= await getConnectionDB();
    const sql= "UPDATE books SET name=?, author=?, category=?, publication=?, description=?, available=? WHERE id=?";
    const [result]= await conex.query(sql,[name, author, category,publication,description,available,id]);
    conex.end();
    res.status(200).json({
      success:true,
      message: "actualizado con éxito"
    });
  });

  server.delete("/books/delete/:id", async (req, res)=>{
    const id= req.params.id;
    const conex= await getConnectionDB();
    const sql= "DELETE FROM books WHERE id=?";
    const [result]= await conex.query(sql, [id])
    if(result.affectedRows >0){
      res.status(200).json({
        success:true,
        message: "Actualizado con éxito"
      });
    }else{
      res.status(500).json({
        success:false,
        message: "No pudo eliminarse"
      });
    }
  });

//manejar errores de rutas que no existen

server.get("*", (req, res)=>{

  res.status(404).sendFile(path.join(__dirname, '../web/not-found.html'));
});