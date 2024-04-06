require("dotenv").config();
const path = require('node:path');
const express = require("express");
const mongoose = require("mongoose");
const appConfig = require("./package.json");

const { engine } = require('express-handlebars');
const app = express();
const { body, validationResult } = require('express-validator');
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

app.get('/api/list_all_restaurants', (req, res) => {
    res.render('search_restaurants', { 
        title: "Search Restaurants",
    });
});

app.post('/api/list_all_restaurants', async (req, res) => {

    let page = req.body.page;
    let perPage = req.body.borough;
    let borough = req.body.borough || '';

    const validationErrors = validationResult({
        query: { page, perPage, borough }
    });

    if (!validationErrors.isEmpty()) {
        throw { status: 400, message: 'Validation failed', errors: validationErrors.array() };
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // return res.status(400).json({ errors: errors.array() });
        return res.status(400).json({ message: 'Page  not found' });
    }
    // borough = req.query.borough || '';

    try {
        const restaurants = await Restaurant.getAllRestaurants(req.body.page, req.body.perPage, borough);
        res.render('index_restaurants', { 
            title: "Restaurants",
            restaurants
        });
        // res.json(restaurants);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Page  not found' });
    }
});

app.get('/api/restaurants', async (req, res) => {

    let page = req.query.page;
    let perPage = req.query.borough;
    let borough = req.query.borough || '';

    const validationErrors = validationResult({
        query: { page, perPage, borough }
    });

    if (!validationErrors.isEmpty()) {
        throw { status: 400, message: 'Validation failed', errors: validationErrors.array() };
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // return res.status(400).json({ errors: errors.array() });
        return res.status(400).json({ message: 'Page  not found' });
    }
    // borough = req.query.borough || '';

    try {
        const restaurants = await Restaurant.getAllRestaurants(req.query.page, req.query.perPage, borough);
        res.json(restaurants);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Page  not found' });
    }
});

app.get('/api/restaurants/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const restaurant = await Restaurant.getRestaurantById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

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
