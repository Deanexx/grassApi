const nodemailer = require('nodemailer');

const sendEmail = async (messageObj) => {
    let transporter = nodemailer.createTransport({
        service: "Mail.ru",
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: 'e_l-d_a-r@mail.ru',
        subject: "Password change",
        to: messageObj.to,
        text: `${messageObj.message}`
    }

    // send mail with defined transport object
    let info = await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;