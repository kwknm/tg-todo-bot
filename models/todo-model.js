const mongoose = require("mongoose");
const moment = require("moment-timezone");

const schema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  title: { type: String, maxlength: 320, required: true },
  completed: { type: Boolean, default: false },
  created_at: {
    type: Date,
    default: moment(new Date()).tz("Europe/Moscow").format()
  }
});

module.exports = mongoose.model("Todo", schema);
