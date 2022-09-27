const router = require('express').Router();
let Certificate = require('../models/certificate.model');
const axios = require("axios");
const {affinidi} = require("../utils/apiConfig");
const client = require('@sendgrid/mail');


const message = (email, name, value) => {
    return {
        "personalizations":
            [
                {
                    "to": [
                        {
                            "email": `${email}`,
                            "name": `${name}`
                        }
                    ]
                }
            ],
        "from":
            {
                "email":
                    "emman@xperto.ph",
                "name":
                    "XPERTO"
            }
        ,
        "subject":
           `Hi ${name}, here's your certificate`,
        "content":
            [
                {
                    "type": "text/html",
                    "value": `<a href="http://localhost:3000/wallet/login?${value}">http://localhost:3000/wallet/login?${value}</a>`
                }
            ]
    }
}

router.route('/').get(async (req, res) => {
    const certificates = await Certificate.find({isApprove: false});
    res.json(certificates);
})

const login = async () => {
    const login = await axios.post(`${affinidi}/users/login`, {
        username: process.env.USERNAME,
        password: process.env.PASSWORD

    }, {
        headers: {"Content-Type": "application/json", "Api-Key": process.env.REACT_APP_API_KEY_HASH}
    })
    return login.data.accessToken
}

const signVc = async (accessToken, data) => {
    const sign = await axios.post(`${affinidi}/wallet/sign-credential`, {"unsignedCredential": data}, {
        headers: {
            "Content-Type": "application/json",
            "Api-Key": process.env.REACT_APP_API_KEY_HASH,
            "Authorization": `Bearer ${accessToken}`
        }
    })

    // convert to base64
    const base64 = Buffer.from(JSON.stringify(sign.data)).toString('base64');

    // encodeComponent to avoid special characters
    const encoded = encodeURIComponent(base64);
    const claimId = sign.data.signedCredential.id

    return {encoded, claimId}
}

const sendEmail = async (encodedData, email, name) => {
    const emailData = message(email, name, encodedData);
    client.setApiKey(process.env.SENDGRID_API_KEY);
    client.send(emailData).then(() => console.log('Mail sent successfully')).catch(error => {
        console.error(error);
    });
}
router.route('/:id').put(async (req, res) => {
    try {
        const {firstName, lastName, email, course, isApprove, unsignedCredentials} = req.body;
        const accessToken = await login()
        const {encoded, claimId} = await signVc(accessToken, unsignedCredentials)
        await sendEmail(encoded, email, firstName)

        const update = {firstName, lastName, email, course};
        const updatedCertificate = await Certificate.findByIdAndUpdate(req.params.id, update, {new: true});
        res.json(updatedCertificate)
    } catch (err) {
        console.log(err);
        res.status(500).json(`error ${err}`)
    }
})

module.exports = router;
