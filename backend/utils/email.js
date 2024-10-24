const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gagenikolov50@gmail.com',
        pass: 'ijif cbht ohua xzh',
    },
});

function transporterSendMail(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

function sendWithdrawalEmail(username, address, amount) {
    const mailOptions = {
        from: 'gagenikolov50@gmail.com',
        to: 'gagenikolov.z@gmail.com',
        subject: 'New Withdrawal Request',
        text: `User ${username} has requested a withdrawal on the exchange. Amount: ${amount} Address: ${address}`,
    };
    transporterSendMail(mailOptions);
}

function sendPositionOpenEmail(username, position) {
    let liquidationPrice = 0;
    if (position.positionType == 'Short')
        liquidationPrice = (position.entryPrice * (125 + position.leverage / 100)) / 125;
    if (position.positionType == 'Long')
        liquidationPrice = (position.entryPrice * (125 - 100 / position.leverage)) / 125;
    const mailOptions = {
        from: 'gagenikolov50@gmail.com',
        to: 'gagenikolov.z@gmail.com',
        subject: 'New Position Opened',
        text: `${position.id} user ${username} opened ${position.positionType} ${position.orderType} ${position.assetType} Amount: ${position.amount} Leverage: ${position.leverage} Entry: ${position.entryPrice} Liquidation: ${liquidationPrice}`,
    };
    transporterSendMail(mailOptions);
}

function sendPositionTPEmail(username, position) {
    const mailOptions = {
        from: 'gagenikolov50@gmail.com',
        to: 'gagenikolov.z@gmail.com',
        subject: 'Position TP set',
        text: `${position.id} user ${username} set TP ${position.tp}`,
    };
    transporterSendMail(mailOptions);
}

function sendPositionSLEmail(username, position) {
    const mailOptions = {
        from: 'gagenikolov50@gmail.com',
        to: 'gagenikolov.z@gmail.com',
        subject: 'Position SL set',
        text: `${position.id} user ${username} set SL ${position.sl}`,
    };
    transporterSendMail(mailOptions);
}

function sendPositionClosedEmail(username, position, exitPrice) {
    const mailOptions = {
        from: 'gagenikolov50@gmail.com',
        to: 'gagenikolov.z@gmail.com',
        subject: 'Position closed',
        text: `${position.id} user ${username} closes position, Exit price: ${exitPrice}`,
    };
    transporterSendMail(mailOptions);
}

module.exports = {
    sendWithdrawalEmail,
    sendPositionOpenEmail,
    sendPositionTPEmail,
    sendPositionSLEmail,
    sendPositionClosedEmail,
};