const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const Model = mongoose.model('trips');

// GET: /trips - list all trips
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client

const tripsList = async (req, res) => {
    const q = await Model
        .find({}) // no filter, return all records
        .exec();

        // Uncomment the following line to show results of query
        // on the console
        // console.log(q);

    if (!q) 
    { // Database returned no data
        return res
                .status(404)
                .json(err);
    } else { // Return the resulting trip list
        return res
                .status(200)
                .json(q);
    }
};

const tripsFindByCode = async (req, res) => {
    const q = await Model
        .find({'code': req.params.tripCode}) // filter by trip code
        .exec();

        // Uncomment the following line to show results of query
        // on the console
        // console.log(q);

    if (!q) 
    { // Database returned no data
        return res
                .status(404)
                .json(err);
    } else { // Return the resulting trip list
        return res
                .status(200)
                .json(q);
    }
};

module.exports = {
    tripsList,
    tripsFindByCode
};