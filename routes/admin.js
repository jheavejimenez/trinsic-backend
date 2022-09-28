const router = require('express').Router();
let Certificate = require('../models/certificate.model');
const { credentialsClient } = require("../utils/trinsicConfigs");

/* get all certificates that is not approve */
router.route('/').get(async (req, res) => {
    const certificates = await Certificate.find({ isApprove: false });
    res.json(certificates);
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

/* approve application */
router.route('/:id').put(async (req, res) => {
    try {
        const { firstName, lastName, course, isApprove } = req.body;
        const update = { firstName, lastName, course, isApprove };

        const updatedCertificate = await Certificate.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(updatedCertificate)
    } catch (err) {
        console.log(err);
        res.status(500).json(`error ${err}`)
    }
})

module.exports = router;
