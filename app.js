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
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const BASE_URL = 'http://localhost:8000';

const { engine } = require('express-handlebars');
const app = express();
const { body, param, query, validationResult } = require('express-validator');
const database = require("./config/database");
const bodyParser = require("body-parser"); // pull information from HTML POST (express4)
app.use(cookieParser());


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
const User = require("./models/user");

Restaurant.initialize(database.url).then(()=>{
    app.listen(port,()=>{
        console.log("app listening on port "+ port);
    })
}).catch(err=>{
    console.log("Error Initializing in mongodb and server",err);
})
//initialize array of posts
const posts = [{username: "admin",title: "webAdmin",},{username: "nadmin",title: "netAdmin",},];
// app.get("/posts", (req, res) => {res.json(posts);});
//function to verify JWT token
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        // return res.status(401).json({ message: 'Token not provided' });
        res.redirect('/');
    }
    jwt.verify(token, process.env.SECRETKEY, (err, decoded) => {
        if (err) {
            // return res.status(401).json({ message: 'Invalid token' });
            res.redirect('/');
        }
        req.userId = decoded.id;
        next();
    });
}

app.get('/', (req, res) => {
    res.render('index', { 
        title: "Welcome to restaurants data",
    });
});

//function to display form to search restaurant
app.get('/api/list_all_restaurants', verifyToken,(req, res) => {
    res.render('search_restaurants', { 
        title: "Search Restaurants",
    });
});

//function to display all restaurants in a view page
app.post('/api/list_all_restaurants', 
        [body('page').isNumeric().exists(),
        body('perPage').isNumeric().exists(),
        body('borough').isString().optional(),],verifyToken,async (req, res) => {

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
    console.log(errors);
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
query('borough').isString().optional(), verifyToken,
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
app.get('/api/restaurants/:id', verifyToken, async (req, res) => {
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
app.get('/api/restaurant_view/:id', verifyToken, async (req, res) => {
    const id = req.params.id;

    try {
        const restaurant = await Restaurant.getRestaurantById(id);
        if (!restaurant) {
            return res.status(400).json({ message: 'Restaurant not found' });
        }
        res.render('restaurant_view', { 
            title: restaurant.name,
            restaurant
        });
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
], verifyToken, async (req, res) => {
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
], verifyToken, async (req, res) => {
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
app.delete('/api/restaurants/:id', verifyToken, async (req, res) => {
    const id = req.params.id;

    try {
        const result = await Restaurant.deleteRestaurantById(id);
        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//user signup
app.get('/api/signup', (req, res) => {
    res.render('signup', { 
        title: "Signup",
    });
});
app.post('/api/signup', [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('username').not().isEmpty().withMessage('Username is required'),
    body('password').not().isEmpty().withMessage('Password is required'),
    body('confirm_password').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }).withMessage('Passwords do not match')], async (req, res) => {
    
    const hashedPassword = bcrypt.hashSync(req.body.password, 8);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newUser = await User.addNewUser({name:req.body.name, username:req.body.username, password:hashedPassword});
        console.log("success");
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
    
});
app.get('/api/login', async (req, res) => {
    res.render('index', { 
        title: "Login",
    });
    
});

app.post('/api/login', async (req, res) => {
    // const hashedPassword = bcrypt.hashSync(req.body.password, 8);
    const user = await User.getUser(req.body.username);
    console.log(user);
    if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    const accessToken = jwt.sign({ id: user.id }, process.env.SECRETKEY, { expiresIn: '1h' });
    // res.setHeader('Authorization', accessToken);
    res.cookie('token', accessToken, { httpOnly: true });
    res.redirect('/api/list_all_restaurants');
});
