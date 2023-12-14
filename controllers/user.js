"user strict";

var validator = require("validator");
var bcrypt = require("bcrypt-nodejs");
var fs = require("fs");
var path = require("path");
var User = require("../models/user");
var jwt = require("../services/jwt");

var controller = {
  probando: function (req, res) {
    return res.status(200).send({
      message: "Soy el método probando",
    });
  },
  testeando: function (req, res) {
    return res.status(200).send({
      message: "Soy el metodo TESTEANDO",
    });
  },

  save: function (req, res) {
    // Recoger los parametros de la petición
    var params = req.body;
    try {
      // Validar los datos
      var validate_name = !validator.isEmpty(params.name);
      //var validate_name = params.name;
      var validate_surname = !validator.isEmpty("${params.surname}");
      var validate_email =
        !validator.isEmpty(params.email) && validator.isEmail(params.email);
      var validate_password = !validator.isEmpty(params.password);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar",
      });
    }

    /*console.log(
      validate_name,
      validate_surname,
      validate_email,
      validate_password
    );*/

    if (
      validate_name &&
      validate_surname &&
      validate_email &&
      validate_password
    ) {
      // Crear objeto de usuario
      var user = new User();

      // Asignar valores al usuario
      user.name = params.name;
      user.surname = params.surname;
      user.email = params.email.toLowerCase();
      //user.password
      user.role = "ROLE_USER";
      user.image = null;

      // Comprobar si el usuario existe
      User.findOne({ email: user.email }, (err, issetUser) => {
        if (err) {
          return res.status(500).send({
            message: "Error al comprobar duplicidad de usuario",
          });
        }
        if (!issetUser) {
          // Si no existe,
          // Cifrar la contraseña
          bcrypt.hash(params.password, null, null, (err, hash) => {
            user.password = hash;

            // Guardar usuario
            user.save((err, userStored) => {
              if (err) {
                return res
                  .status(500)
                  .send({ message: "Error al guardar el usuario" });
              }

              if (!userStored) {
                return res
                  .status(400)
                  .send({ message: "El usuario no se ha guardado" });
              }

              // Devolver una respuesta
              return res
                .status(200)
                .send({ status: "success", user: userStored });
            }); // close save

            /*return res.status(500).send({
              message: "El usuario no está registrado",
              user,
            });*/
          }); // close bcrypt
        } else {
          return res.status(500).send({
            message: "El usuario ya está registrado",
          });
        }
      });
    } else {
      return res.status(200).send({
        message:
          "Validación de los datos del usuario incorrecta, inténtalo de nuevo",
      });
    }

    /*return res.status(200).send({
      message: "Registro de usuarios",
    });*/
  },
  login: function (req, res) {
    // Recoger los parametros de la petición
    var params = req.body;

    try {
      // Validar los datos
      var validate_email =
        !validator.isEmpty(params.email) && validator.isEmail(params.email);
      var validate_password = !validator.isEmpty(params.password);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar",
      });
    }

    if (!validate_email || !validate_password) {
      return res.status(200).send({
        message: "Los datos son incorrectos, envíalos bien",
      });
    }
    // Buscar usuarios que coincidan con el email
    User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
      if (err) {
        return res.status(500).send({
          message: "Error al intentar identificarse",
        });
      }

      if (!user) {
        return res.status(403).send({
          message: "El usuario no existe",
        });
      }

      // Si lo encuentra,
      // Comprobar la contraseña (Coincidencia de email y password / bcrypt)
      bcrypt.compare(params.password, user.password, (err, check) => {
        // Si es correcto,

        if (check) {
          // Generar token con jwt devolverlo (más tarde)
          if (params.gettoken == "true") {
            // Devolver los datos
            return res.status(200).send({
              token: jwt.createToken(user),
            });
          } else {
            //Limpiar el objeto
            user.password = undefined;
            user.role = undefined;

            // Devolver los datos
            return res.status(200).send({
              status: "success",
              user,
            });
          }
        } else {
          return res.status(200).send({
            message: "Las credenciales no son correctas",
          });
        }
      });
    });
  },

  update: function (req, res) {
    // Crear middleware para comprobar el jwt token, ponerselo a la ruta

    // Recoger los datos del usuario
    var params = req.body;

    try {
      // Validar datos
      var validate_name = !validator.isEmpty(params.name);
      var validate_surname = !validator.isEmpty("${params.surname}");
      var validate_email =
        !validator.isEmpty(params.email) && validator.isEmail(params.email);
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar",
      });
    }

    // Eliminar propiedades innecesarias
    delete params.password;

    var userId = req.user.sub;

    // Comprobar si el email es único
    if (req.user.email != params.email) {
      User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
        if (err) {
          return res.status(500).send({
            message: "Error al intentar identificarse",
          });
        }

        if (user && user.email == params.email) {
          return res.status(200).send({
            message: "El email no puede ser modificado",
          });
        } else {
          //  Buscar y Actualizar el documento con FindAndUpdate
          User.findOneAndUpdate(
            { _id: userId },
            params,
            { new: true },
            (err, userUpdated) => {
              if (err || !userUpdated) {
                return res.status(500).send({
                  status: "error",
                  message: "Error al actualizar usuario",
                });
              }

              if (!userUpdated) {
                return res.status(500).send({
                  status: "error",
                  message: "No se ha actualizado el usuario",
                });
              }

              return res.status(200).send({
                status: "success",
                user: userUpdated,
              });
            }
          );
        }
      });
    } else {
      //  Buscar y Actualizar el documento con FindAndUpdate
      User.findOneAndUpdate(
        { _id: userId },
        params,
        { new: true },
        (err, userUpdated) => {
          if (err || !userUpdated) {
            return res.status(500).send({
              status: "error",
              message: "Error al actualizar usuario",
            });
          }

          if (!userUpdated) {
            return res.status(500).send({
              status: "error",
              message: "No se ha actualizado el usuario",
            });
          }

          return res.status(200).send({
            status: "success",
            user: userUpdated,
          });
        }
      );
    }
    /*return res.status(200).send({
      message: "Método de Actualización",
      params,
    });*/
  },
  uploadAvatar: function (req, res) {
    // Configurar el modulo multiparty (middleware). routes/user.js

    // Recoger el fichero de la petición
    var file_name = "Avatar no subido...";
    if (!req.files) {
      // Devolver repuesta
      return res.status(400).send({
        status: "error",
        message: "No se ha subido ningun archivo",
      });
    }

    // Conseguir el nombre y la extensión del archivo
    var file_path = req.files.file0.path;
    //console.log(file_path);
    var file_split = file_path.split("\\"); //subcadenas
    var file_name = file_split[2];

    // **Advertencia** en Linux o mac
    //var file_split = file_path.split("/");

    // Extensión del archivo
    var ext_split = file_name.split(".");
    var file_ext = ext_split[1];

    // Comprobar la extensión (sólo imágenes), si no es válida borrar el fichero subido.
    if (
      file_ext != "png" &&
      file_ext != "jpg" &&
      file_ext != "jpeg" &&
      file_ext != "gif"
    ) {
      fs.unlink(file_path, (err) => {
        return res.status(200).send({
          status: "error",
          message: "La extensión del archivo no es válida",
        });
      });
    } else {
      // Sacar el id del usuario identificado
      var userId = req.user.sub;

      // Buscar y actualizar documento de la bd
      User.findOneAndUpdate(
        { _id: userId },
        { image: file_name },
        { new: true },
        (err, userUpdated) => {
          if (err || !userUpdated) {
            // Devolver repuesta
            return res.status(500).send({
              status: "error",
              message: "Error al actualizar el usuario y la imagen",
            });
          }
          // Devolver repuesta
          return res.status(200).send({
            status: "success",
            user: userUpdated,
          });
        }
      );
    }
  },
  avatar: function (req, res) {
    var file_name = req.params.fileName;
    var path_file = "./uploads/users/" + file_name;

    /*fs.exists(path_file, (exists) => {
      if (exists) {
        return res.sendFile(path.resolve(path_file));
      } else {
        return res.status(404).send({
          message: "El archivo no existe",
          file_name,
        });
      }
    });*/

    fs.access(path_file, fs.constants.F_OK, (err) => {
      if (!err) {
        return res.sendFile(path.resolve(path_file));
      } else {
        return res.status(404).send({
          message: "El archivo no existe",
        });
      }
    });
  },
  getUsers: function (req, res) {
    User.find().exec((err, users) => {
      if (err || !users) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios que mostrar",
        });
      }

      return res.status(200).send({
        status: "success",
        users,
      });
    });
  },
  getUser: function (req, res) {
    var userId = req.params.userId;
    User.findById(userId).exec((err, user) => {
      if (err || !user) {
        return res.status(404).send({
          status: "error",
          message: "No existe el usuario",
        });
      }

      return res.status(200).send({
        status: "success",
        user,
      });
    });
  },
};

module.exports = controller;
