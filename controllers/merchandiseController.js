const merchandiseModel = require('./../models/merchandiseModel');
const factory = require('./handlerFactory');

exports.getAllMerchandises = factory.getAll(merchandiseModel)
exports.getOneMerchandise = factory.getOne(merchandiseModel);
exports.createMerchandise = factory.createOne(merchandiseModel);
exports.deleteMerchandise = factory.deleteOne(merchandiseModel);