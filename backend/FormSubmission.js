import mongoose from 'mongoose';

// Mongoose Schema for Observer Report Form submissions (from frontend userform.jsx)
const formSubmissionSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    primaryCity: { type: String, required: true },
    customCity: { type: String, default: '' },
    resolvedCity: { type: String, required: true },
    observerRole: { type: String, required: true },
    observedCondition: { type: String, required: true },
    perceivedAqiImpact: { type: String, required: true },
    thermalComfortLevel: { type: String, required: true },
    triggerHeatAlert: { type: Number, default: null },
    triggerAqiAlert: { type: Number, default: null },
    notificationChannels: { type: [String], default: [] },
    fieldNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

const FormSubmission = mongoose.model('FormSubmission', formSubmissionSchema);

export default FormSubmission;

