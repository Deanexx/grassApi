const mongoose = require("mongoose");

const merchandiseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Should have a title'],
        trim: true
    },
    price: {
        type: String,
        required: [true, 'Should have a price'],
    },
    cnt: {
        type: String,
        required: [true, 'Should have a quantity'],
    },
    desc: {
        type: String,
        required: [true, 'Should have a desc'],
        trim: true
    },
    spray_bottle: {
        select: this.type === 'grain',
        type: [String]
    },
    reviews: {
        type: Array
    },
    img: {
     type: [String],
     required: [true, 'Should have pics']
    },
    type: String
})

module.exports = mongoose.model("Merchandise", merchandiseSchema)