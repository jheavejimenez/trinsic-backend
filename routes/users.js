const router = require('express').Router();
let User = require('../models/user.model');
const client = require('@sendgrid/mail');
const { credentialsClient } = require("../utils/trinsicConfigs");

const message = (email, value) => {
    return {
        "personalizations":
            [
                {
                    "to": [
                        {
                            "email": `${email}`,
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
            `Hi please scan the image below to join XPERTO`,
        "content":
            [
                {
                    "type": "text/html",
                    "value": `<img alt="QR Code" src="${value}"/>`
                }
            ]
    }
}

const sendEmail = async (encodedData, email) => {
    const emailData = message(email, encodedData);
    client.setApiKey(process.env.SENDGRID_API_KEY);
    client.send(emailData).then(() => console.log('Mail sent successfully')).catch(error => {
        console.error(error);
    });
}

router.route('/').post(async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            res.json(user);
        } else {
            const newUser = new User(req.body);
            await newUser.save();

            let connection = await credentialsClient.createConnection({
                name: null,
                connectionId: null,
                multiParty: false
            });

            let qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${connection.invitationUrl}&chs=300x300&chld=L|1`
            await sendEmail(qrCodeUrl, req.body.email);

            res.json(newUser);
        }
    } catch (err) {
        res.status(400).json('error')
    }
});

module.exports = router;
