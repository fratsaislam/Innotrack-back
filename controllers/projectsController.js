const Project = require('../models/projectModel');
const User = require('../models/userModel');

exports.getProjects = async (req, res) => {
    const { page } = req.query;
    const projectsPerPage = 9;

    try{
        let pageNum = 0;
        if(page >= 1){
            pageNum = page - 1;
        }else{
            pageNum = 0;
        }

        const result = await Project.find().sort({ createdAt: -1 }).skip(pageNum * projectsPerPage).limit(projectsPerPage).populate({ path: 'users', select: 'username'});
        res.status(200).json({ success: true, message: 'projects', data:result});
    }catch(err){
        console.log(err);
    }
}

exports.singleProject = async (req, res) => {
    const {_id} = req.query;

    try{
        const result = await Project.find({ _id }).populate({ path: 'users', select: 'username' })
        res.status(200).json({ success: true, message: 'projects', data:result });
    }catch(err){
        console.log(err);
    }
}

exports.userProjects = async (req, res) => {
    const { email } = req.user;
    try{
        const user = await User.findOne({email});
        const userId = user.id;
        const result = await Project.find({ users: userId }).populate({ path:'users', select: 'username' });
        res.status(200).json({ success: true, message: `projects of : ${email}`, data: result });
    }catch(err){
        console.log(err);
    }
}

exports.createProject = async (req, res) => {
    const { title, users = [], description, category } = req.body;

    try{
        const foundUsers = await User.find({ email: { $in: users } }); //$in means array

        // Optional: validate all email were found
        if (foundUsers.length !== users.length) {
        return res.status(400).json({ 
            success: false, 
            message: "One or more email not found." 
        });
        }

        // Extract user IDs
        const userIds = foundUsers.map(user => user._id);

        const project = await Project.create({
                title,
                description,
                users: userIds,
                category
            }
        );

        res.status(201).json({ success: true, message: "project created !", data: project });
    }catch(err){
        console.log(err);
    }
}

exports.accpetProject = async (req, res) => {
    const { _id } = req.query;

    try{
        const existingProject = await Project.findOne({ _id });
        if(!existingProject){
            return res.status(404).json({ success: false, message: "Project does not exist !"});
        }

        if(existingProject.accepted){
            return res.status(400).json({ success: false, message: "Project already accepted !"});
        }

        existingProject.accepted = true;
        const result = existingProject.save();
        res.status(200).json({ success: true, message: "project accpeted!", data: result});
    }catch(err){
        console.log(err);
    }
}

exports.updateProject = async (req, res) => {
    const { progress, details } = req.body;
    const { _id } = req.query;

    try{
        const existingProject = await Project.findOne({ _id });
        if(!existingProject){
            return res.status(404).json({ success: false, message: "Project does not exist !"});
        }

        if(progress){
            existingProject.progress = progress;
        }

        if (details) {
            if (Array.isArray(details)) {
              existingProject.details.push(...details); // spread array
            } else {
              existingProject.details.push(details); // single string
            }
        }
          
        const result = await existingProject.save();
        res.status(200).json({ success: true, message: "project updated!", data: result});
    }catch(err){
        console.log(err);
    }
}

exports.deleteProject = async (req, res) => {
    const { _id } = req.query;

    try{
        const existingProject = await Project.findOne({ _id });
        if(!existingProject){
            return res.status(404).json({ success: false, message: "Project does not exist !"});
        }

        const result = await Project.deleteOne({ _id });
        res.status(200).json({ success: true, message: "project deleted!", data: result});
    }catch(err){
        console.log(err);
    }
}