import mongoose from "mongoose";
import diarySchema from "./diarySchema.js";

const Diary = mongoose.model("Diary", diarySchema);

export default Diary;
