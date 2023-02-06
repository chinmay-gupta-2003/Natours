import { showAlert } from './alert.js';
import { signup, login, logout } from './auth.js';
import { displayMap } from './leaflet.js';
import { hideLoader, viewLoader } from './loader.js';
import { bookTour } from './stripe.js';
import { updateSettings } from './updateUserData.js';

const loginForm = document.querySelector('.login-form');
const logoutBtn = document.querySelector('.nav__el--logout');
const signupForm = document.querySelector('.signup-form');
const mapCont = document.getElementById('map');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const loader = document.querySelector('.loader-container');
const btnBookTour = document.querySelector('.btn--book-tour');

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = signupForm.querySelector('#name').value;
    const email = signupForm.querySelector('#email').value;
    const password = signupForm.querySelector('#password').value;
    const confirmPassword = signupForm.querySelector('#confirm-password').value;

    signup(name, email, password, confirmPassword, loader);
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('#email').value;
    const password = loginForm.querySelector('#password').value;

    login(email, password);
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (mapCont) {
  const locations = JSON.parse(mapCont.dataset.locations);
  displayMap(locations);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append('name', userDataForm.querySelector('#name').value);
    form.append('email', userDataForm.querySelector('#email').value);
    form.append('photo', userDataForm.querySelector('#photo').files[0]);

    updateSettings(form, 'Data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = userPasswordForm.querySelector('.btn');
    const currentPassword =
      userPasswordForm.querySelector('#password-current').value;
    const newPassword = userPasswordForm.querySelector('#password').value;
    const confirmPassword =
      userPasswordForm.querySelector('#password-confirm').value;

    submitBtn.innerHTML = 'Updating...';

    await updateSettings(
      { currentPassword, newPassword, confirmPassword },
      'Password'
    );

    submitBtn.innerHTML = 'Save password';
  });
}

if (btnBookTour) {
  btnBookTour.addEventListener('click', async (e) => {
    const { tourId } = e.target.dataset;

    e.target.textContent = 'Processing...';
    await bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage);

window.addEventListener('load', () => {
  hideLoader(loader);
});
