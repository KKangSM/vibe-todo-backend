import mongoose from "mongoose";
import memoSchema from "./memoSchema.js";

const Memo = mongoose.model("Memo", memoSchema);

export default Memo;
