const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true },
    title: { type: String, maxlength: 320, required: true },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", schema);
