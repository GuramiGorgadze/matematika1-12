import mongoose from "mongoose";

const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 40 },
    lastName: { type: String, required: true, trim: true, maxlength: 40 },
    school: { type: String, required: true, trim: true, maxlength: 80 },
    grade: { type: Number, required: true, min: 1, max: 12 },
    /** normalised first|last|school|grade — the sign-in identity */
    key: { type: String, required: true, unique: true },

    activity: {
      visits: { type: Number, default: 0 },
      seconds: { type: Number, default: 0 },
      /** "YYYY-MM-DD" → active seconds that day */
      days: { type: Map, of: Number, default: () => new Map() },
      firstSeenAt: { type: Date, default: Date.now },
      lastSeenAt: { type: Date, default: Date.now },
    },

    /** practice-problem summary reported by the client (it knows the curriculum) */
    stats: {
      solved: { type: Number, default: 0 },
      firstTry: { type: Number, default: 0 },
      tries: { type: Number, default: 0 },
      lessonsDone: { type: Number, default: 0 },
      updatedAt: { type: Date },
    },

    sheets: {
      dirty: { type: Boolean, default: true, index: true },
      syncedAt: { type: Date },
      error: { type: String },
    },
  },
  { timestamps: true },
);

studentSchema.index({ grade: 1, lastName: 1 });
studentSchema.index({ "activity.lastSeenAt": -1 });

export const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
