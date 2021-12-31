const mongoose = require("mongoose");
const moment = require("moment-timezone");

const schema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  created_at: {
    type: Date,
    default: moment(new Date()).tz("Europe/Moscow").format()
  }
});

module.exports = mongoose.model("User", schema);
