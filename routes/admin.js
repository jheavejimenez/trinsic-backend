const router = require('express').Router();
let Certificate = require('../models/certificate.model');
const client = require('@sendgrid/mail');
const { credentialsClient } = require("../utils/trinsicConfigs");


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
const sendEmail = async (encodedData, email, name) => {
    const emailData = message(email, name, encodedData);
    client.setApiKey(process.env.SENDGRID_API_KEY);
    client.send(emailData).then(() => console.log('Mail sent successfully')).catch(error => {
        console.error(error);
    });
}

router.route('/').get(async (req, res) => {
    const certificates = await Certificate.find({ isApprove: false });
    res.json(certificates);
})

router.route('/schema').get(async (req, res) => {
    try {
        let credentialDefinitions = await credentialsClient.listCredentialDefinitions();
        res.json(credentialDefinitions);
    } catch (err) {
        console.log(err);
    }
}).post(async (req, res) => {
    try {
        const { schemaName, schemaVersion, schemaAttributes } = req.body;
        let credentialDefinition = await credentialsClient.createCredentialDefinition({
            name: schemaName,
            version: schemaVersion,
            attributes: schemaAttributes,
            supportRevocation: true, // Enable revocation at a later date
            tag: "Default" // Tag to identify the schema
        });
        res.json(credentialDefinition);
    } catch (err) {
        console.log(err);
        res.status(500).json(`error ${err}`)
    }
})

router.route('/:id').put(async (req, res) => {
    try {
        const { firstName, lastName, email, course, isApprove } = req.body;
        await sendEmail(email, firstName)

        const update = { firstName, lastName, email, course };
        const updatedCertificate = await Certificate.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(updatedCertificate)
    } catch (err) {
        console.log(err);
        res.status(500).json(`error ${err}`)
    }
})

module.exports = router;
