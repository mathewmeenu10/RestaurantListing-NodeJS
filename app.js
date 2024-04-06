/********************************************************************************** 
 * ITE5315 – Assignment 4* I declare that this assignment is my own work in accordance 
 * with Humber Academic Policy.* No part of this assignment has been copied manually or 
 * electronically from any other source* (including web sites) or distributed to other students.** 
 * Name: Meenu Mathew
 * Student ID: N01582144
 * Date: 06-04-2024
 * **********************************************************************************/

require("dotenv").config();
const path = require('node:path');
const express = require("express");
const mongoose = require("mongoose");
const appConfig = require("./package.json");

const { engine } = require('express-handlebars');
const app = express();
const { body, param, query, validationResult } = require('express-validator');
const database = require("./config/database");
const bodyParser = require("body-parser"); // pull information from HTML POST (express4)

app.engine('.hbs', engine({
    extname: '.hbs',
    runtimeOptions:{allowProtoPropertiesByDefault:true,
      allowedProtoMethodsByDefault:true},
    helpers: {},
}));
app.set('view engine', '.hbs');

const port = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: "application/vnd.api+json" })); // parse application/vnd.api+json as json

const Handlebars = require('handlebars');

const Restaurant = require("./models/restaurant");

Restaurant.initialize(database.url).then(()=>{
    app.listen(port,()=>{
        console.log("app listening on port "+ port);
    })
}).catch(err=>{
    console.log("Error Initializing in mongodb and server",err);
})

//function to display form to search restaurant
app.get('/api/list_all_restaurants', (req, res) => {
    res.render('search_restaurants', { 
        title: "Search Restaurants",
    });
});

//function to display all restaurants in a view page
app.post('/api/list_all_restaurants', 
        [query('page').isNumeric().exists(),
        query('perPage').isNumeric().exists(),
        query('borough').isString().optional(),],async (req, res) => {

    // let page = req.body.page;
    // let perPage = req.body.borough;
    // let borough = req.body.borough || '';

    // const validationErrors = validationResult({
    //     query: { page, perPage, borough }
    // });

    // if (!validationErrors.isEmpty()) {
    //     throw { status: 400, message: 'Validation failed', errors: validationErrors.array() };
    // }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // return res.status(400).json({ errors: errors.array() });
        return res.status(400).json({ message: 'Bad request' });
    }
    borough = req.query.borough || '';

    try {
        const restaurants = await Restaurant.getAllRestaurants(req.body.page, req.body.perPage, borough);
        res.render('index_restaurants', { 
            title: "Restaurants",
            restaurants
        });
        // res.json(restaurants);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Bad request' });
    }
});

//function to fetch all restaurants data
app.get('/api/restaurants',
query('page').isNumeric().exists(),
query('perPage').isNumeric().exists(),
query('borough').isString().optional(),
async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // return res.status(400).json({ errors: errors.array() });
        return res.status(400).json({ message: 'Bad request' });
    }
    borough = req.query.borough || '';

    try {
        const restaurants = await Restaurant.getAllRestaurants(req.query.page, req.query.perPage, borough);
        res.json(restaurants);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Bad request' });
    }
});

//function to fetch details of a single restaurant
app.get('/api/restaurants/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const restaurant = await Restaurant.getRestaurantById(id);
        if (!restaurant) {
            return res.status(400).json({ message: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//function to add new restaurant using post method
app.post('/api/restaurants', [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('cuisine').not().isEmpty().withMessage('Cuisine is required'),
    body('restaurant_id').not().isEmpty().withMessage('Restaurant ID is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newRes = await Restaurant.addNewRestaurant(req.body);
        res.status(201).json(newRes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//function to update details of a restaurant
app.put('/api/restaurants/:id',  [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('cuisine').not().isEmpty().withMessage('Cuisine is required'),
    body('restaurant_id').not().isEmpty().withMessage('Restaurant ID is required'),
], async (req, res) => {
    const id = req.params.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const updateRes = await Restaurant.updateRestaurantById(req.body, id);
        res.json(updateRes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//function to delete a restaurant
app.delete('/api/restaurants/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const result = await Restaurant.deleteRestaurantById(id);
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
