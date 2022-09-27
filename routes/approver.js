const router = require('express').Router();
let Certificate = require('../models/certificate.model');
const axios = require("axios");
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
        await sendEmail(email, firstName)

        const update = {firstName, lastName, email, course};
        const updatedCertificate = await Certificate.findByIdAndUpdate(req.params.id, update, {new: true});
        res.json(updatedCertificate)
    } catch (err) {
        console.log(err);
        res.status(500).json(`error ${err}`)
    }
})

module.exports = router;
