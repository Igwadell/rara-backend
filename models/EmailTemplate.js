import mongoose from 'mongoose';

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a template name'],
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add an email subject'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please add template content']
  },
  description: {
    type: String,
    required: [true, 'Please add a template description']
  },
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: true
    }
  }],
  category: {
    type: String,
    enum: ['booking', 'user', 'property', 'payment', 'system'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Method to compile template with variables
EmailTemplateSchema.methods.compile = function(variables) {
  let compiled = this.content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiled = compiled.replace(regex, value);
  }
  return compiled;
};

// Validate that all required variables are provided
EmailTemplateSchema.methods.validateVariables = function(variables) {
  const requiredVars = this.variables.filter(v => v.required).map(v => v.name);
  const providedVars = Object.keys(variables);
  const missingVars = requiredVars.filter(v => !providedVars.includes(v));
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
  }
  return true;
};

export default mongoose.model('EmailTemplate', EmailTemplateSchema); 