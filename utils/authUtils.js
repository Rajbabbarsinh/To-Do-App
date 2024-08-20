const isEmailRgex = ({key}) => {
    const isEmail =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(
        key
      );
    return isEmail;
  };

const userDataValidation = ({name, email, username, password}) => {
    return new  Promise((resolve, reject) => {
        console.log(name, email, username, password);

    if(!name || !email || !username || !password) 
       reject("Missing User Credentials"); 
       
    if(typeof name !== 'string') reject ('name is not a TEXT');
    if(typeof email !== 'string') reject ('email is not a TEXT'); 
    if(typeof username !== 'string') reject ('username is not a TEXT'); 
    if(typeof password !== 'string') reject ('passsword is not a TEXT');   

    if(username.length <3 || username.length > 15)
      reject ("username length should be 3-15 characters");

    if(!isEmailRgex({key : email})) reject("E-mail Format is Incorrect");  


    resolve();

    });
};

module.exports = {userDataValidation, isEmailRgex};
