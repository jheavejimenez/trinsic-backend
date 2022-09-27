const router = require('express').Router();
let User = require('../models/user.model');

router.route('/').post(async (req, res) => {
    try {
        const user = await User.findOne({username: req.body.username});
        if (user) {
            res.json(user);
        } else {
            const newUser = new User(req.body);
            await newUser.save();
            res.json(newUser);
        }
    } catch(err) {
        res.status(400).json('error')
    }
});

router.route('/get-user-did/:id').get(async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user.did)
});

module.exports = router;
