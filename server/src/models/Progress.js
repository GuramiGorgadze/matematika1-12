import mongoose from "mongoose";

const { Schema } = mongoose;

/** One practice problem for one student. Merged with $max so several devices never lose progress. */
const progressSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    problemId: { type: String, required: true, maxlength: 80 },
    lessonId: { type: String, maxlength: 40 },
    tries: { type: Number, default: 0 },
    solved: { type: Boolean, default: false },
    firstTry: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
    lastAt: { type: Date },
  },
  { timestamps: true },
);

progressSchema.index({ student: 1, problemId: 1 }, { unique: true });

export const Progress = mongoose.models.Progress || mongoose.model("Progress", progressSchema);
