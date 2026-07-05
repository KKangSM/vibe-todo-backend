import mongoose from "mongoose";
import todoSchema from "./todoSchema.js";

const Todo = mongoose.model("Todo", todoSchema);

export default Todo;
