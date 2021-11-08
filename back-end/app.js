const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs'); // needed for reading debug json data outside of mockarro -DC @ 6:11 PM Nov. 7th, 2021
const multer = require('multer')
const axios = require('axios')
require('dotenv').config({silent: true})
const morgan = require('morgan')
const cors = require('cors')

// json database for articles -DC

app.use(morgan('dev'))
app.use(cors()) //enables CORS for _all_ requests 

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/static', express.static('public')) // only need this when we add static files: dead code for now

app.get('/articles_data/:id', (req,res,next) => {
    if(process.env.DEBUG){
        res.json({
            type: 'article',
            id: req.params.id,
            title: 'Debugging Title',
            user: 'johnsmith1',
            rating: 5.78,
            lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        })
    }else{
        //use global mockaroo key and return mock data
        axios.get(`https://my.api.mockaroo.com/page_data.json?key=${process.env.API_KEY}&type=article&id=${req.params.id}`) //random mock data
        .then(response => res.json(response.data))
        .catch(err => next(err))
    }
})

// Article functionality goes here
let staticArticleData = {};

// fetch data from mockaroo on initialization, use this as a dynamic database until
// mongo is available -DC @ 6:18 PM November 7th, 2021
;(() => {
    if(process.env.DEBUG)
    {
        console.log("simulating a fetch of some data from mockaroo")

        // fuck async for now, since we're doing this
        // on start time
        const debug_mock = fs.readFileSync('./article_schema.json'); 
        staticArticleData = JSON.parse(debug_mock).map(article => 
        ({
            // we need to do this in order to append comments to each article.
            article_name: article.article_name,
            article_text: article.article_text,
            image_url   : article.image_url,
            poster_name : article.poster_name,
            rating      : article.rating,
            comments    : []
        }));

        // article_data.map(article => console.log(article))
    }
    else
    {
        console.log("actually fetching data from mockaroo")
        axios.get(`https://my.api.mockaroo.com/article_schema.json?key=${process.env.ARTICLE_API_KEY}`) // article mock data
            .then(response => staticArticleData = (response.data).map(article => 
            ({
            // we need to do this in order to append comments to each article.
                article_name: article.article_name,
                article_text: article.article_text,
                image_url   : article.image_url,
                poster_name : article.poster_name,
                rating      : article.rating,
                comments    : []           
            })))
            .catch(err => console.log(err.stack))
    }
})()

// when a user request to post a comment
app.post('/articles/:name/comment', (req, res, next) => {
    // with help with express's jsonParser this is very easy :)!
    // I'm going to keep this functionality just like 4chan and other
    // traditional forum spaces that allow for anonymous posting. Post 
    // anything you want and say you are whoever you want to be!

    const name     = req.params.name;
    let articleObj = staticArticleData.find(article => article.article_name == name);
    
    if(!articleObj)
    {
        res.json({success: false, error: "how did you even get here!? bad coder detected."});
        return;
    }

    const _username    = req.body.user;
    const _comment     = req.body.comment; 
    const _rating      = req.body.rating;

    if(!_username || !_comment || !_rating)
        res.json({success: false, error: `missing something: ${_username} ${_comment} ${_rating} !`})
    else
    {
        // some sanity checks here if you want to prevent toxicity:

        // append comment object to our articleObj
        const comObj = ({
            username: _username,
            comment:  _comment,
            rating:  _rating,
        }); 

        articleObj.comments.push(comObj);
        res.json({success:true, comObj});

        // send our comment data back to append to front-end's local copy of 
        // comment
    }
})


// get the trimmed article data from the express server to preview all articles -DC @ 6:53 PM Nov. 7th, 2021
app.get('/articles', (req, res, next) => {      
    res.json(staticArticleData.map((article) => 
    ({ 
        article_name  : article.article_name,
        article_text  : article.article_text.substring(0, 100),
        article_poster: article.poster_name,
    })))
})

// get the article data from the express server -DC @ 6:53 PM Nov. 7th, 2021
app.get('/articles/:name', (req, res, next) => {
    const name       = req.params.name;
    const articleObj = staticArticleData.find(article => article.article_name === name);
    if(!articleObj) // null
    {
        res.json({
            success: false,
            error: "Error 404: article does not exist!"
        })
    }
    else 
    {
        res.json({
            success: true,
            data: articleObj
        })
    }
})

