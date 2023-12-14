"use strict";

// Requires
var express = require("express");
var bodyParser = require("body-parser");

// Ejecutar express
var app = express();

// Cargar archivos de rutas
var user_routes = require("./routes/user");
var topic_routes = require("./routes/topic");
var comment_routes = require("./routes/comment");

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS
// Configurar cabeceras y cors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

// Reescribir rutas
app.use("/api", user_routes);
app.use("/api", topic_routes);
app.use("/api", comment_routes);

//Ruta/método de prueba

app.get("/prueba", (req, res) => {
  return res.status(200).send("<h1>Hola mundo soy el backend</h1>");
});

app.post("/prueba", (req, res) => {
  return res.status(200).send({
    name: "Eduar Zamora",
    message: "Hola mundo desde el back-end con Node",
  });
});

// Exportar módulo
///habilita su uso en otros archivos

module.exports = app;
