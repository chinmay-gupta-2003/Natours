export function showAlert(type, message) {
  hideAlert();

  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  window.setTimeout(hideAlert, 2400);
}

export function hideAlert() {
  const alertPopup = document.querySelector('.alert');

  if (alertPopup) alertPopup.parentElement.removeChild(alertPopup);
}