app.get('/games_data/:id', (req,res,next) => {
    if(process.env.DEBUG){
        res.json({
            type: 'game',
            id: req.params.id,
            title: 'Debugging Title',
            user: 'johnsmith1',
            rating: 5.78,
            lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        })
    }else{
        //use global mockaroo key and return mock data
        axios.get(`https://my.api.mockaroo.com/page_data.json?key=${process.env.API_KEY}1ed32ac0&type=game&id=${req.params.id}`) //random mock data
        .then(response => res.json(response.data))
        .catch(err => next(err))
    }
})

app.get('/images/:id', (req,res,next)  => {
    //picsum has no data limit so we don't need debug mode
    axios.get(`https://picsum.photos/id/${req.params.id}/info`) //will return JSON for _specific photo_ from picsum
    .then(response => res.json(response.data))
    .catch(err => next(err))
})


//return indices of featured articles for home page
app.get('/top_articles', (req,res,next) => {
    if(process.env.DEBUG){
        res.json({id1: 1, id2: 2})
    }else{
        //use global mockaroo key and return mock data
        axios.get(`https://my.api.mockaroo.com/top.json?key=${process.env.API_KEY}`) //indices of top articles
        .then(response => res.json(response.data))
        .catch(err => next(err))
    }
    
})

//return indices of featured games for home page
app.get('/top_games', (req,res,next) => {
    if(process.env.DEBUG){
        res.json({id1: 1, id2: 2})
    }else{
        axios.get(`https://my.api.mockaroo.com/top.json?key=${process.env.API_KEY}`) //indices of top games
        .then(response => res.json(response.data))
        .catch(err => next(err))
    }
    
})

//get information for registration
app.post('/register', (req,res,next) => {
    console.log(req.body)
    //missing username
    if(!req.body.username){
        res.status(400).json({error: 'Username is required'})
    }
    //missing email
    if(!req.body.email){
        res.status(400).json({error: 'Email is required'})
    }
    //missing password
    if(!req.body.password){
        res.status(400).json({error: 'Password is required'})
    }
    //missing password confirmation
    if(!req.body.confirm_password){
        res.status(400).json({error: '{Password confirmation is required'})
    }
    //passwords do not match
    if(req.body.password != req.body.confirm_password){
        res.status(400).json({error: 'Passwords do not match'})
    }
    if(req.body.password.length < 6){
        res.status(400).json({error: 'Password must be at least 6 characters'})
    }
    //link to database goes here

    res.json({
        status: 'Success!'
    })
})

app.post('/login', (req,res,next) => {
    console.log(req.body)
    //missing username
    if(!req.body.username){
        res.status(400).json({error: 'Username is required'})
    }
    //missing password
    if(!req.body.password){
        res.status(400).json({error: 'Password is required'})
    }
                //we'll check password against database instead of comparing a string
    if(req.body.password == 'password'){
        res.json({
            status: 'Success!'
        })
    }else{
        res.status(400).json({error: 'Password submitted does not match our records'})
    }
})

app.get('/games', (req,res,next) => {
    if(process.env.DEBUG){
        res.json({id1: 1, id2: 2})
    }else{
        axios.get(`https://my.api.mockaroo.com/game_test_two.json?key=77851f20`) //list of games
        .then(response => res.json(response.data))
        .catch(err => next(err))
    }
})

app.get("/games/:id", (req, res, next) => {
    if(process.env.DEBUG){
        res.json({
            id: req.params.id,
            title: 'CSGO',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        })
    }else{
        //use global mockaroo key and return mock data
        axios.get(`https://my.api.mockaroo.com/game.json?key=77851f20&id=${req.params.id}`) //random mock data
        .then(response => res.json(response.data))
        .catch(err => next(err))
    }
})

app.get('/query', (req, res, next) => {
    const search = req.query
    res.json = search
})

app.get('/params/:tile', (req, res, next) => {
    const params = req.params
    res.json({
        params:params
    })
})

module.exports = app