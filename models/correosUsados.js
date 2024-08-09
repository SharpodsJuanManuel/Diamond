const mongoose = require('mongoose');

const UsedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

const correosUsados = mongoose.model('DiamondEmailUsed', UsedEmailSchema);

module.exports = correosUsados;
