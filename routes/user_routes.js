const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');

const userDatabase = require('../database/user_database');

const helperWithUserDB = require('../helpers/helper_with_userDB');
const generateRandomString = require('../helpers/random_string');

const { isEmailOccupied, getUserFromEmail } = helperWithUserDB(userDatabase);

//========GET===========//

// Logout user
router.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Sign up page
router.get('/register', (req, res) => {
  const templateVars = {
    user: null,
  };

  res.render('user_sign_up', templateVars);
});

// Sign in page
router.get('/login', (req, res) => {
  const userId = req.session.userId;
  const user = userDatabase[userId];
  if (user) {
    res.redirect('/urls');
  }

  const templateVars = {
    user: null,
  };

  res.render('user_sign_in', templateVars);
});

//==========POST===========//

// Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserFromEmail(email);

  if (!user) {
    return res
      .status(403)
      .render('bad_request', {
        page: 'sign-in',
        msg: 'User credentials are invalid',
      });
  }

  bcrypt.compare(password, user.password).then(response => {
    if (response) {
      req.session.userId = user.id;
      return res.redirect('/urls');
    } else {
      res
        .status(400)
        .render('bad_request', {
          page: 'sign-in',
          msg: 'User credentials are invalid',
        });
    }
  });
});

// Sign up user
router.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (email === '' || password === '') {
    return res
      .status(400)
      .render('bad_request', {
        page: 'sign-up',
        msg: 'Please input correctly',
      });
  }

  if (isEmailOccupied(email)) {
    return res
      .status(400)
      .render('bad_request', { page: 'sign-up', msg: 'User already exists' });
  }

  const userRandomId = generateRandomString(8);

  const newUser = { email, password, id: userRandomId };

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      newUser.password = hash;
      userDatabase[userRandomId] = newUser;

      req.session.userId = userRandomId;
      res.redirect('/urls');
    });
  });
});

module.exports = router;
