const mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
    title: {

    },
    description: {
        type: String,
        required: true,
    },
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    category: {
        type: String,
    },
    progress: {
        type: Number,
    },
    details: [
        {
            type: String
        }
    ],
    accepted: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);