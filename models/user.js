/********************************************************************************** 
 * ITE5315 – Assignment 4* I declare that this assignment is my own work in accordance 
 * with Humber Academic Policy.* No part of this assignment has been copied manually or 
 * electronically from any other source* (including web sites) or distributed to other students.** 
 * Name: Meenu Mathew
 * Student ID: N01582144
 * Date: 06-04-2024
 * **********************************************************************************/

// load mongoose since we need it to define a model
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//restaurant schema
userSchema = new Schema({
  name: String,
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);


//function to add new restaurant
async function addNewUser(data) {
    return await User.create(data);
}

async function getUser(username) {
    const user = await User.findOne({username: username,
        });
    return user;
}


module.exports = {
    getUser,
    addNewUser,
};

