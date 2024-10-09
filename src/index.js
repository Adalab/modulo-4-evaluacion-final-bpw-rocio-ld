const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt= require('bcrypt');
const jwt= require('jsonwebtoken');
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
  console.log(error)
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

  server.get("/book/available", async (req, res)=>{
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

  //Eliminar por id
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

  //Registrar nuevo usuario

  server.post("/library/register", async (req, res)=>{
  const{email,name,password}= req.body;
  const conex= await getConnectionDB();
  const querySelect= "SELECT * FROM users_db WHERE email=?"
  const [resultSelect]= await conex.query(querySelect, [email])
  if(resultSelect.length===0){
    const passHashed= await bcrypt.hash(password,10);
    const queryInsert= "INSERT INTO users_db (email, name, password) values (?,?,?)";
    const [resultUser]= await conex.query(queryInsert, [email, name, passHashed]);
    res.status(201).json({
      success: true,
      result: resultUser.insertId
    });
    console.log(resultUser);
  }else{
    res.status(200).json({
      success: false,
      error: 'error'
    })
  }
  conex.end();
  });

  //login

  server.post("/library/login", async(req, res)=>{
    const conex= await getConnectionDB();
    const{email,password}=req.body
    const queryEmail= "SELECT * FROM users_db WHERE email=?";
    const [userResult]= await conex.query(queryEmail,[email]);
    conex.end();
    
    if(userResult.length>0){
      const isSamePassword= await bcrypt.compare(password, userResult[0].password)
      
      if (isSamePassword){
        const infoToken={
          id: userResult[0].id,
          email: userResult[0].email,
        };
        
        //generar el token
        const token= jwt.sign(infoToken, process.env.SECRET_KEY, {expiresIn:'1h'});
        res.status(200).json({
          success:true,
          token: token}); 
        
      }else{
        res.status(403).json({
          success:false,
          error: "error"
        });
      }
    }else{
      res.status(404).json({
        success:false,
        message:"usuario no existe"
      });
    }
  });

  //autorizacion
  async function authorize(req, res, next){
    const tokenBearer= req.headers.authorization;
    if(!tokenBearer){
      res.status(400).json({
        success:false,
        message: "No estas autorizado para iniciar sesión"
      })
    }else{
      //const arrayToken= tokenBearer.split(" ")[1];
      const arrayToken= tokenBearer.split(" ");
      const token= arrayToken[1];

      const tokenInfo= jwt.verify(token, process.env.SECRET_KEY);
      if(!tokenInfo.email){
        res.status(400).json({
          success: false,
          message: "No estás autenticado"
        });
      }else{
        const conex= await getConnectionDB();
        const sql= "SELECT * FROM users_db WHERE email=?"
        const [result]= await conex.query(sql, [tokenInfo.email])
        conex.end();
        if(result.length>0){
          req.infoUser= result[0]
          next()
        }else{
          res.status(400).json({
            success: false,
            message: "No autenticado"
          });
          
        };
      };
    };
  };

  server.get("/library/profileUsers", authorize, async(req, res)=>{
    const userInfo= req.infoUser;
    const conex= await getConnectionDB();
    const sql= "SELECT * FROM users_db WHERE id=?"
    const [result]=await conex.query(sql, [userInfo.id]);
    res.json({
      success:true,
      message: result[0],
    });
  });

  //Consultar los libros del usuario 6 que ha iniciado la sesión

  server.get("/library/SelectProfile", authorize, async (req, res)=>{
    const userInfo= req.infoUser;
    const conex= await getConnectionDB();
    const sql= "SELECT * FROM books_users where users_id=?"
    const [resultSelect]= await conex.query(sql, [userInfo.id]);
    res.json({
      success: true,
      message: resultSelect
    });

  });



//manejar errores de rutas que no existen

server.get("*", (req, res)=>{

  res.status(404).sendFile(path.join(__dirname, '../web/not-found.html'));
});
