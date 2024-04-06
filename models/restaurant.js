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
restaurantSchema = new Schema({
  address: Object,
  borough: String,
  cuisine: String,
  grades: Array,
  name: String,
  restaurant_id: Number,
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

async function initialize(connectionString) {
    try{
        await mongoose.connect(connectionString);
        console.log("MongoDB database connected successfully")
    }
    catch (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err;
    }
}

//function to get all restaurants with pagination
async function getAllRestaurants(page, perPage, borough) {
    const skip = (page - 1) * perPage;
    let query = {};
    if (borough) {
        query = { borough: borough };
    }
    return await Restaurant.find(query).skip(skip).limit(perPage).sort({ restaurant_id: 1 });
}

//function to get a restaurant detail by id
async function getRestaurantById(id) {
    return await Restaurant.findById(id);
}

//function to add new restaurant
async function addNewRestaurant(data) {
    return await Restaurant.create(data);
}

//function to update new restaurant
async function updateRestaurantById(data, id) {
    return await Restaurant.findByIdAndUpdate(id, data);
}

//function to delete a restaurant
async function deleteRestaurantById(id) {
    return await Restaurant.findByIdAndDelete(id);
}

module.exports = {
    initialize,
    getAllRestaurants,
    getRestaurantById,
    addNewRestaurant,
    updateRestaurantById,
    deleteRestaurantById,
};

