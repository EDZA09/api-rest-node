"use strict";

var validator = require("validator");
var Topic = require("../models/topic");

var controller = {
  test: function (req, res) {
    return res.status(200).send({
      message: "Hola que tal!!",
    });
  },
  save: function (req, res) {
    // Recoger parámetros por POST
    var params = req.body;

    try {
      // Validar datos
      var validate_title = !validator.isEmpty(params.title);
      var validate_content = !validator.isEmpty(params.content);
      var validate_lang = !validator.isEmpty(params.lang);

      if (validate_title && validate_content && validate_lang) {
        // Crear objeto a guardar
        var topic = new Topic();

        // Asignar Valores
        topic.title = params.title;
        topic.content = params.content;
        topic.code = params.code;
        topic.lang = params.lang;
        topic.user = req.user.sub;

        // Guardar el Topic
        topic.save((err, topicStored) => {
          console.log("topic store", topicStored);

          if (err || !topicStored) {
            return res.status(404).send({
              status: "error",
              message: "El tema no se ha guardado",
            });
          }

          // Devolver una respuesta
          return res.status(200).send({
            status: "success",
            topic: topicStored,
          });
        });
      } else {
        return res.status(500).send({
          message: "Los datos no son válidos",
        });
      }
    } catch (err) {
      // Devolver una respuesta
      return res.status(200).send({
        message: "Faltan datos por enviar",
      });
    }
  },
  getTopics: function (req, res) {
    // Cargar la libreria de paginacion en la clase (MODELO)

    // Recoger la página actual
    if (
      !req.params.page ||
      req.params.page == null ||
      req.params.page == undefined ||
      req.params.page == 0 ||
      req.params.page == "0"
    ) {
      var page = 1;
    } else {
      var page = parseInt(req.params.page);
    }

    // Indicar las opciones de paginacion
    // Objeto de opciones: sort, orden de los items
    // un campo para hacer calculos, cargar un objeto sobre otro
    // Límite de topic por página y cual es la página actual.
    var options = {
      sort: { data: -1 },
      populate: "user",
      limit: 5,
      page: page,
    };

    // Find paginado
    Topic.paginate({}, options, (err, topics) => {
      // Devolver resultado (topics, total de topics, total de páginas)

      if (err) {
        return res.status(500).send({
          status: "error",
          message: "Error al hacer la consulta",
        });
      }

      if (!topics) {
        return res.status(404).send({
          status: "Error",
          message: "No hay topics",
        });
      }

      return res.status(200).send({
        status: "success",
        topics: topics.docs,
        totalDocs: topics.totalDocs,
        totalPages: topics.totalPages,
      });
    });
  },
  getTopicsByUser: function (req, res) {
    // Conseguir el Id del usuario
    var userId = req.params.user;

    // Find con una condicion de usuario
    Topic.find({ user: userId })
      .sort([["date", "descending"]])
      .exec((err, topics) => {
        if (err) {
          return res.status(500).send({
            status: "error",
            message: "Error en la petición",
          });
        }

        if (!topics) {
          return res.status(404).send({
            status: "error",
            message: "No hay temas para mostrar",
          });
        }

        // Devolver resultados
        return res.status(200).send({
          status: "success",
          topics,
        });
      });
  },
  getTopic: function (req, res) {
    // Obetener el id del topic de la url
    var topicId = req.params.id;

    // Find por id del topic
    Topic.findById(topicId)
      .populate("user")
      .populate("comments.user")
      .exec((err, topic) => {
        if (err) {
          return res.status(500).send({
            status: "error",
            message: "Error en la petición",
          });
        }

        if (!topic) {
          return res.status(404).send({
            status: "error",
            message: "No hay tema para mostrar",
          });
        }

        //Devolver un resultado
        return res.status(200).send({
          status: "success",
          topic,
        });
      });
  },
  update: function (req, res) {
    // Recoger el id del topic de la url
    var topicId = req.params.id;

    // Obtener los datos del topic desde el post
    var params = req.body;

    // validar datos
    try {
      var validate_title = !validator.isEmpty(params.title);
      var validate_content = !validator.isEmpty(params.content);
      var validate_lang = !validator.isEmpty(params.lang);

      if (validate_title && validate_content && validate_lang) {
        // Montar un JSON con los datos modificables
        var update = {
          title: params.title,
          content: params.content,
          code: params.code,
          lang: params.lang,
        };
        console.log(update);
        // Usar Find and Update del topic por id y por id del usuario.
        Topic.findOneAndUpdate(
          { _id: topicId, user: req.user.sub },
          update,
          { new: true },
          (err, topicUpdated) => {
            if (err) {
              return res.status(500).send({
                status: "error",
                message: "Error en la petición",
              });
            }
            if (!topicUpdated) {
              return res.status(404).send({
                status: "error",
                message: "No se puedo actualizar el tema",
              });
            }

            // Devolver respuesta
            return res.status(200).send({
              status: "success",
              topicUpdated,
            });
          }
        );
      }
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "ocurrio un error en la validación de datos",
      });
    }
  },
  delete: function (req, res) {
    // Obtener el id del Topic de la url
    var topicId = req.params.id;

    // Ejecutar Find and Delete por el id del Topic y por el id del usuario
    Topic.findOneAndDelete(
      { _id: topicId, user: req.user.sub },
      (err, topicRemoved) => {
        if (err) {
          return res.status(500).send({
            status: "Error",
            message: "Ocurrio un erro en la petición",
          });
        }
        if (!topicRemoved) {
          return res.status(404).send({
            status: "Error",
            message: "No existe el tema",
          });
        }

        return res.status(200).send({
          status: "Success",
          topicRemoved,
        });
      }
    );
  },
  search: function (req, res) {
    //Recoger el string a buscar
    var searchString = req.params.search;

    //Find Or
    Topic.find({
      $or: [
        { title: { $regex: searchString, $options: "i" } },
        { content: { $regex: searchString, $options: "i" } },
        { code: { $regex: searchString, $options: "i" } },
        { lang: { $regex: searchString, $options: "i" } },
      ],
    })
      .populate("user")
      .sort([["date", "descending"]])
      .exec((err, topics) => {
        if (err) {
          return res.status(500).send({
            status: "Error",
            message: "Error en la petición",
          });
        }
        if (!topics || topics == "") {
          return res.status(404).send({
            status: "Error",
            message: "No hay temas disponibles",
          });
        }

        //Retornar un resultado
        return res.status(200).send({
          status: "success",
          topics,
        });
      });
  },
};

module.exports = controller;
