const router = require('express').Router();
let Certificate = require('../models/certificate.model');
let User = require('../models/user.model');
const axios = require("axios");
const {affinidi} = require("../utils/apiConfig");
const {mongoose} = require('mongoose');


const confirmSignUp = async (token, confirmationCode) => {
    const otp = await axios.post("https://cloud-wallet-api.prod.affinity-project.org/api/v1/users/sign-in-passwordless/confirm",
        {
            "token": token,
            "confirmationCode": confirmationCode
        }, {
            headers: {
                "Content-Type": "application/json",
                "Api-Key": process.env.REACT_APP_API_KEY_HASH
            }
        })
    const signInType = JSON.parse(token)
    if (signInType === 'signUp') {
        return otp.data.did
    }
    return otp.data.accessToken
}

const passwordLessSignIn = async (data) => {
    const signIn = await axios.post("https://cloud-wallet-api.prod.affinity-project.org/api/v1/users/sign-in-passwordless",
        {"username": data.email}, {
            headers: {
                "Content-Type": "application/json",
                "Api-Key": process.env.REACT_APP_API_KEY_HASH || '',
            }
        })

    return signIn.data
}
const storeCertificate = async (parsed, accessToken) => {
    const store = await axios.post("https://cloud-wallet-api.prod.affinity-project.org/api/v1/wallet/credentials",
        {"data": parsed}, {
            headers: {
                "Content-Type": "application/json",
                "Api-Key": process.env.REACT_APP_API_KEY_HASH,
                "Authorization": `Bearer ${accessToken}`
            }
        })
    return store.data
}

const decoder = (data) => {

}
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
    const update = await confirmSignUp(req.body)
    const updatedCertificate = await User.findByIdAndUpdate(req.params.id, {did: update}, {new: true});
    res.json(updatedCertificate)

})

router.route('/login/otp').post(async (req, res) => {
    const {token, confirmationCode, encodedData} = req.body;
    const accessToken = await confirmSignUp(token, confirmationCode)
    const decodedData = decodeURIComponent(encodedData)
    const decoded = Buffer.from(decodedData, 'base64').toString('ascii');
    const parsed = JSON.parse(decoded)
    const claim = await storeCertificate(parsed.signedCredential, accessToken)
    res.json(claim)
});


module.exports = router;
