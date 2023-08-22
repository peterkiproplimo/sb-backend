// src/routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/create', userController.createUser);
router.get('/list', userController.getUsers); // Add the route to fetch users
router.post('/register', userController.createUser);

module.exports = router;
