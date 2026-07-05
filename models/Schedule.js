import mongoose from "mongoose";
import scheduleSchema from "./scheduleSchema.js";

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;
