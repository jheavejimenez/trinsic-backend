const router = require('express').Router();
let Certificate = require('../models/certificate.model');
const { credentialsClient } = require("../utils/trinsicConfigs");
const client = require("@sendgrid/mail");
const User = require("../models/user.model");

/* get all certificates that is not approve */
router.route('/').get(async (req, res) => {
    const certificates = await Certificate.find({ isApprove: false });
    const users = await User.find();
    const result = certificates.map((certificate) => {
        const user = users.find((user) => user._id.toString() === certificate.user.toString());
        return {
            _id: certificate._id,
            firstName: certificate.firstName,
            lastName: certificate.lastName,
            email: user.email,
            course: certificate.course,
            isApprove: certificate.isApprove,
        }

    })
    // console.log(result);
    res.json(result);
})

/* connection trinsic */
router.route('/connections').get(async (req, res) => {
    let connections = await credentialsClient.listConnections(null);
    res.json(connections);
})

/* schema trinsic */
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

/* email */
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
            `Hi ${name} Here is your credential`,
        "content":
            [
                {
                    "type": "text/html",
                    "value": `<img alt="QR Code" src="${value}"/>`
                }
            ]
    }
}

const sendEmail = async (encodedData, name, email) => {
    const emailData = message(email, name, encodedData);
    client.setApiKey(process.env.SENDGRID_API_KEY);
    client.send(emailData).then(() => console.log('Mail sent successfully')).catch(error => {
        console.error(error);
    });
}

/* approve application and create offer certificate */
router.route('/:id').put(async (req, res) => {
    try {
        const { firstName, lastName, course, email, isApprove } = req.body;
        const update = { firstName, lastName, course, isApprove };
        const data = {
            "firstname": firstName,
            "lastname": lastName,
            course,
        }
        let credential = await credentialsClient.createCredential({
            definitionId: "BmwFyhx5wWNUZ33SZc41yk:3:CL:88841:Default", // must be dynamic not hard coded
            connectionId: null,
            automaticIssuance: true,
            credentialValues: data,
        });

        let qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${credential.offerUrl}&chs=300x300&chld=L|1`
        await sendEmail(qrCodeUrl, firstName, email);

        await Certificate.findByIdAndUpdate(req.params.id, update, { new: true });

        res.json(credential)
    } catch (err) {
        console.log(err);
        res.status(500).json(`error ${err}`)
    }
})

module.exports = router;
