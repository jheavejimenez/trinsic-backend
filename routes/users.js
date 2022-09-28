const router = require('express').Router();
let User = require('../models/user.model');

router.route('/').post(async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email});
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

module.exports = router;
