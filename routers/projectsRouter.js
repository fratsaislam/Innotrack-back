const express = require("express");
const router = express.Router();

const projectsController = require("../controllers/projectsController");
const { identifier } = require('../middlewares/identification');
const { adminCheck} = require('../middlewares/adminOnly');

router.get('/all-projects', adminCheck, projectsController.getProjects);
router.get('/single-project', identifier, projectsController.singleProject);
router.get('/user-projects', identifier, projectsController.userProjects);
router.post('/create-project', identifier, projectsController.createProject);
router.patch('/accept-project', adminCheck, projectsController.accpetProject);
router.patch('/update-project', identifier, projectsController.updateProject);
router.delete('/delete-project', adminCheck, projectsController.deleteProject);

module.exports = router;