const usersModel = require('./users.model');
const md5 = require('md5');
const { sendEmail } = require('../../services/email/sendEmail');

module.exports = { getById, createUser, deleteUser, addInstanceToUser, deleteInstanceToUser, deleteAllProjects};

function getById (req, res) {
    usersModel.findOne({ "username": req.params.id }) 
        .then( response => {
            res.json(response);
        })
        .catch ( err  => {
            res.json(err);
        })
}

function createUser (req, res) {
    const { email, username } = req.body;
    usersModel.findOne({ "username": username }) 
        .then( response => {
            if (response) {
                res.status(400).json( { "error": "Usuario ya creado"} );
            } else {
                const password = md5(req.body.password);
                const user = new usersModel ({ 
                    email, username, password, ec2: []
                });
                const error = user.validateSync();
                if (!error) {
                    sendEmail(username, email).then( () => {
                        user.save();
                        res.json(user);
                    }).catch(err => {
                        console.log("error sending the email: ", err);
                    })
                } else {
                    res.status(400).json(error.errors);
                }    
            }
        })
        .catch ( err  => {
            const password = md5(req.body.password);
            const user = new usersModel ({ 
                email, username, password, ec2: []
            });
            const error = user.validateSync();
            if (!error) {
                user.save();
                res.json(user);
            } else {
                res.status(400).json(error.errors);
            }
        })
}


function deleteUser (req, res) {
    usersModel.findOne( { "username": req.params.id} )
        .remove()
        .then ( response => {
            res.json(response);
        })
        .catch (err => {
            res.status(404).json(err);
        })
    
}

function addInstanceToUser (req, res) {
    usersModel.findOne({ "username": req.params.id })
        .then(response => {
            if (req.body && req.body.ec2) {
                //response.ec2.pop();
                response.ec2.push(req.body.ec2);
            }
            response.save();
            res.json(response);
        })
        .catch(err => {
            res.status(404).json(err);
        })
} 

function deleteInstanceToUser (req, res) {
    usersModel.findOne({ "username": req.params.id })
        .then(response => {
            const instanceId = req.params.instanceId;
            const idx = response.ec2.findIndex(instance => instance.instanceId == instanceId);
            const deletedInstance = response.ec2[idx];
            response.ec2.splice(idx, 1);
            response.save();
            res.json(deletedInstance);
        })
        .catch(err => {
            res.status(404).json(err);
        })
}

function deleteAllProjects (req, res){
    usersModel.findOne({ "username": req.params.id })
        .then(response => {
            console.log(response);
            response.ec2 = [];
            response.save();
            res.code(200).send("proyectos eliminados, usuario:", response);
        })
        .catch(err => {
            res.status(404).json(err);
        })
}


