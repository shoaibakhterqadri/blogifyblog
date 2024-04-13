const contactModel = require("../../models/contactModel.js");
const formidable = require("formidable");

module.exports.add_contact_data = async (req, res) => {
  const formDataHandle = formidable({
    multiples: true,
  });

  formDataHandle.parse(req, async (err, fields, files) => {
    if (!err) {
      const { name, email, subject, message } = fields;

      try {
        await contactModel.create({
          name,
          email,
          subject,
          message,
        });

        res.status(201).json({
          successMessage: "Contact add successfull",
        });
      } catch (error) {
        console.log(
          "This error is come from contactController page " + error.message
        );
        res.status(500).json({ errorMessage: "Internal server error" });
      }
    }
  });
};