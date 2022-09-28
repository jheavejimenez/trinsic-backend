const router = require('express').Router();
let Certificate = require('../models/certificate.model');
let User = require('../models/user.model');
const axios = require("axios");
const {mongoose} = require('mongoose');

router.route('/').get(async (req, res) => {
    const certificates = await Certificate.find({isApprove: true})
    res.json(certificates)
}).post(async (req, res) => {
    const newCertificate = new Certificate(req.body);
    newCertificate.save()
        .then(() => res.json(newCertificate))
        .catch(err => res.status(500).json(`error ${err}`));
});

router.route('/dashboard/:id').get(async (req, res) => {
    const certificates = await Certificate.find({user: req.params.id});
    res.json(certificates);
})
router.route('/confirm-signup/:id').put(async (req, res) => {
    const updatedCertificate = await User.findByIdAndUpdate(req.params.id, {did: "akda"}, {new: true});
    res.json(updatedCertificate)

})

router.route('/login/otp').post(async (req, res) => {

});


module.exports = router;
