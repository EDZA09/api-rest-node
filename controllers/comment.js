"strict";

var validator = require("validator");
var Topic = require("../models/topic");
var Comment = require("../models/topic");

var controller = {
  add: function (req, res) {
    // Obtener el id del topic
    var topicId = req.params.topicId;

    // find por id del topic
    Topic.findById(topicId).exec((err, topic) => {
      if (err) {
        return res.status(500).send({
          status: "error",
          message: "error en la petición",
        });
      }
      if (!topic) {
        return res.status(404).send({
          status: "error",
          message: "no existe el tema",
        });
      }
      // Comprobar si el usuario esta logueado y validar datos
      if (req.body.content) {
        try {
          var validate_content = !validator.isEmpty(req.body.content);
        } catch (err) {
          return res.status(200).send({
            message: "no has comentado nada",
          });
        }
        if (validate_content) {
          var comment = {
            user: req.user.sub,
            content: req.body.content,
          };
          // Hacer push en la propiedad comments del objeto resultante
          topic.comments.push(comment);

          // Guardar el Topic Completo
          topic.save((err) => {
            if (err) {
              return res.status(404).send({
                status: "error",
                message: "Error al guardar comentario",
              });
            }

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
          });
        } else {
          return res.status(200).send({
            message: "no se ha validado los datos del comentario",
          });
        }
      }
    });
  },
  update: function (req, res) {
    // Conseguir id del comentario por la url
    var commentId = req.params.commentId;

    //recoger datos y validar
    var params = req.body;
    try {
      var validate_content = !validator.isEmpty(params.content);
    } catch (err) {
      return res.status(200).send({
        message: "No has comentado nada",
      });
    }

    if (validate_content) {
      // Find and update de subdocumento
      Topic.findOneAndUpdate(
        { "comments._id": commentId },
        {
          $set: {
            "comments.$.content": params.content,
          },
        },
        { new: true },
        (err, topicUpdated) => {
          if (err) {
            return res.status(500).send({
              status: "error",
              message: "error en la petición",
            });
          }
          if (!topicUpdated) {
            return res.status(404).send({
              message: "error al guardar el comentario",
            });
          }
          //Devolver los datos
          return res.status(200).send({
            status: "success",
            topicUpdated,
          });
        }
      );
    }
  },
  delete: function (req, res) {
    // Obtener el id del topic y del comentario a borrar
    var topicId = req.params.topicId;
    var commentId = req.params.commentId;

    // Buscar el topic, en base al id del topic recibido por la url
    Topic.findById(topicId).exec((err, topic) => {
      if (err) {
        return res.status(404).send({
          status: "error",
          message: "No existe el tema",
        });
      }
      if (!topic) {
        // retornar un resultado
        return res.status(200).send({
          status: "success",
          topic,
        });
      }

      // Seleccionar el subdocumento (comentario)
      var comment = topic.comments.id(commentId);

      //Borrar el comentario
      if (comment) {
        comment.remove();
        //Guardar el topic
        topic.save((err, topic) => {
          if (err) {
            return res.status(500).send({
              status: "error",
              message: "error al guardar el comentario",
            });
          }

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
        });
      } else {
        return res.status(404).send({
          status: "error",
          message: "No existe el comentario",
        });
      }
    });
  },
};

module.exports = controller;
