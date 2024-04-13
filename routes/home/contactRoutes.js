const router = require('express').Router();
const { add_contact_data } = require('../../controller/contact/contactController');

router.post('/contact-form', add_contact_data);

module.exports = router;