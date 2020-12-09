const express = require('express');
const merchandiseController = require('./../controllers/merchandiseController');

const router = express.Router();

router
    .route('/')
    .get(merchandiseController.getAllMerchandises)
    .post(merchandiseController.createMerchandise)

router
    .route('/:id')
    .get(merchandiseController.getOneMerchandise)
    .delete(merchandiseController.deleteMerchandise)

module.exports = router;