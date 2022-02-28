import jwt from 'jsonwebtoken';
export const generateJsonWebToken = (uidPerson) => {
    return new Promise((resolve, reject) => {
        const payload = { uidPerson };
        jwt.sign(payload, process.env.APP_KEY_JWT, {
            expiresIn: '12h'
        }, (err, token) => {
            if (!err) resolve(token);
            else reject('Error Generate a Token');
        });
    });
}


export const validateToken = () => {
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    try {
        var token = req.headers.authorization.split(' ')[1];
        const verified = jwt.verify(token, jwtSecretKey);
        if (verified) {
            return res.status(401).send("error");
        } else {
            // Access Denied
            return res.status(401).send("something wrong has happened please check your token");
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send("ACCESS DENIED");
    }

}