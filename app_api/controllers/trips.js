const mongoose = require('mongoose');
const Trip = require('../models/travlr');
const Model = mongoose.model('trips');

// GET: /trips - list all trips
const tripsList = async (req, res) => {
  const q = await Model.find({}).exec();

  if (!q) {
    return res.status(404).json({ message: 'No trips found' });
  }

  return res.status(200).json(q);
};

// GET: /trips/:tripCode - find a trip by code
const tripsFindByCode = async (req, res) => {
  const q = await Model.find({ code: req.params.tripCode }).exec();

  if (!q) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  return res.status(200).json(q);
};

// POST: /trips - add a new trip
const tripsAddTrip = async (req, res) => {
  const newTrip = new Trip({
    code: req.body.code,
    name: req.body.name,
    length: req.body.length,
    start: req.body.start,
    resort: req.body.resort,
    perPerson: req.body.perPerson,
    image: req.body.image,
    description: req.body.description
  });

  const q = await newTrip.save();

  if (!q) {
    return res.status(400).json({ message: 'Unable to add trip' });
  }

  return res.status(201).json(q);
};

// PUT: /trips/:tripCode - update an existing trip
const tripsUpdateTrip = async (req, res) => {
  const q = await Model
    .findOneAndUpdate(
      { code: req.params.tripCode },
      {
        code: req.body.code,
        name: req.body.name,
        length: req.body.length,
        start: req.body.start,
        resort: req.body.resort,
        perPerson: req.body.perPerson,
        image: req.body.image,
        description: req.body.description
      },
      { new: true }
    )
    .exec();

  if (!q) {
    return res.status(400).json({ message: 'Trip not found for update' });
  }

  return res.status(201).json(q);
};

module.exports = {
  tripsList,
  tripsFindByCode,
  tripsAddTrip,
  tripsUpdateTrip
};
