const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", schema);
