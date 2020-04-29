const nodemailer = require('nodemailer')

function send(to, subject, text, html, callback) {
    let transporter = nodemailer.createTransport({
        host: process.env.host,
        port: 587,
        secure: false, // upgrade later with STARTTLS
        auth: {
          user: process.env.username,
          pass: process.env.password
        }
    })
    transporter.verify(function(error, success) {
        if (error) {
            callback(error)
        } else {
            console.log("Server is ready to take our messages")
            let data = {
                from: process.env.email,
                to: to,
                subject: subject,
                text: text,
                html: html
            }
            transporter.sendMail(data, (err, info) => {
                if(err) {
                    callback(err)
                } else {
                    console.log("MAIL SENT: " + JSON.stringify(info.accepted))
                    callback(null, info)
                }
            })
        }
    });
}  

module.exports = {
    send: send
}