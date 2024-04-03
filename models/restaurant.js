// load mongoose since we need it to define a model
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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

async function getAllRestaurants(page, perPage, borough) {
    const skip = (page - 1) * perPage;
    let query = {};
    if (borough) {
        query = { borough: borough };
    }
    return await Restaurant.find(query).skip(skip).limit(perPage).sort({ restaurant_id: 1 });
}

async function getRestaurantById(id) {
    return await Restaurant.findById(id);
}

async function addNewRestaurant(data) {
    return await Restaurant.create(data);
}

async function updateRestaurantById(data, id) {
    return await Restaurant.findByIdAndUpdate(id, data);
}

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

