// src/routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/authController');
 
const router = express.Router();

router.get('/create', userController.gameResult);

module.exports = router;
